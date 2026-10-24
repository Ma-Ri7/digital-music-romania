// =====================================================
// Teste — selectorul manual RO | EN si propunerea de limba
// Nu se apeleaza niciun serviciu extern.
// =====================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  applySwitcherState,
  createSuggestionBanner,
  initLanguageSwitcher
} from "../js/i18n/lang-switcher.js";
import { createLanguageService } from "../js/i18n/index.js";
import { startPageLanguage } from "../js/i18n/page.js";
import { messages as roMessages } from "../js/i18n/locales/ro.js";
import { messages as enMessages } from "../js/i18n/locales/en.js";
import {
  createFakeDomDocument,
  createFakeLangContainer,
  createFakeLocation,
  createFakeStorage
} from "./helpers/fakes.mjs";

function fakeResolver(country) {
  return { async detect() { return country; } };
}

async function readyService(pathname, options = {}) {
  const service = createLanguageService({
    fetchImpl: null,
    pathname,
    storage: options.storage || createFakeStorage(),
    document: options.document || null,
    resolver: fakeResolver(options.country || "DE")
  });

  const result = await service.init();

  return { service, result };
}

describe("applySwitcherState", () => {
  it("seteaza href, hreflang si lang pentru fiecare optiune", async () => {
    const { service } = await readyService("/");
    const { container, links } = createFakeLangContainer();

    applySwitcherState(container, service, "en");

    assert.equal(links.get("ro").getAttribute("href"), "/ro/");
    assert.equal(links.get("en").getAttribute("href"), "/");
    assert.equal(links.get("ro").getAttribute("hreflang"), "ro");
    assert.equal(links.get("en").getAttribute("hreflang"), "en");
    assert.equal(links.get("ro").getAttribute("lang"), "ro");
    assert.equal(links.get("en").getAttribute("lang"), "en");
  });

  it("marcheaza limba activa cu aria-current si o scoate de pe cealalta", async () => {
    const { service } = await readyService("/ro/");
    const { container, links } = createFakeLangContainer();

    applySwitcherState(container, service, "ro");

    assert.equal(links.get("ro").getAttribute("aria-current"), "true");
    assert.equal(links.get("en").getAttribute("aria-current"), null);
  });

  it("eticheteaza containerul si optiunile in limba paginii", async () => {
    const { service } = await readyService("/ro/");
    const { container, links } = createFakeLangContainer();

    applySwitcherState(container, service, "ro");

    assert.equal(container.getAttribute("aria-label"), roMessages["language.switcher.label"]);
    assert.equal(
      links.get("ro").getAttribute("aria-label"),
      "Comută la Română"
    );
    assert.equal(
      links.get("en").getAttribute("aria-label"),
      "Comută la English"
    );
  });

  it("pe pagina engleza etichetele sunt in engleza", async () => {
    const { service } = await readyService("/");
    const { container, links } = createFakeLangContainer();

    applySwitcherState(container, service, "en");

    assert.equal(container.getAttribute("aria-label"), enMessages["language.switcher.label"]);
    assert.equal(links.get("ro").getAttribute("aria-label"), "Switch to Română");
  });

  it("click pe o optiune salveaza preferinta", async () => {
    const storage = createFakeStorage();
    const { service } = await readyService("/", { storage });
    const { container, links } = createFakeLangContainer();

    applySwitcherState(container, service, "en");

    assert.equal(links.get("ro").dispatchEvent("click"), true);
    assert.equal(storage.dump()["dmr.lang"], "ro");

    assert.equal(links.get("en").dispatchEvent("click"), true);
    assert.equal(storage.dump()["dmr.lang"], "en");
  });

  it("tolereaza containere si optiuni lipsa", async () => {
    const { service } = await readyService("/");

    assert.deepEqual([...applySwitcherState(null, service, "en").keys()], []);
    assert.deepEqual(
      [...applySwitcherState(createFakeLangContainer(["ro"]).container, service, "en").keys()],
      ["ro"]
    );
  });
});

describe("createSuggestionBanner", () => {
  it("construieste propunerea cu textele limbii paginii", async () => {
    const { service } = await readyService("/");
    const documentRef = createFakeDomDocument();

    const banner = createSuggestionBanner(documentRef, service, "/ro/", { language: "ro" });

    assert.equal(banner.element.className, "lang-suggestion");
    assert.equal(banner.element.getAttribute("role"), "region");
    assert.equal(banner.element.children.length, 3);
    assert.equal(banner.text.textContent, enMessages["language.suggestion.title"]);
    assert.equal(banner.action.textContent, enMessages["language.suggestion.action"]);
    assert.equal(banner.dismiss.textContent, enMessages["language.suggestion.dismiss"]);
    assert.equal(banner.action.getAttribute("href"), "/ro/");
    assert.equal(banner.dismiss.getAttribute("type"), "button");
  });

  it("pe pagina romaneasca textele propunerii sunt in romana", async () => {
    const { service } = await readyService("/ro/");
    const documentRef = createFakeDomDocument();

    const banner = createSuggestionBanner(documentRef, service, "/");

    assert.equal(banner.text.textContent, roMessages["language.suggestion.title"]);
    assert.equal(banner.action.textContent, roMessages["language.suggestion.action"]);
  });

  it("returneaza null fara document sau fara tinta", async () => {
    const { service } = await readyService("/");

    assert.equal(createSuggestionBanner(null, service, "/ro/"), null);
    assert.equal(createSuggestionBanner(createFakeDomDocument(), service, null), null);
  });
});

describe("initLanguageSwitcher", () => {
  async function setup(options = {}) {
    const { container } = createFakeLangContainer();
    const documentRef = createFakeDomDocument({ "[data-lang-switcher]": container });
    const sessionStorageRef = createFakeStorage(options.session || {});
    const storage = createFakeStorage(options.storage || {});

    const { service, result } = await readyService(options.pathname || "/", {
      storage,
      document: documentRef,
      country: options.country || "DE"
    });

    const ui = initLanguageSwitcher(service, result, {
      document: documentRef,
      sessionStorage: sessionStorageRef
    });

    return { container, documentRef, sessionStorageRef, storage, service, result, ui };
  }

  it("conecteaza optiunile si expune propunerea", async () => {
    const { container, documentRef, ui } = await setup();

    assert.equal(ui.links.size, 2);
    assert.equal(container.getAttribute("aria-label"), enMessages["language.switcher.label"]);

    assert.ok(ui.showSuggestion("/ro/"));
    assert.equal(documentRef.body.children.length, 1);
  });

  it("inchiderea propunerii o retine pentru sesiune", async () => {
    const { documentRef, sessionStorageRef, ui } = await setup();

    const banner = ui.showSuggestion("/ro/");

    banner.dismiss.dispatchEvent("click");

    assert.equal(sessionStorageRef.dump()["dmr.banner"], "hidden");
    assert.equal(documentRef.body.children.length, 0);
    assert.equal(ui.showSuggestion("/ro/"), null, "nu reapare in aceeasi sesiune");
  });

  it("nu afiseaza propunerea de doua ori simultan", async () => {
    const { documentRef, ui } = await setup();

    const first = ui.showSuggestion("/ro/");
    const second = ui.showSuggestion("/ro/");

    assert.equal(first, second);
    assert.equal(documentRef.body.children.length, 1);
  });

  it("respecta inchiderea anterioara din sesiune", async () => {
    const { documentRef, ui } = await setup({ session: { "dmr.banner": "hidden" } });

    assert.equal(ui.showSuggestion("/ro/"), null);
    assert.equal(documentRef.body.children.length, 0);
  });
});

describe("startPageLanguage (punctul de intrare al paginii)", () => {
  function pageOptions(overrides = {}) {
    const { container } = createFakeLangContainer();
    const documentRef = createFakeDomDocument({ "[data-lang-switcher]": container });
    const locationRef = createFakeLocation(overrides.pathname || "/");

    return {
      container,
      documentRef,
      locationRef,
      options: {
        pathname: "/",
        storage: createFakeStorage(),
        sessionStorage: createFakeStorage(),
        document: documentRef,
        location: locationRef,
        resolver: fakeResolver(overrides.country || "DE"),
        ...overrides.extra
      }
    };
  }

  it("navigheaza la pagina echivalenta cand planul cere navigare", async () => {
    const { locationRef, options } = pageOptions({ country: "RO" });

    const outcome = await startPageLanguage(options);

    assert.equal(outcome.navigated, true);
    assert.deepEqual(locationRef.replaced, ["/ro/"]);
    assert.equal(outcome.result.navigation.action, "navigate");
  });

  it("nu navigheaza cand limba paginii coincide cu limba rezolvata", async () => {
    const { locationRef, options } = pageOptions({ country: "DE" });

    const outcome = await startPageLanguage(options);

    assert.equal(outcome.navigated, false);
    assert.deepEqual(locationRef.replaced, []);
    assert.equal(outcome.result.navigation.action, "none");
  });

  it("afiseaza propunerea cand rezultatul geo a sosit prea tarziu", async () => {
    let clock = 0;

    const { documentRef, locationRef, options } = pageOptions({
      country: "RO",
      extra: {
        now: () => {
          clock += 2500;
          return clock;
        }
      }
    });

    const outcome = await startPageLanguage(options);

    assert.equal(outcome.navigated, false);
    assert.deepEqual(locationRef.replaced, []);
    assert.equal(outcome.result.navigation.action, "suggest");
    assert.ok(outcome.ui.banner, "propunerea este afisata");
    assert.equal(documentRef.body.children.length, 1);
  });

  it("nu arunca atunci cand nu exista location", async () => {
    const { options } = pageOptions({ country: "RO" });
    let outcome;

    await assert.doesNotReject(async () => {
      outcome = await startPageLanguage({ ...options, location: null });
    });

    assert.equal(outcome.navigated, false);
    assert.equal(outcome.result.navigation.action, "navigate");
  });

  it("nu arunca atunci cand documentul nu are body", async () => {
    const { options } = pageOptions({ country: "RO" });

    const documentRef = {
      documentElement: { lang: "", dir: "" },
      querySelector: () => null,
      querySelectorAll: () => []
    };

    await assert.doesNotReject(async () => {
      await startPageLanguage({
        ...options,
        document: documentRef,
        location: null,
        now: (() => {
          let clock = 0;
          return () => {
            clock += 2500;
            return clock;
          };
        })()
      });
    });
  });
});

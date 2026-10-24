// =====================================================
// Teste — perechea /registry.html <-> /ro/registru/
// Navigare, selector de limba, absenta buclelor. Fara retea.
// =====================================================

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { equivalentPath, resolvePageLanguage } from "../js/i18n/language.js";
import { createLanguageService } from "../js/i18n/index.js";
import { startPageLanguage } from "../js/i18n/page.js";
import { applySwitcherState } from "../js/i18n/lang-switcher.js";
import { getPageTranslator, resetPageTranslator } from "../js/i18n/runtime.js";
import { createFakeStorage, createFakeLocation } from "./helpers/fakes.mjs";
import {
  createFakeDocument,
  createFakeElement,
  flushMicrotasks
} from "./helpers/fake-dom.mjs";

beforeEach(() => {
  resetPageTranslator();
});

function fakeResolver(country) {
  const resolver = {
    calls: 0,
    async detect() {
      resolver.calls += 1;
      return country;
    }
  };

  return resolver;
}

function service(options = {}) {
  return createLanguageService({ fetchImpl: null, ...options });
}

function createLangSwitcher() {
  const links = {};

  ["ro", "en"].forEach((language) => {
    const link = createFakeElement("a");
    link.setAttribute("data-lang-option", language);
    links[language] = link;
  });

  const container = createFakeElement("div");
  container.setAttribute("data-lang-switcher", "");

  container.querySelector = (selector) => {
    const match = /^\[data-lang-option="([^"]+)"\]$/.exec(selector);

    return match ? links[match[1]] || null : null;
  };

  return { container, links };
}

describe("perechea de pagini", () => {
  it("registry.html <-> /ro/registru/", () => {
    assert.equal(equivalentPath("/registry.html", "ro"), "/ro/registru/");
    assert.equal(equivalentPath("/ro/registru/", "en"), "/registry.html");
    assert.equal(equivalentPath("/ro/registru/", "ro"), "/ro/registru/");
    assert.equal(equivalentPath("/registry.html", "en"), "/registry.html");
  });

  it("/index.html duce la pagina romana canonica", () => {
    assert.equal(equivalentPath("/index.html", "ro"), "/ro/");
  });

  it("perechea principala are prioritate pentru /ro/", () => {
    assert.equal(equivalentPath("/ro/", "en"), "/");
  });

  it("limba continutului static este corecta", () => {
    assert.equal(resolvePageLanguage("/registry.html"), "en");
    assert.equal(resolvePageLanguage("/ro/registru/"), "ro");
  });
});

describe("navigare pe /registry.html", () => {
  it("fara preferinta, tara DE => rămâne pe engleza", async () => {
    const instance = service({
      pathname: "/registry.html",
      storage: createFakeStorage(),
      document: createFakeDocument(),
      resolver: fakeResolver("DE")
    });

    const result = await instance.init();

    assert.equal(result.language, "en");
    assert.deepEqual(result.navigation, { action: "none", target: null });
  });

  it("fara preferinta, tara RO => navigheaza la /ro/registru/", async () => {
    const documentRef = createFakeDocument();
    const instance = service({
      pathname: "/registry.html",
      storage: createFakeStorage(),
      document: documentRef,
      resolver: fakeResolver("RO")
    });

    const result = await instance.init();

    assert.equal(result.language, "ro");
    assert.equal(result.source, "country");
    assert.deepEqual(result.navigation, { action: "navigate", target: "/ro/registru/" });
    assert.equal(documentRef.documentElement.lang, "en", "continutul paginii este englez");
  });

  it("preferinta ro => navigheaza la /ro/registru/ fara apel geo", async () => {
    const resolver = fakeResolver("DE");
    const instance = service({
      pathname: "/registry.html",
      storage: createFakeStorage({ "dmr.lang": "ro" }),
      document: createFakeDocument(),
      resolver
    });

    const result = await instance.init();

    assert.equal(result.source, "preference");
    assert.deepEqual(result.navigation, { action: "navigate", target: "/ro/registru/" });
    assert.equal(resolver.calls, 0);
  });

  it("preferinta en => nu navigheaza", async () => {
    const instance = service({
      pathname: "/registry.html",
      storage: createFakeStorage({ "dmr.lang": "en" }),
      document: createFakeDocument(),
      resolver: fakeResolver("RO")
    });

    const result = await instance.init();

    assert.equal(result.language, "en");
    assert.deepEqual(result.navigation, { action: "none", target: null });
  });

  it("geo indisponibil => nu navigheaza", async () => {
    const instance = service({
      pathname: "/registry.html",
      storage: createFakeStorage(),
      document: createFakeDocument(),
      resolver: fakeResolver(null)
    });

    const result = await instance.init();

    assert.equal(result.language, "en");
    assert.deepEqual(result.navigation, { action: "none", target: null });
  });
});

describe("navigare pe /ro/registru/", () => {
  it("URL-ul explicit are prioritate fata de tara", async () => {
    const resolver = fakeResolver("DE");
    const documentRef = createFakeDocument();
    const instance = service({
      pathname: "/ro/registru/",
      storage: createFakeStorage(),
      document: documentRef,
      resolver
    });

    const result = await instance.init();

    assert.equal(result.language, "ro");
    assert.equal(result.source, "url");
    assert.equal(documentRef.documentElement.lang, "ro");
    assert.deepEqual(result.navigation, { action: "none", target: null });
    assert.equal(resolver.calls, 0);
  });

  it("URL-ul explicit are prioritate fata de preferinta", async () => {
    const instance = service({
      pathname: "/ro/registru/",
      storage: createFakeStorage({ "dmr.lang": "en" }),
      document: createFakeDocument(),
      resolver: fakeResolver("RO")
    });

    const result = await instance.init();

    assert.equal(result.language, "ro");
    assert.equal(result.source, "url");
    assert.deepEqual(result.navigation, { action: "none", target: null });
  });
});

describe("selectorul RO | EN pe paginile de registru", () => {
  it("pe /registry.html indica engleza si duce la pagina romana", async () => {
    const instance = service({
      pathname: "/registry.html",
      storage: createFakeStorage(),
      document: null,
      resolver: fakeResolver("DE")
    });

    await instance.init();

    const { container, links } = createLangSwitcher();

    applySwitcherState(container, instance, "en");

    assert.equal(links.ro.getAttribute("href"), "/ro/registru/");
    assert.equal(links.en.getAttribute("href"), "/registry.html");
    assert.equal(links.en.getAttribute("aria-current"), "true");
    assert.equal(links.ro.getAttribute("aria-current"), null);
  });

  it("pe /ro/registru/ indica romana si duce la pagina engleza", async () => {
    const instance = service({
      pathname: "/ro/registru/",
      storage: createFakeStorage(),
      document: null,
      resolver: fakeResolver("DE")
    });

    await instance.init();

    const { container, links } = createLangSwitcher();

    applySwitcherState(container, instance, "ro");

    assert.equal(links.ro.getAttribute("href"), "/ro/registru/");
    assert.equal(links.en.getAttribute("href"), "/registry.html");
    assert.equal(links.ro.getAttribute("aria-current"), "true");
  });

  it("click pe selector salveaza preferinta in ambele sensuri", async () => {
    const storage = createFakeStorage();
    const instance = service({
      pathname: "/registry.html",
      storage,
      document: null,
      resolver: fakeResolver("DE")
    });

    await instance.init();

    const { container, links } = createLangSwitcher();

    applySwitcherState(container, instance, "en");

    assert.equal(links.ro.dispatchEvent("click"), true);
    assert.equal(storage.dump()["dmr.lang"], "ro");

    assert.equal(links.en.dispatchEvent("click"), true);
    assert.equal(storage.dump()["dmr.lang"], "en");
  });

  it("etichetele selectorului sunt traduse in limba paginii", async () => {
    const ro = service({
      pathname: "/ro/registru/",
      storage: createFakeStorage(),
      document: null,
      resolver: fakeResolver("DE")
    });

    await ro.init();

    const roSwitcher = createLangSwitcher();

    applySwitcherState(roSwitcher.container, ro, "ro");

    assert.equal(roSwitcher.container.getAttribute("aria-label"), "Limbă");
    assert.equal(roSwitcher.links.en.getAttribute("aria-label"), "Comută la English");
  });
});

describe("absenta buclelor de redirectare", () => {
  const scenarios = [
    { path: "/registry.html", country: "RO", pref: null },
    { path: "/registry.html", country: "RO", pref: "ro" },
    { path: "/registry.html", country: "DE", pref: null },
    { path: "/ro/registru/", country: "RO", pref: null },
    { path: "/ro/registru/", country: "DE", pref: null },
    { path: "/ro/registru/", country: "DE", pref: "en" }
  ];

  scenarios.forEach((scenario) => {
    const label = `${scenario.path} (${scenario.country}, preferinta ${scenario.pref || "niciuna"})`;

    it(label, async () => {
      const storage = () =>
        createFakeStorage(scenario.pref ? { "dmr.lang": scenario.pref } : {});

      let path = scenario.path;
      let hops = 0;

      let state = await service({
        pathname: path,
        storage: storage(),
        document: null,
        resolver: fakeResolver(scenario.country)
      }).init();

      while (state.navigation.action === "navigate" && hops < 5) {
        hops += 1;
        path = state.navigation.target;

        state = await service({
          pathname: path,
          storage: storage(),
          document: null,
          resolver: fakeResolver(scenario.country)
        }).init();
      }

      assert.ok(hops <= 1, `prea multe navigari: ${hops}`);
      assert.equal(state.navigation.action, "none");
    });
  });
});

describe("startPageLanguage pe paginile de registru", () => {
  it("navigheaza de pe /registry.html la pagina romana", async () => {
    const locationRef = createFakeLocation("/registry.html");
    const documentRef = createFakeDocument();

    const outcome = await startPageLanguage({
      pathname: "/registry.html",
      storage: createFakeStorage(),
      sessionStorage: createFakeStorage(),
      document: documentRef,
      location: locationRef,
      resolver: fakeResolver("RO")
    });

    assert.equal(outcome.navigated, true);
    assert.deepEqual(locationRef.replaced, ["/ro/registru/"]);
  });

  it("nu navigheaza de pe /ro/registru/", async () => {
    const locationRef = createFakeLocation("/ro/registru/");
    const documentRef = createFakeDocument();

    const outcome = await startPageLanguage({
      pathname: "/ro/registru/",
      storage: createFakeStorage(),
      sessionStorage: createFakeStorage(),
      document: documentRef,
      location: locationRef,
      resolver: fakeResolver("DE")
    });

    assert.equal(outcome.navigated, false);
    assert.deepEqual(locationRef.replaced, []);
    assert.equal(documentRef.documentElement.lang, "ro");
  });

  it("click pe un card in timpul cererii geo suprimă redirectarea", async () => {
    let release;

    const documentRef = createFakeDocument();
    const locationRef = createFakeLocation("/registry.html");

    const promise = startPageLanguage({
      pathname: "/registry.html",
      storage: createFakeStorage(),
      sessionStorage: createFakeStorage(),
      document: documentRef,
      location: locationRef,
      resolver: {
        detect: () =>
          new Promise((resolve) => {
            release = resolve;
          })
      }
    });

    await flushMicrotasks(1);

    const cardLink = createFakeElement("a");
    cardLink.setAttribute("href", "certificari/?search=GX0000000001");

    documentRef.dispatchEvent({ type: "click", target: cardLink });

    release("RO");

    const outcome = await promise;

    assert.deepEqual(locationRef.replaced, []);
    assert.equal(outcome.suppressed, true);
  });
});

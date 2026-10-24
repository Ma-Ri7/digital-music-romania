// =====================================================
// Teste — limba paginii si planul de navigare
// Nu se apeleaza niciun serviciu extern.
// =====================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { planLanguageNavigation, resolvePageLanguage } from "../js/i18n/language.js";
import { createLanguageService } from "../js/i18n/index.js";
import {
  NAVIGATION_POLICIES,
  createConfig,
  defaultConfig
} from "../js/i18n/config.js";
import { createFakeDocument, createFakeStorage } from "./helpers/fakes.mjs";

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

describe("resolvePageLanguage", () => {
  it("deriva limba continutului static din cale", () => {
    assert.equal(resolvePageLanguage("/ro/"), "ro");
    assert.equal(resolvePageLanguage("/ro/registru/"), "ro");
    assert.equal(resolvePageLanguage("/"), "en");
    assert.equal(resolvePageLanguage("/registry.html"), "en");
    assert.equal(resolvePageLanguage("/i/"), "en");
  });

  it("URL-urile fara prefix sunt engleza (limba implicita)", () => {
    assert.equal(resolvePageLanguage("/"), "en");
    assert.equal(resolvePageLanguage("/ceva.html"), "en");
  });
});

describe("planLanguageNavigation", () => {
  const base = {
    resolvedLanguage: "ro",
    pageLanguage: "en",
    currentPath: "/",
    equivalentPath: "/ro/",
    elapsedMs: 100,
    deadlineMs: 2000,
    policy: "navigate"
  };

  it("navigheaza cand limba difera si rezultatul a sosit la timp", () => {
    assert.deepEqual(planLanguageNavigation(base), {
      action: "navigate",
      target: "/ro/"
    });
  });

  it("nu face nimic cand limba coincide cu limba paginii", () => {
    assert.deepEqual(planLanguageNavigation({ ...base, resolvedLanguage: "en" }), {
      action: "none",
      target: null
    });
  });

  it("propune in loc sa navigheze cand rezultatul a sosit prea tarziu", () => {
    assert.deepEqual(planLanguageNavigation({ ...base, elapsedMs: 2001 }), {
      action: "suggest",
      target: "/ro/"
    });
  });

  it("respecta pragul exact", () => {
    assert.equal(planLanguageNavigation({ ...base, elapsedMs: 2000 }).action, "navigate");
    assert.equal(planLanguageNavigation({ ...base, elapsedMs: 2000.5 }).action, "suggest");
  });

  it("politica 'off' dezactiveaza orice actiune automata", () => {
    assert.deepEqual(planLanguageNavigation({ ...base, policy: "off" }), {
      action: "none",
      target: null
    });
  });

  it("politica 'suggest' nu navigheaza niciodata", () => {
    assert.deepEqual(planLanguageNavigation({ ...base, policy: "suggest" }), {
      action: "suggest",
      target: "/ro/"
    });
  });

  it("nu face nimic daca nu exista pagina echivalenta", () => {
    assert.deepEqual(planLanguageNavigation({ ...base, equivalentPath: null }), {
      action: "none",
      target: null
    });
  });

  it("nu face nimic daca pagina echivalenta este chiar pagina curenta", () => {
    assert.deepEqual(planLanguageNavigation({ ...base, equivalentPath: "/" }), {
      action: "none",
      target: null
    });
  });

  it("foloseste politica implicita din configuratie cand nu este data", () => {
    assert.equal(
      planLanguageNavigation({
        resolvedLanguage: "ro",
        pageLanguage: "en",
        currentPath: "/",
        equivalentPath: "/ro/"
      }).action,
      "navigate"
    );
  });

  it("politicile din configuratie sunt expuse si validate", () => {
    assert.deepEqual(defaultConfig.supportedLanguages, ["ro", "en"]);
    assert.equal(defaultConfig.navigationPolicy, "navigate");
    assert.equal(defaultConfig.navigateDeadlineMs, 2000);
    assert.ok(NAVIGATION_POLICIES.includes("navigate"));
    assert.ok(NAVIGATION_POLICIES.includes("suggest"));
    assert.ok(NAVIGATION_POLICIES.includes("off"));
  });
});

describe("init() — plan de navigare", () => {
  it("/ cu tara RO => navigare la /ro/, pagina rămâne EN", async () => {
    const documentRef = createFakeDocument();
    const instance = service({
      pathname: "/",
      storage: createFakeStorage(),
      document: documentRef,
      resolver: fakeResolver("RO")
    });

    const result = await instance.init();

    assert.deepEqual(result.navigation, { action: "navigate", target: "/ro/" });
    assert.equal(result.pageLanguage, "en");
    assert.equal(documentRef.documentElement.lang, "en");
  });

  it("/ro/ cu tara DE => nicio navigare (URL-ul explicit invinge tara)", async () => {
    const resolver = fakeResolver("DE");
    const instance = service({
      pathname: "/ro/",
      storage: createFakeStorage(),
      document: createFakeDocument(),
      resolver
    });

    const result = await instance.init();

    assert.equal(result.language, "ro");
    assert.equal(result.source, "url");
    assert.deepEqual(result.navigation, { action: "none", target: null });
    assert.equal(resolver.calls, 0);
  });

  it("/ro/ cu preferinta EN => nicio navigare (URL-ul explicit are prioritate)", async () => {
    const instance = service({
      pathname: "/ro/",
      storage: createFakeStorage({ "dmr.lang": "en" }),
      document: createFakeDocument(),
      resolver: fakeResolver("DE")
    });

    const result = await instance.init();

    assert.equal(result.language, "ro");
    assert.equal(result.source, "url");
    assert.deepEqual(result.navigation, { action: "none", target: null });
  });

  it("/ cu preferinta RO => navigare la /ro/, fara apel geo", async () => {
    const resolver = fakeResolver("DE");
    const instance = service({
      pathname: "/",
      storage: createFakeStorage({ "dmr.lang": "ro" }),
      document: createFakeDocument(),
      resolver
    });

    const result = await instance.init();

    assert.equal(result.language, "ro");
    assert.equal(result.source, "preference");
    assert.deepEqual(result.navigation, { action: "navigate", target: "/ro/" });
    assert.equal(resolver.calls, 0, "preferinta nu declanseaza apel geo");
  });

  it("/ cu preferinta EN => nicio navigare, fara apel geo", async () => {
    const resolver = fakeResolver("RO");
    const instance = service({
      pathname: "/",
      storage: createFakeStorage({ "dmr.lang": "en" }),
      document: createFakeDocument(),
      resolver
    });

    const result = await instance.init();

    assert.equal(result.language, "en");
    assert.deepEqual(result.navigation, { action: "none", target: null });
    assert.equal(resolver.calls, 0);
  });

  it("/ cu geo indisponibil => nicio navigare, fallback EN", async () => {
    const instance = service({
      pathname: "/",
      storage: createFakeStorage(),
      document: createFakeDocument(),
      resolver: fakeResolver(null)
    });

    const result = await instance.init();

    assert.equal(result.language, "en");
    assert.deepEqual(result.navigation, { action: "none", target: null });
  });

  it("/ cu rezultat geo intarziat => propunere, nu navigare", async () => {
    let clock = 0;

    const instance = service({
      pathname: "/",
      storage: createFakeStorage(),
      document: createFakeDocument(),
      resolver: fakeResolver("RO"),
      now: () => {
        clock += 2500;
        return clock;
      }
    });

    const result = await instance.init();

    assert.equal(result.language, "ro");
    assert.deepEqual(result.navigation, { action: "suggest", target: "/ro/" });
    assert.ok(result.elapsedMs >= 2500);
  });

  it("politica 'off' din configuratie => nicio navigare", async () => {
    const instance = service({
      pathname: "/",
      storage: createFakeStorage(),
      document: createFakeDocument(),
      resolver: fakeResolver("RO"),
      config: createConfig({ navigationPolicy: "off" })
    });

    const result = await instance.init();

    assert.equal(result.language, "ro");
    assert.deepEqual(result.navigation, { action: "none", target: null });
  });
});

describe("cursa: alegere manuala in timpul unei cereri geo", () => {
  it("preferinta aleasa cat timp geo raspunde nu este suprascrisa", async () => {
    let release;
    const storage = createFakeStorage();

    const resolver = {
      calls: 0,
      detect() {
        resolver.calls += 1;
        return new Promise((resolve) => {
          release = resolve;
        });
      }
    };

    const instance = service({
      pathname: "/",
      storage,
      document: createFakeDocument(),
      resolver
    });

    const pending = instance.init();

    // Alegerea manuala se face cat timp cererea geo este inca in curs.
    assert.equal(instance.setLanguage("ro"), "ro");

    // Geo raspunde tarziu, cu o alta tara.
    release("DE");

    const result = await pending;

    assert.equal(result.language, "ro", "preferinta manuala prevaleaza");
    assert.equal(result.source, "preference");
    assert.deepEqual(result.navigation, { action: "navigate", target: "/ro/" });
  });

  it("preferinta aleasa tarziu este respectata si cand geo raspunde cu RO", async () => {
    let release;

    const instance = service({
      pathname: "/",
      storage: createFakeStorage(),
      document: createFakeDocument(),
      resolver: {
        detect: () =>
          new Promise((resolve) => {
            release = resolve;
          })
      }
    });

    const pending = instance.init();

    instance.setLanguage("en");
    release("RO");

    const result = await pending;

    assert.equal(result.language, "en");
    assert.equal(result.source, "preference");
    assert.deepEqual(result.navigation, { action: "none", target: null });
  });
});

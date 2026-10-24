// =====================================================
// Teste — absenta efectelor secundare la import
//
// Importul modulelor i18n nu trebuie sa faca apeluri de retea
// si nu trebuie sa creeze sau sa modifice globals.
// =====================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";

const MODULES = [
  "../js/i18n/config.js",
  "../js/i18n/geo.js",
  "../js/i18n/language.js",
  "../js/i18n/i18n.js",
  "../js/i18n/locales/en.js",
  "../js/i18n/locales/ro.js",
  "../js/i18n/lang-switcher.js",
  "../js/i18n/index.js",
  "../js/i18n/page.js"
];

describe("import fara efecte secundare", () => {
  it("nu se face niciun apel de retea la import", async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;

    globalThis.fetch = () => {
      calls += 1;
      throw new Error("reteaua este interzisa in teste");
    };

    try {
      for (const path of MODULES) {
        await import(path);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }

    assert.equal(calls, 0);
  });

  it("globals-urile de browser nu sunt create sau modificate la import", async () => {
    const before = {
      document: globalThis.document,
      localStorage: globalThis.localStorage,
      sessionStorage: globalThis.sessionStorage,
      location: globalThis.location,
      navigator: globalThis.navigator
    };

    for (const path of MODULES) {
      await import(path);
    }

    assert.equal(globalThis.document, before.document);
    assert.equal(globalThis.localStorage, before.localStorage);
    assert.equal(globalThis.sessionStorage, before.sessionStorage);
    assert.equal(globalThis.location, before.location);
    assert.equal(globalThis.navigator, before.navigator);
  });

  it("initLanguage() nu este apelat automat la import", async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;

    globalThis.fetch = () => {
      calls += 1;
      throw new Error("reteaua este interzisa in teste");
    };

    try {
      const module = await import("../js/i18n/index.js");

      assert.equal(typeof module.initLanguage, "function");
      assert.equal(calls, 0, "importul nu trebuie sa declanseze detectarea tarii");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("configuratia implicita nu este modificata de createConfig()", async () => {
    const { createConfig, defaultConfig } = await import("../js/i18n/config.js");

    const custom = createConfig({ geoTimeoutMs: 50, defaultLanguage: "ro" });

    assert.equal(custom.geoTimeoutMs, 50);
    assert.equal(custom.defaultLanguage, "ro");
    assert.equal(defaultConfig.geoTimeoutMs, 2000);
    assert.equal(defaultConfig.defaultLanguage, "en");
    assert.deepEqual(defaultConfig.supportedLanguages, ["ro", "en"]);
  });

  it("configuratia returnata nu partajeaza referinte intre instante", async () => {
    const { createConfig } = await import("../js/i18n/config.js");

    const first = createConfig();
    const second = createConfig();

    assert.notEqual(first.supportedLanguages, second.supportedLanguages);
    assert.notEqual(first.storageKeys, second.storageKeys);

    first.supportedLanguages.push("de");
    first.storageKeys.language = "modificat";

    assert.deepEqual(second.supportedLanguages, ["ro", "en"]);
    assert.equal(second.storageKeys.language, "dmr.lang");
    assert.deepEqual(createConfig().supportedLanguages, ["ro", "en"]);
  });

  it("valorile implicite sunt inghetate", async () => {
    const { GEO_FETCH_OPTIONS, STORAGE_KEYS, SUPPORTED_LANGUAGES } = await import(
      "../js/i18n/config.js"
    );

    assert.equal(Object.isFrozen(SUPPORTED_LANGUAGES), true);
    assert.equal(Object.isFrozen(GEO_FETCH_OPTIONS), true);
    assert.equal(Object.isFrozen(STORAGE_KEYS), true);
  });
});

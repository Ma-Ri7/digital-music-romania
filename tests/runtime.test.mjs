// =====================================================
// Teste — runtime sincron (js/i18n/runtime.js)
// Fara DOM, fara retea, fara efecte secundare la import.
// =====================================================

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  DICTIONARIES,
  INTL_LOCALES,
  LOCALES,
  createPageTranslator,
  currentPathname,
  formatNumber,
  getLanguage,
  getPageTranslator,
  resetPageTranslator,
  setPageTranslator,
  t
} from "../js/i18n/runtime.js";
import { messages as enMessages } from "../js/i18n/locales/en.js";
import { messages as roMessages } from "../js/i18n/locales/ro.js";

beforeEach(() => {
  resetPageTranslator();
});

describe("createPageTranslator — limba sincrona din cale", () => {
  it("/ este engleza", () => {
    const translator = createPageTranslator({ pathname: "/" });

    assert.equal(translator.getLanguage(), "en");
    assert.equal(translator.t("common.loading"), enMessages["common.loading"]);
  });

  it("/ro/ este romana", () => {
    const translator = createPageTranslator({ pathname: "/ro/" });

    assert.equal(translator.getLanguage(), "ro");
    assert.equal(translator.t("common.loading"), roMessages["common.loading"]);
  });

  it("subpaginile romanești sunt romana", () => {
    assert.equal(createPageTranslator({ pathname: "/ro/registru/" }).getLanguage(), "ro");
    assert.equal(createPageTranslator({ pathname: "/ro/ceva/" }).getLanguage(), "ro");
  });

  it("paginile fara prefix sunt engleza", () => {
    assert.equal(createPageTranslator({ pathname: "/registry.html" }).getLanguage(), "en");
    assert.equal(createPageTranslator({ pathname: "/i/" }).getLanguage(), "en");
  });

  it("nu consulta si nu este influentat de preferinta salvata", () => {
    const original = globalThis.localStorage;

    globalThis.localStorage = {
      getItem: () => "en",
      setItem: () => {},
      removeItem: () => {}
    };

    try {
      const translator = createPageTranslator({ pathname: "/ro/" });

      assert.equal(translator.getLanguage(), "ro", "preferinta nu schimba limba paginii");
    } finally {
      if (original === undefined) delete globalThis.localStorage;
      else globalThis.localStorage = original;
    }
  });

  it("fara pathname foloseste calea curenta (implicit /)", () => {
    assert.equal(createPageTranslator().getLanguage(), "en");
  });

  it("locale-urile Intl sunt expuse pentru ambele limbi", () => {
    assert.equal(INTL_LOCALES.ro, "ro-RO");
    assert.equal(INTL_LOCALES.en, "en-US");
    assert.equal(LOCALES.ro.htmlLang, "ro");
  });
});

describe("instanta unica (sursa coerenta)", () => {
  it("getPageTranslator() returneaza aceeasi instanta", () => {
    const first = getPageTranslator({ pathname: "/ro/" });
    const second = getPageTranslator({ pathname: "/" });

    assert.equal(first, second, "nu exista doua instante independente");
    assert.equal(second.getLanguage(), "ro", "optiunile ulterioare nu recreeaza instanta");
  });

  it("resetPageTranslator() forteaza o instanta noua", () => {
    const first = getPageTranslator({ pathname: "/ro/" });

    resetPageTranslator();

    const second = getPageTranslator({ pathname: "/" });

    assert.notEqual(first, second);
    assert.equal(second.getLanguage(), "en");
  });

  it("setPageTranslator() permite injectarea unei instante", () => {
    const injected = createPageTranslator({ pathname: "/ro/" });

    assert.equal(setPageTranslator(injected), injected);
    assert.equal(getPageTranslator({ pathname: "/" }), injected);
    assert.equal(t("common.loading"), roMessages["common.loading"]);
  });

  it("legaturile t()/getLanguage()/formatNumber() folosesc instanta unica", () => {
    setPageTranslator(createPageTranslator({ pathname: "/ro/" }));

    assert.equal(getLanguage(), "ro");
    assert.equal(formatNumber(1234), "1.234");
    assert.equal(t("common.loading"), roMessages["common.loading"]);

    setPageTranslator(createPageTranslator({ pathname: "/" }));

    assert.equal(getLanguage(), "en");
    assert.equal(formatNumber(1234), "1,234");
  });
});

describe("fara DOM si fara retea", () => {
  it("t() functioneaza cu fetch blocat", () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;

    globalThis.fetch = () => {
      calls += 1;
      throw new Error("reteaua este interzisa in teste");
    };

    try {
      resetPageTranslator();

      assert.equal(t("common.loading"), enMessages["common.loading"]);
      assert.equal(calls, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("currentPathname() nu arunca in absenta location", () => {
    assert.equal(currentPathname(), "/");
  });

  it("importul runtime-ului nu produce efecte secundare", async () => {
    const before = {
      document: globalThis.document,
      localStorage: globalThis.localStorage,
      location: globalThis.location
    };

    let calls = 0;
    const originalFetch = globalThis.fetch;

    globalThis.fetch = () => {
      calls += 1;
      throw new Error("reteaua este interzisa in teste");
    };

    try {
      await import("../js/i18n/runtime.js");
    } finally {
      globalThis.fetch = originalFetch;
    }

    assert.equal(calls, 0);
    assert.equal(globalThis.document, before.document);
    assert.equal(globalThis.localStorage, before.localStorage);
    assert.equal(globalThis.location, before.location);
  });

  it("cheile lipsa returneaza cheia si sunt raportate", () => {
    const reported = [];
    const translator = createPageTranslator({
      pathname: "/ro/",
      onMissing: (key, language) => reported.push([key, language])
    });

    assert.equal(translator.t("nu.exista"), "nu.exista");
    assert.deepEqual(reported, [["nu.exista", "ro"]]);
  });

  it("dictionarele expuse sunt cele reale", () => {
    assert.equal(DICTIONARIES.ro, roMessages);
    assert.equal(DICTIONARIES.en, enMessages);
  });
});

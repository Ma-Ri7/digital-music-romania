// =====================================================
// Teste — coerenta dictionarelor si a metadatelor de limba
// Aceste teste protejeaza fisierele de locale sa nu divergheze
// atunci cand se adauga cheile de pagina.
// =====================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { locale as enLocale, messages as enMessages } from "../js/i18n/locales/en.js";
import { locale as roLocale, messages as roMessages } from "../js/i18n/locales/ro.js";
import { DICTIONARIES, INTL_LOCALES, LOCALES } from "../js/i18n/index.js";
import { SUPPORTED_LANGUAGES, defaultConfig } from "../js/i18n/config.js";

const KEY_PATTERN = /^[a-z][A-Za-z0-9]*(\.[a-zA-Z0-9]+)+$/;

describe("paritatea dictionarelor", () => {
  it("ro si en au exact acelasi set de chei", () => {
    assert.deepEqual(Object.keys(roMessages).sort(), Object.keys(enMessages).sort());
  });

  it("fiecare limba suportata are dictionar si metadate", () => {
    SUPPORTED_LANGUAGES.forEach((language) => {
      assert.ok(DICTIONARIES[language], `dictionar lipsa pentru ${language}`);
      assert.ok(LOCALES[language], `metadate lipsa pentru ${language}`);
      assert.ok(INTL_LOCALES[language], `locale Intl lipsa pentru ${language}`);
    });
  });

  it("nu exista traduceri goale", () => {
    [["ro", roMessages], ["en", enMessages]].forEach(([language, messages]) => {
      Object.entries(messages).forEach(([key, value]) => {
        assert.equal(typeof value, "string", `${language}/${key} nu este string`);
        assert.ok(value.trim().length > 0, `${language}/${key} este gol`);
      });
    });
  });

  it("cheile respecta conventia de denumire", () => {
    Object.keys(enMessages).forEach((key) => {
      assert.match(key, KEY_PATTERN, `cheie neconforma: ${key}`);
    });
  });

  it("mesajele nu contin marcaj HTML (sunt aplicate cu textContent)", () => {
    Object.entries(enMessages).forEach(([key, value]) => {
      assert.ok(!/[<>]/.test(value), `marcaj HTML in en/${key}`);
    });
  });

  it("romana chiar traduce textele de interfata", () => {
    assert.notEqual(roMessages["common.loading"], enMessages["common.loading"]);
    assert.notEqual(
      roMessages["language.switcher.label"],
      enMessages["language.switcher.label"]
    );
  });

  it("etichetele scurte RO / EN sunt identice in ambele limbi", () => {
    assert.equal(roMessages["language.switcher.short.ro"], "RO");
    assert.equal(enMessages["language.switcher.short.ro"], "RO");
    assert.equal(roMessages["language.switcher.short.en"], "EN");
    assert.equal(enMessages["language.switcher.short.en"], "EN");
  });

  it("fiecare cheie folosita de nucleu exista in ambele limbi", () => {
    const requiredKeys = [
      "language.switcher.label",
      "language.switcher.current",
      "language.switcher.switchTo",
      "language.suggestion.title",
      "language.suggestion.action",
      "language.suggestion.dismiss",
      "common.loading"
    ];

    requiredKeys.forEach((key) => {
      assert.ok(Object.prototype.hasOwnProperty.call(enMessages, key), `en lipseste ${key}`);
      assert.ok(Object.prototype.hasOwnProperty.call(roMessages, key), `ro lipseste ${key}`);
    });
  });
});

describe("metadatele de limba", () => {
  it("codul si htmlLang corespund cheii din dictionar", () => {
    assert.equal(enLocale.code, "en");
    assert.equal(enLocale.htmlLang, "en");
    assert.equal(roLocale.code, "ro");
    assert.equal(roLocale.htmlLang, "ro");
  });

  it("locale-ul Intl are formatul limba-TARA", () => {
    assert.match(enLocale.intlLocale, /^[a-z]{2}-[A-Z]{2}$/);
    assert.match(roLocale.intlLocale, /^[a-z]{2}-[A-Z]{2}$/);
    assert.equal(roLocale.intlLocale, "ro-RO");
  });

  it("ambele limbi sunt scrise de la stanga la dreapta", () => {
    assert.equal(enLocale.dir, "ltr");
    assert.equal(roLocale.dir, "ltr");
  });

  it("configuratia implicita foloseste engleza ca fallback", () => {
    assert.equal(defaultConfig.defaultLanguage, "en");
    assert.deepEqual(defaultConfig.supportedLanguages, ["ro", "en"]);
    assert.equal(defaultConfig.romaniaCountryCode, "RO");
  });
});

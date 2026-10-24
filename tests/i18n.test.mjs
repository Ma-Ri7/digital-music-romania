// =====================================================
// Teste — runtime de traduceri
// Nu se apeleaza niciun serviciu extern.
// =====================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createI18n, interpolate, lookup } from "../js/i18n/i18n.js";
import { INTL_LOCALES, LOCALES } from "../js/i18n/index.js";
import { messages as enMessages } from "../js/i18n/locales/en.js";
import { messages as roMessages } from "../js/i18n/locales/ro.js";
import { createFakeElement, createFakeRoot } from "./helpers/fakes.mjs";

const DICTIONARIES = { en: enMessages, ro: roMessages };

function translator(language, options = {}) {
  return createI18n({
    language,
    dictionaries: DICTIONARIES,
    intlLocales: INTL_LOCALES,
    ...options
  });
}

describe("interpolate", () => {
  it("inlocuieste placeholderele", () => {
    assert.equal(interpolate("Salut {name}!", { name: "Ana" }), "Salut Ana!");
    assert.equal(interpolate("{a}-{b}", { a: 1, b: 2 }), "1-2");
  });

  it("pastreaza placeholderele fara valoare", () => {
    assert.equal(interpolate("Salut {name}!", {}), "Salut {name}!");
  });

  it("tolereaza valori lipsa sau de alt tip", () => {
    assert.equal(interpolate(null, { a: 1 }), "");
    assert.equal(interpolate("text", null), "text");
  });
});

describe("lookup", () => {
  it("gaseste doar chei proprii", () => {
    assert.equal(lookup({ a: "1" }, "a"), "1");
    assert.equal(lookup({ a: "1" }, "b"), undefined);
    assert.equal(lookup({ a: "1" }, "toString"), undefined);
    assert.equal(lookup(null, "a"), undefined);
  });
});

describe("t()", () => {
  it("returneaza textul in limba activa", () => {
    assert.equal(translator("en").t("common.loading"), enMessages["common.loading"]);
    assert.equal(translator("ro").t("common.loading"), roMessages["common.loading"]);
  });

  it("interpoleaza variabilele", () => {
    assert.equal(
      translator("en").t("language.switcher.current", { language: "Română" }),
      "Current language: Română"
    );
  });

  it("cade pe limba implicita daca cheia lipseste in limba activa", () => {
    const partial = { en: { a: "A" }, ro: {} };
    const i18n = createI18n({ language: "ro", dictionaries: partial });

    assert.equal(i18n.t("a"), "A");
  });

  it("returneaza cheia si semnaleaza lipsa daca nu exista nicaieri", () => {
    const missing = [];
    const i18n = createI18n({
      language: "ro",
      dictionaries: DICTIONARIES,
      onMissing: (key, language) => missing.push([key, language])
    });

    assert.equal(i18n.t("nu.exista"), "nu.exista");
    assert.deepEqual(missing, [["nu.exista", "ro"]]);
  });

  it("nu arunca pentru chei invalide", () => {
    const i18n = translator("ro");

    assert.doesNotThrow(() => i18n.t(null));
    assert.equal(i18n.t(null), "");
  });
});

describe("has() si setLanguage()", () => {
  it("has() reflecta dictionarul limbii active", () => {
    const i18n = translator("ro");

    assert.equal(i18n.has("common.loading"), true);
    assert.equal(i18n.has("cheie.inexistenta"), false);
  });

  it("setLanguage() accepta doar limbi suportate", () => {
    const i18n = translator("en");

    assert.equal(i18n.setLanguage("ro"), "ro");
    assert.equal(i18n.getLanguage(), "ro");
    assert.equal(i18n.setLanguage("ro-RO"), "ro");
    assert.equal(i18n.setLanguage("de"), null);
    assert.equal(i18n.getLanguage(), "ro", "limba invalida nu schimba starea");
  });

  it("limba implicita este engleza", () => {
    const i18n = createI18n({ dictionaries: DICTIONARIES });

    assert.equal(i18n.getLanguage(), "en");
  });
});

describe("formatNumber()", () => {
  it("foloseste formatul romanesc pentru limba ro", () => {
    assert.equal(translator("ro").formatNumber(1234), "1.234");
  });

  it("foloseste formatul englez pentru limba en", () => {
    assert.equal(translator("en").formatNumber(1234), "1,234");
  });

  it("revine la String() pentru valori neformatabile", () => {
    const i18n = createI18n({ language: "ro", dictionaries: DICTIONARIES });

    assert.equal(i18n.formatNumber("nu-e-numar"), "nu-e-numar");
    assert.equal(i18n.formatNumber(Number.NaN), "NaN");
    assert.equal(i18n.formatNumber(Number.POSITIVE_INFINITY), "Infinity");
  });

  it("formateaza si valori numerice trimise ca text", () => {
    assert.equal(translator("ro").formatNumber("1234"), "1.234");
  });

  it("returneaza text gol pentru valori lipsa", () => {
    const i18n = translator("ro");

    assert.equal(i18n.formatNumber(null), "");
    assert.equal(i18n.formatNumber(undefined), "");
    assert.equal(i18n.formatNumber(""), "");
  });

  it("locale-urile sunt definite pentru ambele limbi", () => {
    assert.equal(INTL_LOCALES.ro, "ro-RO");
    assert.equal(INTL_LOCALES.en, "en-US");
    assert.equal(LOCALES.ro.htmlLang, "ro");
    assert.equal(LOCALES.en.htmlLang, "en");
  });
});

// =====================================================
// APLICAREA TRADUCERILOR IN DOM
// =====================================================

describe("applyTranslations()", () => {
  it("traduce textContent pentru [data-i18n]", () => {
    const node = createFakeElement({ "data-i18n": "common.loading" });
    const root = createFakeRoot({ "[data-i18n]": [node] });

    const applied = translator("ro").applyTranslations(root);

    assert.equal(node.textContent, roMessages["common.loading"]);
    assert.equal(applied, 1);
  });

  it("traduce atributele suportate", () => {
    const placeholder = createFakeElement({
      "data-i18n-placeholder": "language.switcher.label"
    });
    const title = createFakeElement({ "data-i18n-title": "language.switcher.label" });
    const aria = createFakeElement({
      "data-i18n-aria-label": "language.switcher.current"
    });

    const root = createFakeRoot({
      "[data-i18n-placeholder]": [placeholder],
      "[data-i18n-title]": [title],
      "[data-i18n-aria-label]": [aria]
    });

    const applied = translator("en").applyTranslations(root);

    assert.equal(
      placeholder.getAttributes().placeholder,
      enMessages["language.switcher.label"]
    );
    assert.equal(title.getAttributes().title, enMessages["language.switcher.label"]);
    assert.equal(aria.getAttributes()["aria-label"], enMessages["language.switcher.current"]);
    assert.equal(applied, 3);
  });

  it("numara doar nodurile traduse efectiv", () => {
    const known = createFakeElement({ "data-i18n": "common.loading" });
    const unknown = createFakeElement({ "data-i18n": "cheie.inexistenta" });
    const noAttribute = createFakeElement({});
    const root = createFakeRoot({ "[data-i18n]": [known, unknown, noAttribute] });

    assert.equal(translator("ro").applyTranslations(root), 1);
  });

  it("nu modifica nodurile fara cheie valida", () => {
    const unknown = createFakeElement({ "data-i18n": "cheie.inexistenta" });
    const root = createFakeRoot({ "[data-i18n]": [unknown] });

    translator("ro").applyTranslations(root);

    assert.equal(unknown.textContent, "");
  });

  it("tolereaza radacini invalide", () => {
    const i18n = translator("ro");

    assert.equal(i18n.applyTranslations(null), 0);
    assert.equal(i18n.applyTranslations(undefined), 0);
    assert.equal(i18n.applyTranslations({}), 0);
  });

  it("nu arunca daca querySelectorAll returneaza null", () => {
    const root = { querySelectorAll: () => null };

    assert.doesNotThrow(() => translator("ro").applyTranslations(root));
    assert.equal(translator("ro").applyTranslations(root), 0);
  });

  it("schimbarea limbii se reflecta la urmatoarea aplicare", () => {
    const node = createFakeElement({ "data-i18n": "common.loading" });
    const root = createFakeRoot({ "[data-i18n]": [node] });
    const i18n = translator("en");

    i18n.applyTranslations(root);
    assert.equal(node.textContent, enMessages["common.loading"]);

    i18n.setLanguage("ro");
    i18n.applyTranslations(root);
    assert.equal(node.textContent, roMessages["common.loading"]);
  });
});

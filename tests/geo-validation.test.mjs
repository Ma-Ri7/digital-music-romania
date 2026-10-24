// =====================================================
// Teste — validarea codului de tara
// Nu se apeleaza niciun serviciu extern.
// =====================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  isValidCountryCode,
  normalizeCountryCode,
  parseCountryCode
} from "../js/i18n/geo.js";
import { createConfig } from "../js/i18n/config.js";

describe("normalizeCountryCode", () => {
  it("accepta litere mici si spatii si returneaza majuscule", () => {
    assert.equal(normalizeCountryCode("ro"), "RO");
    assert.equal(normalizeCountryCode(" ro "), "RO");
    assert.equal(normalizeCountryCode("De"), "DE");
  });

  it("respinge valorile care nu sunt string-uri ne-goale", () => {
    assert.equal(normalizeCountryCode(""), null);
    assert.equal(normalizeCountryCode("   "), null);
    assert.equal(normalizeCountryCode(null), null);
    assert.equal(normalizeCountryCode(undefined), null);
    assert.equal(normalizeCountryCode(123), null);
    assert.equal(normalizeCountryCode({ country: "RO" }), null);
    assert.equal(normalizeCountryCode(["RO"]), null);
  });
});

describe("parseCountryCode", () => {
  it("accepta coduri ISO 3166-1 alpha-2", () => {
    assert.equal(parseCountryCode("RO"), "RO");
    assert.equal(parseCountryCode("ro"), "RO");
    assert.equal(parseCountryCode(" us "), "US");
    assert.equal(parseCountryCode("DE"), "DE");
  });

  it("respinge codurile cu lungime gresita", () => {
    assert.equal(parseCountryCode("ROU"), null);
    assert.equal(parseCountryCode("R"), null);
    assert.equal(parseCountryCode(""), null);
  });

  it("respinge codurile care nu contin doar litere", () => {
    assert.equal(parseCountryCode("R1"), null);
    assert.equal(parseCountryCode("1R"), null);
    assert.equal(parseCountryCode("R-"), null);
    assert.equal(parseCountryCode("R O"), null);
  });

  it("respinge codurile rezervate (nu sunt tari reale)", () => {
    assert.equal(parseCountryCode("XX"), null);
    assert.equal(parseCountryCode("xx"), null);
    assert.equal(parseCountryCode("T1"), null);
    assert.equal(parseCountryCode("A1"), null);
    assert.equal(parseCountryCode("A2"), null);
    assert.equal(parseCountryCode("O1"), null);
  });

  it("respecta lista de coduri rezervate din configuratie", () => {
    const config = createConfig({ reservedCountryCodes: ["ZZ"] });

    assert.equal(parseCountryCode("ZZ", config), null);
    assert.equal(parseCountryCode("XX", config), "XX");
  });

  it("respecta pattern-ul din configuratie", () => {
    const config = createConfig({ countryCodePattern: /^[A-Z]{3}$/ });

    assert.equal(parseCountryCode("ROU", config), "ROU");
    assert.equal(parseCountryCode("RO", config), null);
  });
});

describe("isValidCountryCode", () => {
  it("returneaza boolean", () => {
    assert.equal(isValidCountryCode("RO"), true);
    assert.equal(isValidCountryCode("ro"), true);
    assert.equal(isValidCountryCode("XX"), false);
    assert.equal(isValidCountryCode("ROU"), false);
    assert.equal(isValidCountryCode(null), false);
    assert.equal(isValidCountryCode(undefined), false);
  });
});

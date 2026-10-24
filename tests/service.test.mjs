// =====================================================
// Teste — fatada publica (createLanguageService / initLanguage)
// Toate dependintele de browser sunt injectate.
// Nu se apeleaza niciun serviciu extern.
// =====================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createLanguageService } from "../js/i18n/index.js";
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

describe("createLanguageService().init()", () => {
  it("vizitator RO fara preferinta => limba ceruta romana, pagina rămâne EN pana la navigare", async () => {
    const documentRef = createFakeDocument();
    const instance = service({
      pathname: "/",
      storage: createFakeStorage(),
      document: documentRef,
      resolver: fakeResolver("RO")
    });

    const result = await instance.init();

    assert.equal(result.language, "ro");
    assert.equal(result.source, "country");
    assert.equal(result.country, "RO");
    assert.equal(result.pageLanguage, "en");
    assert.equal(documentRef.documentElement.lang, "en");
    assert.deepEqual(result.navigation, { action: "navigate", target: "/ro/" });
  });

  it("vizitator din alta tara fara preferinta => engleza", async () => {
    const documentRef = createFakeDocument();
    const instance = service({
      pathname: "/",
      storage: createFakeStorage(),
      document: documentRef,
      resolver: fakeResolver("US")
    });

    const result = await instance.init();

    assert.equal(result.language, "en");
    assert.equal(result.source, "country");
    assert.equal(documentRef.documentElement.lang, "en");
    assert.deepEqual(result.navigation, { action: "none", target: null });
  });

  it("eroare de geolocalizare => engleza", async () => {
    const instance = service({
      pathname: "/",
      storage: createFakeStorage(),
      document: createFakeDocument(),
      resolver: fakeResolver(null)
    });

    const result = await instance.init();

    assert.equal(result.language, "en");
    assert.equal(result.source, "default");
    assert.equal(result.country, null);
    assert.equal(result.pageLanguage, "en");
    assert.deepEqual(result.navigation, { action: "none", target: null });
  });

  it("URL explicit /ro/ => romana, fara detectarea tarii", async () => {
    const resolver = fakeResolver("DE");
    const documentRef = createFakeDocument();
    const instance = service({
      pathname: "/ro/",
      storage: createFakeStorage(),
      document: documentRef,
      resolver
    });

    const result = await instance.init();

    assert.equal(result.language, "ro");
    assert.equal(result.source, "url");
    assert.equal(resolver.calls, 0);
    assert.equal(documentRef.documentElement.lang, "ro");
  });

  it("preferinta salvata invinge tara detectata", async () => {
    const resolver = fakeResolver("RO");
    const documentRef = createFakeDocument();
    const instance = service({
      pathname: "/",
      storage: createFakeStorage({ "dmr.lang": "en" }),
      document: documentRef,
      resolver
    });

    const result = await instance.init();

    assert.equal(result.language, "en");
    assert.equal(result.source, "preference");
    assert.equal(resolver.calls, 0);
  });

  it("nu arunca daca resolver-ul esueaza", async () => {
    const instance = service({
      pathname: "/",
      storage: createFakeStorage(),
      document: createFakeDocument(),
      resolver: {
        async detect() {
          throw new Error("serviciu indisponibil");
        }
      }
    });

    await assert.doesNotReject(async () => {
      const result = await instance.init();

      assert.equal(result.language, "en");
      assert.equal(result.source, "default");
    });
  });

  it("functioneaza fara document injectat", async () => {
    const instance = service({
      pathname: "/ro/",
      storage: createFakeStorage(),
      document: null,
      resolver: fakeResolver("RO")
    });

    const result = await instance.init();

    assert.equal(result.language, "ro");
  });

  it("applyDom: false nu modifica DOM-ul", async () => {
    const documentRef = createFakeDocument();
    let queried = 0;

    documentRef.querySelectorAll = () => {
      queried += 1;
      return [];
    };

    const instance = service({
      pathname: "/",
      storage: createFakeStorage(),
      document: documentRef,
      resolver: fakeResolver("RO"),
      applyDom: false
    });

    await instance.init();

    assert.equal(queried, 0);
  });
});

describe("preferinta explicita", () => {
  it("setLanguage() salveaza preferinta si schimba limba activa", async () => {
    const storage = createFakeStorage();
    const instance = service({
      pathname: "/",
      storage,
      document: createFakeDocument(),
      resolver: fakeResolver("DE")
    });

    await instance.init();

    assert.equal(instance.setLanguage("ro"), "ro");
    assert.equal(instance.getLanguage(), "ro");
    assert.equal(storage.dump()["dmr.lang"], "ro");
  });

  it("setLanguage() respinge limbile nesuportate", () => {
    const instance = service({ storage: createFakeStorage(), document: null });

    assert.equal(instance.setLanguage("de"), null);
    assert.equal(instance.getLanguage(), "en");
  });

  it("preferinta salvata este respectata la o noua initializare", async () => {
    const storage = createFakeStorage();

    const first = service({
      pathname: "/",
      storage,
      document: null,
      resolver: fakeResolver("RO")
    });

    await first.init();
    first.setLanguage("en");

    const second = service({
      pathname: "/",
      storage,
      document: createFakeDocument(),
      resolver: fakeResolver("RO")
    });

    const result = await second.init();

    assert.equal(result.language, "en");
    assert.equal(result.source, "preference");
  });

  it("tara detectata nu suprascrie preferinta dupa reincarcare", async () => {
    const storage = createFakeStorage({ "dmr.lang": "en" });
    const resolver = fakeResolver("RO");

    const instance = service({
      pathname: "/",
      storage,
      document: null,
      resolver
    });

    const result = await instance.init();

    assert.equal(result.language, "en");
    assert.equal(resolver.calls, 0, "nu se repeta detectarea cand exista preferinta");
  });
});

describe("traduceri si navigare", () => {
  it("t() foloseste limba rezolvata", async () => {
    const instance = service({
      pathname: "/ro/",
      storage: createFakeStorage(),
      document: null,
      resolver: fakeResolver("RO")
    });

    await instance.init();

    assert.equal(instance.getLanguage(), "ro");
    assert.equal(instance.getLocale(), "ro-RO");
    assert.equal(instance.has("common.loading"), true);
  });

  it("getEquivalentPath() returneaza pagina echivalenta", async () => {
    const instance = service({
      pathname: "/",
      storage: createFakeStorage(),
      document: null,
      resolver: fakeResolver("RO")
    });

    await instance.init();

    assert.equal(instance.getEquivalentPath("ro"), "/ro/");
    assert.equal(instance.getEquivalentPath("en"), "/");
  });

  it("getEquivalentPath() functioneaza si pe pagina de registru", () => {
    const instance = service({
      pathname: "/registry.html",
      storage: createFakeStorage(),
      document: null
    });

    assert.equal(instance.getEquivalentPath("ro"), "/ro/registru/");
  });

  it("nu apeleaza serviciul extern cand fetchImpl este null", async () => {
    const original = globalThis.fetch;
    let calls = 0;

    globalThis.fetch = () => {
      calls += 1;
      throw new Error("reteaua este interzisa in teste");
    };

    try {
      const instance = service({
        pathname: "/",
        storage: createFakeStorage(),
        document: createFakeDocument()
      });

      const result = await instance.init();

      assert.equal(result.language, "en");
      assert.equal(calls, 0);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("formatNumber() respecta limba activa", async () => {
    const instance = service({
      pathname: "/ro/",
      storage: createFakeStorage(),
      document: null
    });

    await instance.init();

    assert.equal(instance.formatNumber(1234), "1.234");
  });
});

// =====================================================
// Teste — normalizare, cale URL, persistenta preferintei
// Nu se apeleaza niciun serviciu extern.
// =====================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  countryToLanguage,
  createLanguageStore,
  equivalentPath,
  languageFromPath,
  normalizeLanguage,
  resolveLanguage
} from "../js/i18n/language.js";
import { createConfig } from "../js/i18n/config.js";
import { createFailingStorage, createFakeStorage } from "./helpers/fakes.mjs";

describe("normalizeLanguage", () => {
  it("accepta coduri simple si variante regionale", () => {
    assert.equal(normalizeLanguage("ro"), "ro");
    assert.equal(normalizeLanguage("RO"), "ro");
    assert.equal(normalizeLanguage("ro-RO"), "ro");
    assert.equal(normalizeLanguage("ro_RO"), "ro");
    assert.equal(normalizeLanguage(" en-GB "), "en");
  });

  it("respinge limbile nesuportate si valorile invalide", () => {
    assert.equal(normalizeLanguage("de"), null);
    assert.equal(normalizeLanguage("fr-FR"), null);
    assert.equal(normalizeLanguage(""), null);
    assert.equal(normalizeLanguage("   "), null);
    assert.equal(normalizeLanguage(null), null);
    assert.equal(normalizeLanguage(undefined), null);
    assert.equal(normalizeLanguage(7), null);
  });

  it("respecta lista de limbi din configuratie", () => {
    const config = createConfig({ supportedLanguages: ["ro", "en", "de"] });

    assert.equal(normalizeLanguage("de", config), "de");
  });
});

describe("languageFromPath", () => {
  it("detecteaza prefixul explicit /ro/ si /en/", () => {
    assert.equal(languageFromPath("/ro/"), "ro");
    assert.equal(languageFromPath("/ro"), "ro");
    assert.equal(languageFromPath("/ro/registru/"), "ro");
    assert.equal(languageFromPath("/en/"), "en");
    assert.equal(languageFromPath("/en/about/"), "en");
  });

  it("returneaza null pentru URL-urile neprefixate", () => {
    assert.equal(languageFromPath("/"), null);
    assert.equal(languageFromPath("/registry.html"), null);
    assert.equal(languageFromPath("/i/"), null);
    assert.equal(languageFromPath("/index.html"), null);
    assert.equal(languageFromPath("/robots.txt"), null);
    assert.equal(languageFromPath("/certificari/"), null);
  });

  it("returneaza null pentru prefixe care nu sunt limbi suportate", () => {
    assert.equal(languageFromPath("/de/"), null);
    assert.equal(languageFromPath("/xyz/"), null);
  });

  it("ignoreaza valorile care nu sunt string-uri", () => {
    assert.equal(languageFromPath(null), null);
    assert.equal(languageFromPath(undefined), null);
  });
});

describe("countryToLanguage", () => {
  it("RO => romana", () => {
    assert.equal(countryToLanguage("RO"), "ro");
    assert.equal(countryToLanguage("ro"), "ro");
  });

  it("orice alta tara valida => engleza", () => {
    assert.equal(countryToLanguage("DE"), "en");
    assert.equal(countryToLanguage("US"), "en");
    assert.equal(countryToLanguage("MD"), "en");
  });

  it("tara nedetectabila sau invalida => null (fallback aplicat de apelant)", () => {
    assert.equal(countryToLanguage(null), null);
    assert.equal(countryToLanguage(undefined), null);
    assert.equal(countryToLanguage(""), null);
    assert.equal(countryToLanguage("XX"), null);
    assert.equal(countryToLanguage("ROU"), null);
  });
});

describe("createLanguageStore", () => {
  it("scrie si citeste preferinta", () => {
    const storage = createFakeStorage();
    const store = createLanguageStore(storage);

    assert.equal(store.get(), null);
    assert.equal(store.set("ro"), "ro");
    assert.equal(store.get(), "ro");
    assert.equal(storage.dump()["dmr.lang"], "ro");
  });

  it("normalizeaza valoarea salvata si ignora valorile invalide", () => {
    const storage = createFakeStorage({ "dmr.lang": "RO-RO" });
    const store = createLanguageStore(storage);

    assert.equal(store.get(), "ro");
    assert.equal(store.set("de"), null);
    assert.equal(store.get(), "ro", "preferinta valida nu este suprascrisa");
  });

  it("clear() elimina preferinta", () => {
    const storage = createFakeStorage({ "dmr.lang": "en" });
    const store = createLanguageStore(storage);

    store.clear();

    assert.equal(store.get(), null);
  });

  it("functioneaza fara storage, fara a arunca", () => {
    const store = createLanguageStore(null);

    assert.equal(store.get(), null);
    assert.equal(store.set("ro"), null);
    assert.doesNotThrow(() => store.clear());
  });

  it("storage indisponibil nu produce exceptii", () => {
    const store = createLanguageStore(createFailingStorage());

    assert.equal(store.get(), null);
    assert.equal(store.set("ro"), null);
    assert.doesNotThrow(() => store.clear());
  });
});

// =====================================================
// ORDINEA DE PRIORITATE
// =====================================================

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

describe("resolveLanguage — ordinea de prioritate", () => {
  it("1. URL explicit invinge preferinta si tara", async () => {
    const resolver = fakeResolver("RO");

    const result = await resolveLanguage({
      pathname: "/ro/registru/",
      store: createLanguageStore(createFakeStorage({ "dmr.lang": "en" })),
      resolver
    });

    assert.equal(result.language, "ro");
    assert.equal(result.source, "url");
    assert.equal(resolver.calls, 0, "nu se apeleaza serviciul geo pentru URL explicit");
  });

  it("1. URL explicit /en/ invinge o preferinta romaneasca", async () => {
    const result = await resolveLanguage({
      pathname: "/en/",
      store: createLanguageStore(createFakeStorage({ "dmr.lang": "ro" }))
    });

    assert.equal(result.language, "en");
    assert.equal(result.source, "url");
  });

  it("2. preferinta salvata invinge tara detectata", async () => {
    const resolver = fakeResolver("RO");

    const result = await resolveLanguage({
      pathname: "/",
      store: createLanguageStore(createFakeStorage({ "dmr.lang": "en" })),
      resolver
    });

    assert.equal(result.language, "en");
    assert.equal(result.source, "preference");
    assert.equal(resolver.calls, 0, "nu se re-detecteaza tara cand exista preferinta");
  });

  it("3. tara Romania => romana", async () => {
    const result = await resolveLanguage({
      pathname: "/",
      store: createLanguageStore(createFakeStorage()),
      resolver: fakeResolver("RO")
    });

    assert.deepEqual(result, { language: "ro", source: "country", country: "RO" });
  });

  it("3. alta tara => engleza", async () => {
    const result = await resolveLanguage({
      pathname: "/",
      store: createLanguageStore(createFakeStorage()),
      resolver: fakeResolver("DE")
    });

    assert.deepEqual(result, { language: "en", source: "country", country: "DE" });
  });

  it("4. tara nedetectabila => engleza (fallback)", async () => {
    const result = await resolveLanguage({
      pathname: "/",
      store: createLanguageStore(createFakeStorage()),
      resolver: fakeResolver(null)
    });

    assert.deepEqual(result, { language: "en", source: "default", country: null });
  });

  it("4. cod de tara invalid => engleza (fallback)", async () => {
    const result = await resolveLanguage({
      pathname: "/",
      resolver: fakeResolver("ROU")
    });

    assert.deepEqual(result, { language: "en", source: "default", country: null });
  });

  it("4. eroare in resolver => engleza, fara exceptie", async () => {
    const resolver = {
      async detect() {
        throw new Error("serviciu indisponibil");
      }
    };

    await assert.doesNotReject(async () => {
      const result = await resolveLanguage({ pathname: "/", resolver });

      assert.deepEqual(result, { language: "en", source: "default", country: null });
    });
  });

  it("4. fara resolver => engleza (fallback)", async () => {
    const result = await resolveLanguage({ pathname: "/" });

    assert.deepEqual(result, { language: "en", source: "default", country: null });
  });

  it("sursa nu foloseste navigator.language ca semnal de limba", async () => {
    const { readdir, readFile } = await import("node:fs/promises");

    const directory = new URL("../js/i18n/", import.meta.url);
    const entries = await readdir(directory, { recursive: true });
    const sources = entries.filter((entry) => entry.endsWith(".js"));

    assert.ok(sources.length >= 6, "trebuie verificate toate modulele i18n");

    const offenders = [];

    for (const entry of sources) {
      const source = await readFile(new URL(entry, directory), "utf8");

      if (/navigator\s*\.\s*languages?/.test(source)) offenders.push(entry);
    }

    assert.deepEqual(offenders, [], "navigator.language nu este folosit nicaieri");
  });

  it("foloseste / ca pathname implicit", async () => {
    const result = await resolveLanguage({
      resolver: fakeResolver("RO")
    });

    assert.equal(result.language, "ro");
    assert.equal(result.source, "country");
  });
});

// =====================================================
// URL-URI ECHIVALENTE
// =====================================================

describe("equivalentPath", () => {
  it("perechile de pagini definite in configuratie", () => {
    assert.equal(equivalentPath("/", "ro"), "/ro/");
    assert.equal(equivalentPath("/", "en"), "/");
    assert.equal(equivalentPath("/ro/", "en"), "/");
    assert.equal(equivalentPath("/registry.html", "ro"), "/ro/registru/");
    assert.equal(equivalentPath("/ro/registru/", "en"), "/registry.html");
  });

  it("perechile functioneaza si in sens invers", () => {
    assert.equal(equivalentPath("/ro/registru/", "ro"), "/ro/registru/");
    assert.equal(equivalentPath("/registry.html", "en"), "/registry.html");
  });

  it("regula generica pentru pagini fara pereche definita", () => {
    assert.equal(equivalentPath("/404.html", "ro"), "/ro/404.html");
    assert.equal(equivalentPath("/ro/404.html", "en"), "/404.html");
    assert.equal(equivalentPath("/ro", "en"), "/");
  });

  it("nu dubleaza prefixul daca acesta exista deja", () => {
    assert.equal(equivalentPath("/ro/registru/", "ro"), "/ro/registru/");
    assert.equal(equivalentPath("/ro", "ro"), "/ro");
  });

  it("returneaza null pentru limbi sau cai invalide", () => {
    assert.equal(equivalentPath("/", "de"), null);
    assert.equal(equivalentPath("/", null), null);
    assert.equal(equivalentPath(null, "ro"), null);
    assert.equal(equivalentPath("", "ro"), null);
  });

  it("nu produce bucle: ro -> en -> ro revine la aceeasi cale", () => {
    const paths = ["/", "/registry.html", "/404.html"];

    paths.forEach((path) => {
      const roPath = equivalentPath(path, "ro");
      const backToEn = equivalentPath(roPath, "en");

      assert.equal(backToEn, path, `cale ${path}`);
    });
  });
});

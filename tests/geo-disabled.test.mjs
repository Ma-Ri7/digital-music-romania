// =====================================================
// Teste — detectarea tarii dupa IP este DEZACTIVATA implicit
//
// Verifica doua lucruri:
//  1. in configuratia implicita nu exista NICIUN apel catre GeoJS
//     (nici `fetch`, nici `resolver.detect()`, nici scriere in `dmr.geo`);
//  2. cand detectarea este activata EXPLICIT, comportamentul GeoJS
//     functioneaza exact ca inainte.
//
// Nu se apeleaza niciun serviciu extern: fetch-ul este injectat.
// =====================================================

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  GEO_DETECTION_ENABLED,
  GEO_ENDPOINT,
  createConfig,
  defaultConfig
} from "../js/i18n/config.js";
import { createCountryResolver } from "../js/i18n/geo.js";
import { createLanguageService } from "../js/i18n/index.js";
import { startPageLanguage } from "../js/i18n/page.js";
import { resolveLanguage } from "../js/i18n/language.js";
import { resetPageTranslator } from "../js/i18n/runtime.js";
import {
  createFakeFetch,
  createFakeLocation,
  createFakeStorage,
  jsonResponse
} from "./helpers/fakes.mjs";
import { createFakeDocument, createFakeElement } from "./helpers/fake-dom.mjs";

beforeEach(() => {
  resetPageTranslator();
});

/**
 * fetch fals care inregistreaza apelurile si raspunde ca GeoJS.
 */
function geoFetch(country = "RO") {
  return createFakeFetch(() => jsonResponse({ country, country_3: "ROU", name: "Romania" }));
}

function service(pathname, options = {}) {
  return createLanguageService({
    pathname,
    storage: options.storage || createFakeStorage(),
    sessionStorage: options.sessionStorage || createFakeStorage(),
    document: options.document !== undefined ? options.document : null,
    fetchImpl: options.fetchImpl,
    config: options.config
  });
}

/**
 * Document cu un selector de limba RO | EN, ca in paginile reale.
 */
function switcherDocument() {
  const ro = createFakeElement("a");
  ro.setAttribute("data-lang-option", "ro");

  const en = createFakeElement("a");
  en.setAttribute("data-lang-option", "en");

  const container = createFakeElement("div");
  container.setAttribute("data-lang-switcher", "");

  container.querySelector = (selector) => {
    const match = /^\[data-lang-option="([^"]+)"\]$/.exec(selector);

    if (!match) return null;
    if (match[1] === "ro") return ro;
    if (match[1] === "en") return en;

    return null;
  };

  const documentRef = createFakeDocument({
    selectors: { "[data-lang-switcher]": container }
  });

  return { documentRef, container, ro, en };
}

// =====================================================
// 1. VALOAREA IMPLICITA
// =====================================================

describe("configuratia implicita a detectarii tarii", () => {
  it("GEO_DETECTION_ENABLED este false", () => {
    assert.equal(GEO_DETECTION_ENABLED, false);
  });

  it("defaultConfig are detectarea dezactivata", () => {
    assert.equal(defaultConfig.geoDetectionEnabled, false);
  });

  it("createConfig() pastreaza detectarea dezactivata", () => {
    assert.equal(createConfig().geoDetectionEnabled, false);
  });

  it("activarea explicita este posibila prin configurare", () => {
    assert.equal(createConfig({ geoDetectionEnabled: true }).geoDetectionEnabled, true);
  });

  it("timeout-ul ramane 2000 ms, indiferent de comutator", () => {
    assert.equal(defaultConfig.geoTimeoutMs, 2000);
    assert.equal(createConfig({ geoDetectionEnabled: true }).geoTimeoutMs, 2000);
  });

  it("endpoint-ul GeoJS ramane definit, pentru o reactivare ulterioara", () => {
    assert.equal(defaultConfig.geoEndpoint, GEO_ENDPOINT);
    assert.ok(GEO_ENDPOINT.includes("get.geojs.io"));
  });
});

// =====================================================
// 2. ZERO APELURI CATRE GEOJS
// =====================================================

describe("zero apeluri catre GeoJS cand detectarea este OFF", () => {
  it("createLanguageService() nu construieste niciun resolver", () => {
    assert.equal(service("/").resolver, null);
  });

  it("init() nu face nicio cerere, chiar daca fetchImpl este injectat", async () => {
    const fetchImpl = geoFetch("RO");
    const instance = service("/", { fetchImpl });

    const result = await instance.init();

    assert.equal(fetchImpl.calls.length, 0, "fetch-ul injectat nu este apelat");
    assert.equal(result.language, "en");
    assert.equal(result.source, "default");
    assert.equal(result.country, null);
  });

  it("init() nu face nicio cerere nici cand fetchImpl lipseste", async () => {
    const instance = service("/", { document: createFakeDocument() });

    const result = await instance.init();

    assert.equal(result.language, "en");
    assert.equal(result.source, "default");
  });

  it("nu scrie si nu citeste nicio data de tara in sessionStorage", async () => {
    const sessionStorage = createFakeStorage();
    const instance = service("/", { sessionStorage, fetchImpl: geoFetch("RO") });

    await instance.init();

    assert.deepEqual(sessionStorage.dump(), {}, "dmr.geo nu trebuie scris");
  });

  it("nu se atinge nici globalThis.fetch", async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;

    globalThis.fetch = () => {
      calls += 1;
      throw new Error("reteaua este interzisa cand detectarea este OFF");
    };

    try {
      const instance = service("/", { document: createFakeDocument() });

      await instance.init();

      assert.equal(calls, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("resolveLanguage() fara resolver => engleza, fara retea", async () => {
    const result = await resolveLanguage({ pathname: "/", resolver: null });

    assert.deepEqual(result, { language: "en", source: "default", country: null });
  });

  it("createCountryResolver() cu configuratia implicita nu atinge reteaua", async () => {
    const fetchImpl = geoFetch("RO");
    const storage = createFakeStorage();

    const resolver = createCountryResolver({ fetchImpl, storage });

    assert.equal(resolver.enabled, false);
    assert.equal(await resolver.detect(), null);
    assert.equal(resolver.readCache(), null);
    assert.equal(fetchImpl.calls.length, 0, "detect() nu trebuie sa apeleze fetch");
    assert.equal(storage.stats.reads, 0, "cache-ul nu este citit");
    assert.equal(storage.stats.writes, 0, "cache-ul nu este scris");
  });

  it("createCountryResolver() refuza si cand fetchImpl este global", async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;

    globalThis.fetch = () => {
      calls += 1;
      throw new Error("reteaua este interzisa cand detectarea este OFF");
    };

    try {
      const resolver = createCountryResolver({ storage: createFakeStorage() });

      assert.equal(await resolver.detect(), null);
      assert.equal(calls, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("startPageLanguage() cu configuratia implicita nu face nicio cerere", async () => {
    const fetchImpl = geoFetch("RO");
    const locationRef = createFakeLocation("/");

    const outcome = await startPageLanguage({
      pathname: "/",
      storage: createFakeStorage(),
      sessionStorage: createFakeStorage(),
      document: createFakeDocument(),
      location: locationRef,
      fetchImpl
    });

    assert.equal(fetchImpl.calls.length, 0);
    assert.equal(outcome.navigated, false);
    assert.deepEqual(locationRef.replaced, []);
    assert.equal(outcome.result.source, "default");
    assert.equal(outcome.result.language, "en");
  });
});

// =====================================================
// 3. URL-URILE ROMANESTI FUNCTIONEAZA IN CONTINUARE
// =====================================================

describe("URL-urile /ro/ functioneaza fara detectarea tarii", () => {
  it("/ro/ => romana, fara nicio cerere", async () => {
    const fetchImpl = geoFetch("DE");
    const documentRef = createFakeDocument();

    const result = await service("/ro/", { document: documentRef, fetchImpl }).init();

    assert.equal(result.language, "ro");
    assert.equal(result.source, "url");
    assert.equal(result.pageLanguage, "ro");
    assert.equal(documentRef.documentElement.lang, "ro");
    assert.deepEqual(result.navigation, { action: "none", target: null });
    assert.equal(fetchImpl.calls.length, 0);
  });

  it("/ro/registru/ => romana, fara nicio cerere", async () => {
    const fetchImpl = geoFetch("DE");
    const documentRef = createFakeDocument();

    const result = await service("/ro/registru/", { document: documentRef, fetchImpl }).init();

    assert.equal(result.language, "ro");
    assert.equal(result.source, "url");
    assert.equal(result.pageLanguage, "ro");
    assert.deepEqual(result.navigation, { action: "none", target: null });
    assert.equal(fetchImpl.calls.length, 0);
  });

  it("traducerile raman active pe pagina romaneasca", async () => {
    const instance = service("/ro/", { fetchImpl: geoFetch("DE") });

    await instance.init();

    assert.equal(instance.getLanguage(), "ro");
    assert.equal(instance.getLocale(), "ro-RO");
    assert.equal(instance.has("common.loading"), true);
  });

  it("navigarea intre paginile lingvistice ramane disponibila", () => {
    assert.equal(service("/").getEquivalentPath("ro"), "/ro/");
    assert.equal(service("/ro/").getEquivalentPath("en"), "/");
    assert.equal(service("/registry.html").getEquivalentPath("ro"), "/ro/registru/");
    assert.equal(service("/ro/registru/").getEquivalentPath("en"), "/registry.html");
  });

  it("pagina /registry.html ramane in engleza", async () => {
    const result = await service("/registry.html", { fetchImpl: geoFetch("RO") }).init();

    assert.equal(result.language, "en");
    assert.equal(result.pageLanguage, "en");
    assert.equal(result.source, "default");
  });
});

// =====================================================
// 4. PREFERINTA SALVATA
// =====================================================

describe("preferinta salvata este respectata fara detectarea tarii", () => {
  it("dmr.lang = ro pe / => romana, fara nicio cerere", async () => {
    const storage = createFakeStorage({ "dmr.lang": "ro" });
    const fetchImpl = geoFetch("DE");

    const result = await service("/", { storage, fetchImpl }).init();

    assert.equal(result.language, "ro");
    assert.equal(result.source, "preference");
    assert.equal(result.country, null);
    assert.equal(fetchImpl.calls.length, 0);
  });

  it("preferinta duce la navigarea spre pagina echivalenta", async () => {
    const storage = createFakeStorage({ "dmr.lang": "ro" });

    const result = await service("/", { storage, fetchImpl: geoFetch("DE") }).init();

    assert.deepEqual(result.navigation, { action: "navigate", target: "/ro/" });
  });

  it("pe /ro/ URL-ul explicit ramane prioritar fata de preferinta salvata", async () => {
    const storage = createFakeStorage({ "dmr.lang": "en" });
    const fetchImpl = geoFetch("RO");

    const result = await service("/ro/", { storage, fetchImpl }).init();

    assert.equal(result.language, "ro");
    assert.equal(result.source, "url");
    assert.deepEqual(result.navigation, { action: "none", target: null });
    assert.equal(fetchImpl.calls.length, 0);
  });

  it("preferinta invalida este ignorata si se aplica engleza", async () => {
    const storage = createFakeStorage({ "dmr.lang": "de" });

    const result = await service("/", { storage, fetchImpl: geoFetch("RO") }).init();

    assert.equal(result.language, "en");
    assert.equal(result.source, "default");
  });
});

// =====================================================
// 5. FALLBACK
// =====================================================

describe("fallback-ul este engleza", () => {
  it("fara URL explicit si fara preferinta => engleza", async () => {
    const result = await service("/", { fetchImpl: geoFetch("RO") }).init();

    assert.equal(result.language, "en");
    assert.equal(result.source, "default");
    assert.equal(result.country, null);
    assert.equal(result.pageLanguage, "en");
  });

  it("codul de tara din fetch nu are nicio influenta (nu exista apel)", async () => {
    const fetchImpl = geoFetch("XX");

    const result = await service("/", { fetchImpl }).init();

    assert.equal(result.language, "en");
    assert.equal(fetchImpl.calls.length, 0);
  });
});

// =====================================================
// 6. SELECTORUL MANUAL
// =====================================================

describe("selectorul manual ramane functional", () => {
  it("click pe RO salveaza preferinta, fara nicio cerere", async () => {
    const storage = createFakeStorage();
    const { documentRef, ro } = switcherDocument();
    const fetchImpl = geoFetch("DE");

    await startPageLanguage({
      pathname: "/",
      storage,
      sessionStorage: createFakeStorage(),
      document: documentRef,
      location: createFakeLocation("/"),
      fetchImpl
    });

    documentRef.dispatchEvent({ type: "click", target: ro });

    assert.equal(storage.dump()["dmr.lang"], "ro");
    assert.equal(fetchImpl.calls.length, 0);
  });

  it("alegerea supravietuieste la o noua initializare", async () => {
    const storage = createFakeStorage();
    const first = service("/", { storage });

    await first.init();
    assert.equal(first.setLanguage("ro"), "ro");

    const second = service("/", { storage, fetchImpl: geoFetch("DE") });
    const result = await second.init();

    assert.equal(result.language, "ro");
    assert.equal(result.source, "preference");
  });

  it("href-urile selectorului sunt corecte pe pagina romaneasca", async () => {
    const { documentRef, container } = switcherDocument();

    await startPageLanguage({
      pathname: "/ro/",
      storage: createFakeStorage(),
      sessionStorage: createFakeStorage(),
      document: documentRef,
      location: createFakeLocation("/ro/"),
      fetchImpl: geoFetch("RO")
    });

    const ro = container.querySelector('[data-lang-option="ro"]');
    const en = container.querySelector('[data-lang-option="en"]');

    assert.equal(ro.getAttribute("href"), "/ro/");
    assert.equal(en.getAttribute("href"), "/");
    assert.equal(ro.getAttribute("aria-current"), "true");
    assert.equal(en.getAttribute("aria-current"), null);
  });
});

// =====================================================
// 7. REACTIVARE EXPLICITA
// =====================================================

describe("reactivarea explicita pastreaza comportamentul GeoJS", () => {
  it("createCountryResolver() cu geoDetectionEnabled=true detecteaza tara", async () => {
    const fetchImpl = geoFetch("RO");
    const storage = createFakeStorage();

    const resolver = createCountryResolver({
      fetchImpl,
      storage,
      config: createConfig({ geoDetectionEnabled: true })
    });

    assert.equal(resolver.enabled, true);
    assert.equal(await resolver.detect(), "RO");
    assert.equal(fetchImpl.calls.length, 1);
    assert.equal(fetchImpl.calls[0].url, GEO_ENDPOINT);
    assert.equal(storage.dump()["dmr.geo"], "RO");
  });

  it("serviciul detecteaza tara cand este activat explicit", async () => {
    const fetchImpl = geoFetch("RO");

    const result = await service("/", {
      fetchImpl,
      config: createConfig({ geoDetectionEnabled: true })
    }).init();

    assert.equal(result.language, "ro");
    assert.equal(result.source, "country");
    assert.equal(result.country, "RO");
    assert.equal(fetchImpl.calls.length, 1);
  });

  it("URL-ul explicit ramane prioritar chiar si cu detectarea activa", async () => {
    const fetchImpl = geoFetch("DE");

    const result = await service("/ro/", {
      fetchImpl,
      config: createConfig({ geoDetectionEnabled: true })
    }).init();

    assert.equal(result.language, "ro");
    assert.equal(result.source, "url");
    assert.equal(fetchImpl.calls.length, 0);
  });

  it("preferinta salvata ramane prioritara fata de tara detectata", async () => {
    const fetchImpl = geoFetch("RO");

    const result = await service("/", {
      storage: createFakeStorage({ "dmr.lang": "en" }),
      fetchImpl,
      config: createConfig({ geoDetectionEnabled: true })
    }).init();

    assert.equal(result.language, "en");
    assert.equal(result.source, "preference");
    assert.equal(fetchImpl.calls.length, 0);
  });
});

// =====================================================
// 8. GARZI STRUCTURALE
// =====================================================

/**
 * Listeaza fisierele cu o anumita extensie, sub o radacina.
 * Ignora directoarele ascunse si node_modules.
 */
async function listFiles(base, extension) {
  const { readdir } = await import("node:fs/promises");

  const entries = await readdir(base, { recursive: true });
  const found = [];

  for (const entry of entries) {
    if (!entry.endsWith(extension)) continue;
    if (entry.split("/").some((part) => part.startsWith("."))) continue;
    if (entry.includes("node_modules")) continue;

    found.push(entry);
  }

  return found;
}

describe("garzi structurale", () => {
  it("endpoint-ul GeoJS este definit intr-un singur loc din js/", async () => {
    const { readFile } = await import("node:fs/promises");

    const base = new URL("../js/", import.meta.url);
    const offenders = [];

    for (const entry of await listFiles(base, ".js")) {
      const source = await readFile(new URL(entry, base), "utf8");

      if (/get\.geojs\.io/.test(source) && entry !== "i18n/config.js") {
        offenders.push(entry);
      }
    }

    assert.deepEqual(offenders, [], "doar config.js poate contine endpoint-ul GeoJS");
  });

  it("doar geo.js foloseste fetch-ul injectat pentru geolocalizare", async () => {
    const { readFile } = await import("node:fs/promises");

    const base = new URL("../js/", import.meta.url);
    const offenders = [];

    for (const entry of await listFiles(base, ".js")) {
      const source = await readFile(new URL(entry, base), "utf8");

      if (/\bfetchImpl\s*\(/.test(source) && entry !== "i18n/geo.js") {
        offenders.push(entry);
      }
    }

    assert.deepEqual(offenders, [], "doar geo.js poate apela fetch-ul de geolocalizare");
  });

  it("nicio pagina HTML nu declara endpoint-ul GeoJS", async () => {
    const { readFile } = await import("node:fs/promises");

    const base = new URL("../", import.meta.url);
    const offenders = [];

    for (const entry of await listFiles(base, ".html")) {
      const source = await readFile(new URL(entry, base), "utf8");

      if (/get\.geojs\.io/.test(source)) offenders.push(entry);
    }

    assert.deepEqual(offenders, [], "endpoint-ul nu trebuie hardcodat in pagini");
  });
});

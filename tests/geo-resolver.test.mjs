// =====================================================
// Teste — resolverul de tara
// Nu se apeleaza niciun serviciu extern: fetch-ul este injectat.
// =====================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createCountryResolver } from "../js/i18n/geo.js";
import { createConfig, GEO_ENDPOINT } from "../js/i18n/config.js";
import {
  createFailingStorage,
  createFakeFetch,
  createFakeStorage,
  createHangingFetch,
  invalidJsonResponse,
  jsonResponse
} from "./helpers/fakes.mjs";

// Detectarea tarii dupa IP este DEZACTIVATA implicit (vezi config.js).
// Testele din acest fisier acopera comportamentul resolverului ATUNCI CAND
// detectarea este activata EXPLICIT, prin configurare.
const GEO_ENABLED = createConfig({ geoDetectionEnabled: true });

/**
 * Resolver cu detectarea activata explicit.
 * Daca se transmite `options.config`, acesta trebuie sa contina
 * `geoDetectionEnabled: true`.
 */
function geoResolver(options = {}) {
  return createCountryResolver({
    ...options,
    config: options.config || GEO_ENABLED
  });
}

function resolverWith(handler, options = {}) {
  return geoResolver({
    fetchImpl: createFakeFetch(handler),
    storage: options.storage !== undefined ? options.storage : createFakeStorage(),
    config: options.config,
    ...options.extra
  });
}

describe("detect() — rezultate valide", () => {
  it("vizitator din Romania => RO", async () => {
    const fetchImpl = createFakeFetch(() =>
      jsonResponse({ country: "RO", country_3: "ROU", name: "Romania" })
    );

    const resolver = geoResolver({ fetchImpl, storage: createFakeStorage() });

    assert.equal(await resolver.detect(), "RO");
  });

  it("vizitator din alta tara => codul acelei tari", async () => {
    const fetchImpl = createFakeFetch(() => jsonResponse({ country: "DE" }));

    const resolver = geoResolver({ fetchImpl, storage: createFakeStorage() });

    assert.equal(await resolver.detect(), "DE");
  });

  it("normalizeaza codul primit cu litere mici", async () => {
    const fetchImpl = createFakeFetch(() => jsonResponse({ country: "ro" }));

    const resolver = geoResolver({ fetchImpl, storage: createFakeStorage() });

    assert.equal(await resolver.detect(), "RO");
  });
});

describe("detect() — raspunsuri invalide", () => {
  it("lipseste campul country", async () => {
    const resolver = resolverWith(() => jsonResponse({ ip: "1.2.3.4" }));

    assert.equal(await resolver.detect(), null);
  });

  it("country nu este string", async () => {
    const resolver = resolverWith(() => jsonResponse({ country: 42 }));

    assert.equal(await resolver.detect(), null);
  });

  it("country are format invalid", async () => {
    const resolver = resolverWith(() => jsonResponse({ country: "ROU" }));

    assert.equal(await resolver.detect(), null);
  });

  it("country este cod rezervat", async () => {
    const resolver = resolverWith(() => jsonResponse({ country: "XX" }));

    assert.equal(await resolver.detect(), null);
  });

  it("payload este null sau un array", async () => {
    assert.equal(await resolverWith(() => jsonResponse(null)).detect(), null);
    assert.equal(await resolverWith(() => jsonResponse(["RO"])).detect(), null);
    assert.equal(await resolverWith(() => jsonResponse("RO")).detect(), null);
  });

  it("JSON invalid", async () => {
    const resolver = resolverWith(() => invalidJsonResponse());

    assert.equal(await resolver.detect(), null);
  });

  it("erori HTTP (500, 429, 404)", async () => {
    for (const status of [500, 429, 404]) {
      const resolver = resolverWith(() => jsonResponse({}, { ok: false, status }));

      assert.equal(await resolver.detect(), null, `status ${status}`);
    }
  });

  it("raspuns fara obiectul response", async () => {
    const resolver = resolverWith(() => null);

    assert.equal(await resolver.detect(), null);
  });
});

describe("detect() — erori de retea, offline, timeout", () => {
  it("offline: fetch respinge => null", async () => {
    const fetchImpl = createFakeFetch(() => {
      throw new TypeError("Failed to fetch");
    });

    const resolver = geoResolver({ fetchImpl, storage: createFakeStorage() });

    assert.equal(await resolver.detect(), null);
  });

  it("fetch arunca sincron => null, fara exceptie propagata", async () => {
    const fetchImpl = () => {
      throw new Error("boom");
    };

    const resolver = geoResolver({ fetchImpl, storage: createFakeStorage() });

    await assert.doesNotReject(async () => {
      assert.equal(await resolver.detect(), null);
    });
  });

  it("timeout: raspuns care nu sosește => null", async () => {
    const fetchImpl = createHangingFetch();

    const resolver = geoResolver({
      fetchImpl,
      storage: createFakeStorage(),
      config: createConfig({ geoTimeoutMs: 20, geoDetectionEnabled: true })
    });

    assert.equal(await resolver.detect(), null);
    assert.equal(fetchImpl.calls.length, 1);
  });

  it("timeout: semnalul de abort este transmis request-ului", async () => {
    const fetchImpl = createHangingFetch();

    const resolver = geoResolver({
      fetchImpl,
      storage: createFakeStorage(),
      config: createConfig({ geoTimeoutMs: 20, geoDetectionEnabled: true })
    });

    await resolver.detect();

    assert.ok(fetchImpl.calls[0].options.signal, "signal trebuie transmis");
    assert.equal(fetchImpl.calls[0].options.signal.aborted, true);
  });

  it("fara implementare fetch => null, fara a arunca", async () => {
    const resolver = geoResolver({ fetchImpl: null });

    await assert.doesNotReject(async () => {
      assert.equal(await resolver.detect(), null);
    });
  });

  it("detect() nu respinge niciodata, indiferent de configuratia invalida", async () => {
    const resolver = geoResolver({
      fetchImpl: createFakeFetch(() => jsonResponse({ country: "RO" })),
      config: createConfig({ geoTimeoutMs: 0, geoDetectionEnabled: true })
    });

    await assert.doesNotReject(async () => {
      await resolver.detect();
    });
  });
});

describe("cererea catre serviciul extern", () => {
  it("foloseste endpoint-ul configurat, fara parametri de query", async () => {
    const fetchImpl = createFakeFetch(() => jsonResponse({ country: "RO" }));

    await geoResolver({ fetchImpl, storage: createFakeStorage() }).detect();

    assert.equal(fetchImpl.calls.length, 1);
    assert.equal(fetchImpl.calls[0].url, GEO_ENDPOINT);
    assert.ok(!fetchImpl.calls[0].url.includes("?"), "nu se adauga query params");
  });

  it("nu trimite cookie-uri si nu trimite Referer", async () => {
    const fetchImpl = createFakeFetch(() => jsonResponse({ country: "RO" }));

    await geoResolver({ fetchImpl, storage: createFakeStorage() }).detect();

    const options = fetchImpl.calls[0].options;

    assert.equal(options.credentials, "omit");
    assert.equal(options.referrerPolicy, "no-referrer");
    assert.equal(options.method, "GET");
  });

  it("respecta un endpoint alternativ din configuratie", async () => {
    const fetchImpl = createFakeFetch(() => jsonResponse({ country: "RO" }));

    const resolver = geoResolver({
      fetchImpl,
      storage: createFakeStorage(),
      config: createConfig({ geoEndpoint: "https://example.test/geo.json", geoDetectionEnabled: true })
    });

    await resolver.detect();

    assert.equal(fetchImpl.calls[0].url, "https://example.test/geo.json");
  });
});

describe("cache-ul de sesiune", () => {
  it("un singur apel de retea pentru doua detectari", async () => {
    const fetchImpl = createFakeFetch(() => jsonResponse({ country: "RO" }));
    const storage = createFakeStorage();

    const resolver = geoResolver({ fetchImpl, storage });

    assert.equal(await resolver.detect(), "RO");
    assert.equal(await resolver.detect(), "RO");
    assert.equal(fetchImpl.calls.length, 1, "al doilea apel vine din cache");
    assert.equal(storage.dump()["dmr.geo"], "RO");
  });

  it("rezultatul invalid nu se cacheaza", async () => {
    const fetchImpl = createFakeFetch(() => jsonResponse({ country: "ROU" }));
    const storage = createFakeStorage();

    const resolver = geoResolver({ fetchImpl, storage });

    assert.equal(await resolver.detect(), null);
    assert.equal(await resolver.detect(), null);
    assert.equal(fetchImpl.calls.length, 2);
    assert.equal(storage.dump()["dmr.geo"], undefined);
  });

  it("codul rezervat din cache este ignorat si se reia cererea", async () => {
    const fetchImpl = createFakeFetch(() => jsonResponse({ country: "DE" }));
    const storage = createFakeStorage({ "dmr.geo": "XX" });

    const resolver = geoResolver({ fetchImpl, storage });

    assert.equal(await resolver.detect(), "DE");
    assert.equal(fetchImpl.calls.length, 1);
  });

  it("clearCache() forteaza o noua detectare", async () => {
    const fetchImpl = createFakeFetch(() => jsonResponse({ country: "RO" }));
    const resolver = geoResolver({ fetchImpl, storage: createFakeStorage() });

    await resolver.detect();
    resolver.clearCache();
    await resolver.detect();

    assert.equal(fetchImpl.calls.length, 2);
  });

  it("fara storage: functioneaza, dar fara cache", async () => {
    const fetchImpl = createFakeFetch(() => jsonResponse({ country: "RO" }));
    const resolver = geoResolver({ fetchImpl, storage: null });

    assert.equal(await resolver.detect(), "RO");
    assert.equal(await resolver.detect(), "RO");
    assert.equal(fetchImpl.calls.length, 2);
  });

  it("storage indisponibil nu blocheaza detectarea", async () => {
    const fetchImpl = createFakeFetch(() => jsonResponse({ country: "RO" }));
    const resolver = geoResolver({ fetchImpl, storage: createFailingStorage() });

    assert.equal(await resolver.detect(), "RO");
    assert.equal(resolver.readCache(), null);
  });
});

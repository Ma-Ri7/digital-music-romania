// =====================================================
// Digital Music Romania — i18n
// geo.js — determinarea tarii dupa IP (GeoJS)
//
// Principii:
//  - COMUTATOR: `config.geoDetectionEnabled` (implicit false). Cat timp este
//    false, `detect()` nu face NICIUN apel de retea si nu citeste/scrie
//    cache-ul: returneaza imediat null. Codul ramane intact pentru o
//    reactivare ulterioara, prin simpla schimbare a configuratiei.
//  - un singur apel de retea per sesiune (rezultatul se cacheaza)
//  - timeout configurabil, fara blocarea randarii
//  - nu arunca niciodata: orice eroare => null => fallback EN
//  - fara cookie-uri, fara Referer, fara parametri suplimentari
//  - NU se citeste si NU se accepta niciun header de tara
//    furnizat de client ca dovada a locatiei reale
// =====================================================

import { createConfig, defaultConfig } from "./config.js";

// =====================================================
// VALIDARE COD DE TARA
// =====================================================

/**
 * Normalizeaza o valoare la forma de cod de tara (litere mari, fara spatii).
 * Returneaza null pentru orice altceva decat un string ne-gol.
 */
export function normalizeCountryCode(value) {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return code === "" ? null : code;
}

/**
 * Valideaza si normalizeaza un cod de tara.
 * Returneaza codul valid sau null (format gresit / cod rezervat / nedetectabil).
 */
export function parseCountryCode(value, config = defaultConfig) {
  const code = normalizeCountryCode(value);

  if (code === null) return null;

  if (!config.countryCodePattern.test(code)) return null;

  if (config.reservedCountryCodes.includes(code)) return null;

  return code;
}

/**
 * Varianta booleana a validarii.
 */
export function isValidCountryCode(value, config = defaultConfig) {
  return parseCountryCode(value, config) !== null;
}

// =====================================================
// CACHE LOCAL (fara cookie-uri)
// =====================================================

function createCache(storage, key, log) {
  function read() {
    if (!storage) return null;

    try {
      return storage.getItem(key);
    } catch (error) {
      log("geo: citirea cache-ului a esuat", error);
      return null;
    }
  }

  function write(code) {
    if (!storage) return;

    try {
      storage.setItem(key, code);
    } catch (error) {
      log("geo: scrierea in cache a esuat", error);
    }
  }

  function clear() {
    if (!storage) return;

    try {
      storage.removeItem(key);
    } catch (error) {
      log("geo: stergerea cache-ului a esuat", error);
    }
  }

  return { read, write, clear };
}

// =====================================================
// RESOLVER
// =====================================================

/**
 * Creeaza un resolver de tara.
 *
 * @param {object}   [options]
 * @param {object}   [options.config]          suprascrie configuratia implicita
 * @param {function} [options.fetchImpl]       implementarea fetch (injectabila pentru teste)
 * @param {object}   [options.storage]         sessionStorage-like (poate lipsi)
 * @param {function} [options.setTimeoutFn]    injectabil pentru teste
 * @param {function} [options.clearTimeoutFn]  injectabil pentru teste
 * @param {function} [options.log]             logger optional
 */
export function createCountryResolver(options = {}) {
  const config = options.config ? createConfig(options.config) : defaultConfig;

  // Poarta unica a modulului: cat timp este false, acest resolver nu atinge
  // nici reteaua, nici cache-ul de sesiune. Nicio alta cale din modul nu
  // poate produce un apel de retea.
  const detectionEnabled = config.geoDetectionEnabled === true;

  const fetchImpl =
    options.fetchImpl !== undefined
      ? options.fetchImpl
      : typeof globalThis.fetch === "function"
        ? globalThis.fetch.bind(globalThis)
        : null;

  const storage = options.storage || null;
  const log = typeof options.log === "function" ? options.log : () => {};

  const setTimer =
    typeof options.setTimeoutFn === "function"
      ? options.setTimeoutFn
      : (callback, delay) => setTimeout(callback, delay);

  const clearTimer =
    typeof options.clearTimeoutFn === "function"
      ? options.clearTimeoutFn
      : (timer) => clearTimeout(timer);

  const createAbortController =
    typeof options.createAbortControllerFn === "function"
      ? options.createAbortControllerFn
      : typeof AbortController === "function"
        ? () => new AbortController()
        : null;

  const cache = createCache(storage, config.storageKeys.country, log);

  /**
   * Un singur request, cu timeout. Nu arunca: returneaza cod valid sau null.
   */
  async function requestCountry() {
    if (typeof fetchImpl !== "function") {
      log("geo: fetch indisponibil");
      return null;
    }

    const controller = createAbortController ? createAbortController() : null;
    let timer = null;
    let timedOut = false;

    const timeout = new Promise((resolve) => {
      timer = setTimer(() => {
        timedOut = true;

        if (controller) {
          try {
            controller.abort();
          } catch (error) {
            log("geo: abort a esuat", error);
          }
        }

        resolve(null);
      }, config.geoTimeoutMs);
    });

    const request = (async () => {
      const response = await fetchImpl(config.geoEndpoint, {
        ...config.geoFetchOptions,
        ...(controller ? { signal: controller.signal } : {})
      });

      if (!response || response.ok !== true) {
        log("geo: raspuns HTTP invalid");
        return null;
      }

      let payload;

      try {
        payload = await response.json();
      } catch (error) {
        log("geo: raspuns JSON invalid", error);
        return null;
      }

      const country = parseCountryCode(
        payload && typeof payload === "object" ? payload.country : null,
        config
      );

      if (country === null) {
        log("geo: cod de tara invalid in raspuns");
      }

      return country;
    })().catch((error) => {
      log("geo: cererea a esuat", error);
      return null;
    });

    try {
      return await Promise.race([request, timeout]);
    } finally {
      if (timer !== null) clearTimer(timer);
      if (timedOut) log("geo: timeout depasit");
    }
  }

  /**
   * Returneaza codul de tara valid sau null. Nu arunca niciodata.
   * Un singur apel de retea per sesiune; rezultatul valid se cacheaza.
   */
  async function detect() {
    // Detectarea dezactivata: iesire imediata, fara fetch, fara cache.
    // Apelantul aplica fallback-ul (limba implicita).
    if (!detectionEnabled) {
      log("geo: detectarea tarii este dezactivata (geoDetectionEnabled = false)");
      return null;
    }

    const cached = parseCountryCode(cache.read(), config);

    if (cached !== null) {
      log(`geo: rezultat din cache (${cached})`);
      return cached;
    }

    const country = await requestCountry();

    if (country !== null) cache.write(country);

    return country;
  }

  return {
    detect,
    clearCache: cache.clear,
    // Cand detectarea este dezactivata nu se citeste cache-ul: in aceasta
    // configuratie nu exista si nu se foloseste nicio data de tara.
    readCache: () => (detectionEnabled ? parseCountryCode(cache.read(), config) : null),
    enabled: detectionEnabled,
    config
  };
}

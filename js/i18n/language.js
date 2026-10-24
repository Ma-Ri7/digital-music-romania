// =====================================================
// Digital Music Romania — i18n
// language.js — ordinea de prioritate a limbii
//
//   1. URL explicit (/ro/ sau /en/) stabileste limba paginii
//   2. preferinta salvata explicit de utilizator
//   3. tara detectata dupa IP (RO => ro, alta tara => en)
//   4. fallback: engleza
//
// Fara dependinte externe. Fara efecte secundare la import.
// =====================================================

import { createConfig, defaultConfig } from "./config.js";
import { parseCountryCode } from "./geo.js";

// =====================================================
// NORMALIZARE
// =====================================================

/**
 * Normalizeaza o limba ("ro-RO", "EN", "en_GB") la codul suportat.
 * Returneaza null daca limba nu este suportata.
 */
export function normalizeLanguage(value, config = defaultConfig) {
  if (typeof value !== "string") return null;

  const base = value.trim().toLowerCase().split(/[-_]/)[0];

  if (base === "") return null;

  return config.supportedLanguages.includes(base) ? base : null;
}

/**
 * Determina limba dintr-o cale URL.
 *   "/ro/"            => "ro"
 *   "/ro/registru/"   => "ro"
 *   "/en/"            => "en"
 *   "/"               => null (URL neprefixat => fara semnal explicit)
 *   "/registry.html"  => null
 *   "/i/"             => null
 *   "/de/"            => null (limba nesuportata)
 */
export function languageFromPath(pathname, config = defaultConfig) {
  if (typeof pathname !== "string") return null;

  const match = /^\/([A-Za-z]{2})(?=\/|$)/.exec(pathname);

  if (!match) return null;

  return normalizeLanguage(match[1], config);
}

/**
 * Traduce o tara validata in limba.
 * Returneaza null daca tara este nedetectabila sau invalida,
 * astfel incat apelantul sa aplice fallback-ul.
 */
export function countryToLanguage(country, config = defaultConfig) {
  const code = parseCountryCode(country, config);

  if (code === null) return null;

  return code === config.romaniaCountryCode ? "ro" : "en";
}

// =====================================================
// PERSISTENTA PREFERINTEI EXPLICITE
// =====================================================

/**
 * Persistenta preferintei explicite, tolerant la storage indisponibil.
 * @param {object} storage localStorage-like (poate lipsi)
 */
export function createLanguageStore(storage, config = defaultConfig) {
  function get() {
    if (!storage) return null;

    try {
      return normalizeLanguage(storage.getItem(config.storageKeys.language), config);
    } catch (error) {
      return null;
    }
  }

  function set(language) {
    const normalized = normalizeLanguage(language, config);

    if (normalized === null || !storage) return null;

    try {
      storage.setItem(config.storageKeys.language, normalized);
      return normalized;
    } catch (error) {
      return null;
    }
  }

  function clear() {
    if (!storage) return;

    try {
      storage.removeItem(config.storageKeys.language);
    } catch (error) {
      // storage indisponibil: nu este o eroare fatala
    }
  }

  return { get, set, clear };
}

// =====================================================
// REZOLVARE
// =====================================================

/**
 * Aplica ordinea de prioritate si returneaza limba + sursa deciziei.
 *
 * @param {object}   [context]
 * @param {string}   [context.pathname]   calea URL curenta (implicit "/")
 * @param {object}   [context.store]      rezultatul lui createLanguageStore()
 * @param {object}   [context.resolver]   rezultatul lui createCountryResolver()
 * @param {object}   [context.config]     configuratie suprascrisa
 * @returns {Promise<{language:string, source:string, country:(string|null)}>}
 *          source: "url" | "preference" | "country" | "default"
 */
export async function resolveLanguage(context = {}) {
  const config = context.config ? createConfig(context.config) : defaultConfig;

  const pathname = typeof context.pathname === "string" ? context.pathname : "/";

  // 1. URL explicit
  const fromUrl = languageFromPath(pathname, config);

  if (fromUrl !== null) {
    return { language: fromUrl, source: "url", country: null };
  }

  // 2. preferinta salvata explicit
  const saved = context.store ? context.store.get() : null;

  if (saved !== null) {
    return { language: saved, source: "preference", country: null };
  }

  // 3. tara detectata dupa IP
  if (context.resolver && typeof context.resolver.detect === "function") {
    let country = null;

    try {
      country = await context.resolver.detect();
    } catch (error) {
      country = null;
    }

    const language = countryToLanguage(country, config);

    if (language !== null) {
      return {
        language,
        source: "country",
        country: parseCountryCode(country, config)
      };
    }
  }

  // 4. fallback
  return { language: config.defaultLanguage, source: "default", country: null };
}

// =====================================================
// URL-URI ECHIVALENTE
// =====================================================

/**
 * Returneaza calea echivalenta pentru limba tinta.
 *   ("/", "ro")                     => "/ro/"
 *   ("/ro/", "en")                  => "/"
 *   ("/registry.html", "ro")        => "/ro/registru/"
 *   ("/ro/registru/", "en")         => "/registry.html"
 *   ("/altceva.html", "ro")         => "/ro/altceva.html"  (regula generica)
 */
export function equivalentPath(pathname, targetLanguage, config = defaultConfig) {
  const language = normalizeLanguage(targetLanguage, config);

  if (language === null || typeof pathname !== "string" || pathname === "") {
    return null;
  }

  const pair = config.pagePairs.find(
    (item) => item.en === pathname || item.ro === pathname
  );

  if (pair) return pair[language];

  if (language === "ro") {
    if (pathname === "/ro" || pathname.startsWith("/ro/")) return pathname;
    return pathname === "/" ? "/ro/" : "/ro" + pathname;
  }

  if (pathname === "/ro") return "/";

  if (pathname.startsWith("/ro/")) {
    const stripped = pathname.slice(3);
    return stripped === "" ? "/" : stripped;
  }

  return pathname;
}

// =====================================================
// LIMBA PAGINII CURENTE
// =====================================================

/**
 * Limba continutului static al paginii curente.
 *   "/ro/"            => "ro"
 *   "/"               => "en" (URL-urile engleze nu au prefix)
 *   "/registry.html"  => "en"
 *
 * Aceasta este limba care trebuie declarata in atributul <html lang>,
 * pentru ca ea descrie continutul real al documentului.
 */
export function resolvePageLanguage(pathname, config = defaultConfig) {
  const fromUrl = languageFromPath(pathname, config);

  return fromUrl !== null ? fromUrl : config.defaultLanguage;
}

// =====================================================
// PLAN DE NAVIGARE
// =====================================================

/**
 * Decide ce se intampla cand limba rezolvata difera de limba paginii.
 *
 * @param {object} context
 * @param {string} context.resolvedLanguage limba ceruta de vizitator
 * @param {string} context.pageLanguage     limba continutului paginii curente
 * @param {string} context.currentPath      calea paginii curente
 * @param {string} [context.equivalentPath] calea paginii echivalente
 * @param {number} [context.elapsedMs]      cat a durat rezolvarea limbii
 * @param {string} [context.policy]         "navigate" | "suggest" | "off"
 * @param {number} [context.deadlineMs]     fereastra maxima pentru navigare
 * @returns {{action:string, target:(string|null)}}
 *          action: "none" | "navigate" | "suggest"
 */
export function planLanguageNavigation(context = {}) {
  const policy = context.policy || defaultConfig.navigationPolicy;
  const target = typeof context.equivalentPath === "string" ? context.equivalentPath : null;

  if (policy === "off" || target === null || target === context.currentPath) {
    return { action: "none", target: null };
  }

  if (context.resolvedLanguage === context.pageLanguage) {
    return { action: "none", target: null };
  }

  // Politica "suggest": nu se navigheaza niciodata automat.
  if (policy === "suggest") {
    return { action: "suggest", target };
  }

  const deadline =
    typeof context.deadlineMs === "number" ? context.deadlineMs : Infinity;

  const elapsed = typeof context.elapsedMs === "number" ? context.elapsedMs : 0;

  // O limba detectata prea tarziu nu mai schimba pagina (fara "flash" de limba).
  if (elapsed > deadline) {
    return { action: "suggest", target };
  }

  return { action: "navigate", target };
}

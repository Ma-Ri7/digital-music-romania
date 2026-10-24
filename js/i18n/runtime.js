// =====================================================
// Digital Music Romania — i18n
// runtime.js — translatorul UNIC al paginii (sincron)
//
// Sursa unica de adevar pentru limba continutului paginii:
//   "/"        => engleza
//   "/ro/..."  => romana
//
// Limba se deriva SINCRON din calea URL, deci modulele care
// randeaza continut dinamic pot folosi t() imediat, fara await.
//
// Preferinta salvata NU influenteaza acest runtime: ea decide
// NAVIGAREA (page.js), nu limba continutului static al paginii.
// Astfel nu se injecteaza niciodata traduceri intr-o pagina al
// carui continut static este in alta limba.
//
// Fara efecte secundare la import: translatorul se creeaza la
// prima utilizare.
// =====================================================

import { createConfig, defaultConfig } from "./config.js";
import { resolvePageLanguage } from "./language.js";
import { createI18n } from "./i18n.js";
import { locale as enLocale, messages as enMessages } from "./locales/en.js";
import { locale as roLocale, messages as roMessages } from "./locales/ro.js";

export const LOCALES = Object.freeze({ en: enLocale, ro: roLocale });
export const DICTIONARIES = Object.freeze({ en: enMessages, ro: roMessages });
export const INTL_LOCALES = Object.freeze({
  en: enLocale.intlLocale,
  ro: roLocale.intlLocale
});

/**
 * Calea URL curenta (injectabila in teste prin `options.pathname`).
 */
export function currentPathname() {
  const location = typeof globalThis === "undefined" ? undefined : globalThis.location;

  return location && typeof location.pathname === "string" ? location.pathname : "/";
}

/**
 * Creeaza un translator pentru limba continutului static al unei cai.
 * Exportat pentru testare; in pagini se foloseste instanta unica de mai jos.
 */
export function createPageTranslator(options = {}) {
  const config = options.config ? createConfig(options.config) : defaultConfig;

  const pathname =
    typeof options.pathname === "string" ? options.pathname : currentPathname();

  return createI18n({
    config,
    language: resolvePageLanguage(pathname, config),
    fallbackLanguage: config.defaultLanguage,
    dictionaries: DICTIONARIES,
    intlLocales: INTL_LOCALES,
    onMissing: options.onMissing
  });
}

let translator = null;

/**
 * Instanta unica folosita de toate modulele paginii.
 * Se creeaza la prima apelare, cu limba continutului static.
 */
export function getPageTranslator(options = {}) {
  if (translator === null) {
    translator = createPageTranslator(options);
  }

  return translator;
}

/**
 * Inlocuieste instanta (folosit in teste).
 */
export function setPageTranslator(instance) {
  translator = instance || null;
  return translator;
}

/**
 * Arunca instanta curenta (folosit in teste).
 */
export function resetPageTranslator() {
  translator = null;
}

// =====================================================
// LEGATURI PENTRU MODULELE CARE RANDEAZA CONTINUT DINAMIC
// =====================================================

export function t(key, variables) {
  return getPageTranslator().t(key, variables);
}

export function has(key) {
  return getPageTranslator().has(key);
}

export function formatNumber(value, options) {
  return getPageTranslator().formatNumber(value, options);
}

export function getLanguage() {
  return getPageTranslator().getLanguage();
}

export function getLocale() {
  return getPageTranslator().getLocale();
}

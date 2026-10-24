// =====================================================
// Digital Music Romania — i18n
// i18n.js — runtime de traduceri
//
// Fara dependinte externe. Fara efecte secundare la import.
// Fara acces la document la nivel de modul: applyTranslations()
// primeste orice radacina cu querySelectorAll (testabil fara DOM).
//
// Cheile sunt plate si pot contine puncte, ex: "language.switcher.ro".
// =====================================================

import { createConfig, defaultConfig } from "./config.js";
import { normalizeLanguage } from "./language.js";

/**
 * Caută o cheie intr-un dictionar plat. Returneaza undefined daca lipseste.
 */
export function lookup(messages, key) {
  if (!messages || typeof key !== "string") return undefined;

  return Object.prototype.hasOwnProperty.call(messages, key)
    ? messages[key]
    : undefined;
}

/**
 * Inlocuieste {nume} cu valorile furnizate.
 * Placeholder-ele fara valoare raman vizibile, pentru a nu ascunde erori.
 */
export function interpolate(template, variables) {
  if (typeof template !== "string") return "";

  if (!variables || typeof variables !== "object") return template;

  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(variables, name)
      ? String(variables[name])
      : match
  );
}

/**
 * Legaturile suportate pentru traducerea automata a DOM-ului.
 * Atributul este derivat din selector: [data-i18n] -> "data-i18n".
 */
export const TRANSLATION_BINDINGS = Object.freeze([
  Object.freeze({ selector: "[data-i18n]", target: "textContent" }),
  Object.freeze({ selector: "[data-i18n-placeholder]", target: "placeholder" }),
  Object.freeze({ selector: "[data-i18n-title]", target: "title" }),
  Object.freeze({ selector: "[data-i18n-aria-label]", target: "aria-label" }),
  Object.freeze({ selector: "[data-i18n-value]", target: "value" })
]);

/**
 * Creeaza translatorul.
 *
 * @param {object} [options]
 * @param {string} [options.language]          limba activa
 * @param {object} [options.dictionaries]      { ro: {...}, en: {...} }
 * @param {object} [options.intlLocales]       { ro: "ro-RO", en: "en-US" }
 * @param {object} [options.config]            configuratie suprascrisa
 * @param {function} [options.onMissing]       apelat pentru chei lipsa
 */
export function createI18n(options = {}) {
  const config = options.config ? createConfig(options.config) : defaultConfig;

  const dictionaries = options.dictionaries || {};
  const intlLocales = options.intlLocales || {};
  const onMissing = typeof options.onMissing === "function" ? options.onMissing : null;

  const fallbackLanguage =
    normalizeLanguage(options.fallbackLanguage, config) || config.defaultLanguage;

  let language = normalizeLanguage(options.language, config) || config.defaultLanguage;

  /**
   * Exista cheia in dictionarul limbii date?
   */
  function has(key, lang = language) {
    return lookup(dictionaries[lang], key) !== undefined;
  }

  /**
   * Traduce o cheie. Daca lipseste, cade pe limba implicita,
   * apoi returneaza cheia insasi (nu un text gol).
   */
  function t(key, variables) {
    let template = lookup(dictionaries[language], key);

    if (template === undefined) {
      template = lookup(dictionaries[fallbackLanguage], key);
    }

    if (template === undefined) {
      if (onMissing) onMissing(key, language);
      return typeof key === "string" ? key : "";
    }

    return interpolate(template, variables);
  }

  /**
   * Formateaza un numar conform limbii active.
   * Valorile care nu pot fi convertite la un numar finit sunt
   * returnate ca text, fara a afisa "NaN".
   */
  function formatNumber(value, intlOptions) {
    const locale = intlLocales[language] || language;

    if (value === null || value === undefined || value === "") return "";

    const numeric = typeof value === "number" ? value : Number(value);

    if (!Number.isFinite(numeric)) return String(value);

    try {
      return new Intl.NumberFormat(locale, intlOptions).format(numeric);
    } catch (error) {
      return String(value);
    }
  }

  /**
   * Schimba limba activa. Returneaza limba aplicata sau null.
   */
  function setLanguage(next) {
    const normalized = normalizeLanguage(next, config);

    if (normalized === null) return null;

    language = normalized;

    return language;
  }

  function getLanguage() {
    return language;
  }

  function getLocale() {
    return intlLocales[language] || language;
  }

  function applyTranslations(root) {
    if (!root || typeof root.querySelectorAll !== "function") return 0;

    let applied = 0;

    TRANSLATION_BINDINGS.forEach((binding) => {
      const attribute = binding.selector.slice(1, -1);
      const nodes = root.querySelectorAll(binding.selector);

      if (!nodes || typeof nodes.forEach !== "function") return;

      nodes.forEach((node) => {
        if (!node || typeof node.getAttribute !== "function") return;

        const key = node.getAttribute(attribute);

        if (!key || !has(key)) return;

        const text = t(key);

        if (binding.target === "textContent") {
          node.textContent = text;
        } else if (typeof node.setAttribute === "function") {
          node.setAttribute(binding.target, text);
        }

        applied += 1;
      });
    });

    return applied;
  }

  return {
    t,
    has,
    formatNumber,
    setLanguage,
    getLanguage,
    getLocale,
    applyTranslations,
    config,
    dictionaries
  };
}

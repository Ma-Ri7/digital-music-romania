// =====================================================
// Digital Music Romania — i18n
// lang-switcher.js — selectorul manual RO | EN
//
// Accesibilitate:
//  - containerul are role="navigation" + aria-label tradus
//  - fiecare optiune este un link real (functioneaza si fara JS)
//  - limba activa este marcata cu aria-current="true"
//  - fiecare link are lang/hreflang si aria-label cu numele complet
//  - propunerea de limba este anuntata si poate fi inchisa
//
// Fara dependinte externe. Fara innerHTML.
// =====================================================

import { locale as enLocale } from "./locales/en.js";
import { locale as roLocale } from "./locales/ro.js";

const LOCALES = { en: enLocale, ro: roLocale };

const DEFAULT_SELECTOR = "[data-lang-switcher]";

function resolveGlobal(name) {
  return typeof globalThis === "undefined" ? undefined : globalThis[name];
}

/**
 * Aplica starea selectorului: href-uri corecte, aria-current, etichete.
 * Exportat pentru testare.
 */
export function applySwitcherState(container, service, activeLanguage, options = {}) {
  if (!container || typeof container.querySelector !== "function") return new Map();

  const config = service.config;
  const links = new Map();

  const label = service.t("language.switcher.label");

  if (label && typeof container.setAttribute === "function") {
    container.setAttribute("aria-label", label);
  }

  config.supportedLanguages.forEach((language) => {
    const link = container.querySelector(`[data-lang-option="${language}"]`);

    if (!link) return;

    const target = service.getEquivalentPath(language);

    if (target && typeof link.setAttribute === "function") {
      link.setAttribute("href", target);
      link.setAttribute("hreflang", language);
      link.setAttribute("lang", (LOCALES[language] || {}).htmlLang || language);
    }

    const name = service.t(`language.switcher.name.${language}`);

    if (typeof link.setAttribute === "function" && name) {
      link.setAttribute(
        "aria-label",
        service.t("language.switcher.switchTo", { language: name })
      );
    }

    if (typeof link.removeAttribute === "function") {
      if (language === activeLanguage) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    }

    // Alegerea manuala se salveaza inainte de navigarea implicita a linkului.
    if (typeof link.addEventListener === "function") {
      link.addEventListener("click", () => {
        service.setLanguage(language);
      });
    }

    links.set(language, link);
  });

  return links;
}

/**
 * Creeaza elementul de propunere de limba. Exportat pentru testare.
 */
export function createSuggestionBanner(documentRef, service, target, options = {}) {
  if (!documentRef || typeof documentRef.createElement !== "function" || !target) {
    return null;
  }

  const element = documentRef.createElement("div");

  element.className = "lang-suggestion";
  element.setAttribute("role", "region");
  element.setAttribute("aria-label", service.t("language.suggestion.title"));

  // Anuntat de cititoarele de ecran fara a muta focusul si fara a
  // impiedica inchiderea propunerii.
  element.setAttribute("aria-live", "polite");
  element.setAttribute("aria-atomic", "true");

  const text = documentRef.createElement("p");

  text.className = "lang-suggestion-text";
  text.textContent = service.t("language.suggestion.title");

  const action = documentRef.createElement("a");

  action.className = "lang-suggestion-action";
  action.setAttribute("href", target);
  action.setAttribute("hreflang", options.language || "");
  action.textContent = service.t("language.suggestion.action");

  const dismiss = documentRef.createElement("button");

  dismiss.className = "lang-suggestion-dismiss";
  dismiss.setAttribute("type", "button");
  dismiss.textContent = service.t("language.suggestion.dismiss");

  element.appendChild(text);
  element.appendChild(action);
  element.appendChild(dismiss);

  return { element, action, dismiss, text };
}

/**
 * Persistenta preferintei la click pe selector.
 *
 * Se inregistreaza INAINTE de rezolvarea limbii, ca alegerea
 * utilizatorului sa fie salvata si in fereastra in care cererea
 * geo este inca in curs (cand handlerele per-link nu exista inca).
 * Delegarea pe document acopera toate optiunile.
 */
export function watchSwitcherClicks(service, documentRef, selector = DEFAULT_SELECTOR) {
  if (!documentRef || typeof documentRef.addEventListener !== "function") {
    return false;
  }

  documentRef.addEventListener(
    "click",
    (event) => {
      const node = event && event.target;

      if (!node || typeof node.closest !== "function") return;

      const link = node.closest("[data-lang-option]");

      if (!link) return;

      const language = link.getAttribute("data-lang-option");

      if (language) service.setLanguage(language);
    },
    true
  );

  return true;
}

/**
 * Initializeaza selectorul si propunerea de limba.
 *
 * @param {object} service rezultatul lui createLanguageService()
 * @param {object} result  rezultatul lui service.init()
 * @param {object} [options]
 * @returns {{links:Map, banner:object|null, showSuggestion:Function, hideSuggestion:Function}}
 */
export function initLanguageSwitcher(service, result, options = {}) {
  const documentRef =
    options.document !== undefined ? options.document : resolveGlobal("document");

  const sessionStorageRef =
    options.sessionStorage !== undefined
      ? options.sessionStorage
      : resolveGlobal("sessionStorage");

  const config = service.config;
  const bannerKey = config.storageKeys.banner;

  let banner = null;

  function isDismissed() {
    if (!sessionStorageRef) return false;

    try {
      return sessionStorageRef.getItem(bannerKey) === "hidden";
    } catch (error) {
      return false;
    }
  }

  function rememberDismissed() {
    if (!sessionStorageRef) return;

    try {
      sessionStorageRef.setItem(bannerKey, "hidden");
    } catch (error) {
      // storage indisponibil: propunerea va reaparea, fara eroare
    }
  }

  function hideSuggestion() {
    if (!banner) return;

    const element = banner.element;

    if (element && element.parentNode && typeof element.parentNode.removeChild === "function") {
      element.parentNode.removeChild(element);
    } else if (element && typeof element.remove === "function") {
      element.remove();
    }

    banner = null;
  }

  function showSuggestion(target) {
    if (!target || banner || isDismissed()) return banner;
    if (!documentRef || !documentRef.body) return null;

    const created = createSuggestionBanner(documentRef, service, target, {
      language: result.language
    });

    if (!created) return null;

    created.dismiss.addEventListener("click", () => {
      rememberDismissed();
      hideSuggestion();
    });

    documentRef.body.appendChild(created.element);

    banner = created;

    return banner;
  }

  const links = documentRef
    ? applySwitcherState(
        documentRef.querySelector(options.selector || DEFAULT_SELECTOR),
        service,
        result.pageLanguage,
        options
      )
    : new Map();

  // Pagina poate marca explicit elementul pentru propunere.
  return {
    links,
    get banner() {
      return banner;
    },
    showSuggestion,
    hideSuggestion
  };
}

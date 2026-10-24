// =====================================================
// Digital Music Romania — i18n
// index.js — fatada publica (fara efecte secundare la import)
//
// Nu executa nimic automat: pagina apeleaza explicit
// initLanguage() / createLanguageService().
// Toate dependintele de browser (document, localStorage,
// sessionStorage, location, fetch) sunt injectabile,
// astfel incat nucleul sa fie testabil fara DOM si fara retea.
// =====================================================

import { createConfig, defaultConfig } from "./config.js";
import { createCountryResolver } from "./geo.js";
import {
  createLanguageStore,
  equivalentPath,
  planLanguageNavigation,
  resolveLanguage,
  resolvePageLanguage
} from "./language.js";
import {
  DICTIONARIES,
  INTL_LOCALES,
  LOCALES,
  getPageTranslator
} from "./runtime.js";

export { DICTIONARIES, INTL_LOCALES, LOCALES };

function getGlobal(name) {
  return typeof globalThis === "undefined" ? undefined : globalThis[name];
}

/**
 * Returneaza storage-ul global doar daca este utilizabil
 * (mod privat / storage dezactivat => null, fara a arunca).
 */
function safeStorage(globalName) {
  const storage = getGlobal(globalName);

  if (!storage) return null;

  try {
    const probe = "__dmr_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch (error) {
    return null;
  }
}

/**
 * Creeaza serviciul de limba.
 *
 * @param {object}  [options]
 * @param {object}  [options.config]          configuratie suprascrisa
 * @param {object}  [options.storage]         localStorage-like (null => fara persistenta)
 * @param {object}  [options.sessionStorage]  sessionStorage-like (null => fara cache geo)
 * @param {function}[options.fetchImpl]       injectabil; null => niciun apel de retea
 * @param {string}  [options.pathname]        calea URL (implicit location.pathname)
 * @param {object}  [options.document]        document injectabil
 * @param {object}  [options.resolver]        resolver injectat (null => fara detectie)
 * @param {boolean} [options.applyDom]        false => nu atinge DOM-ul
 */
export function createLanguageService(options = {}) {
  const config = options.config ? createConfig(options.config) : defaultConfig;

  const storage =
    options.storage !== undefined ? options.storage : safeStorage("localStorage");

  const sessionStorageRef =
    options.sessionStorage !== undefined
      ? options.sessionStorage
      : safeStorage("sessionStorage");

  const documentRef =
    options.document !== undefined ? options.document : getGlobal("document");

  const store = options.store || createLanguageStore(storage, config);

  const now = typeof options.now === "function" ? options.now : () => Date.now();

  // Detectarea tarii dupa IP se activeaza EXCLUSIV prin
  // `config.geoDetectionEnabled === true`. Cat timp este false (implicit),
  // resolverul nu este nici macar construit: `service.resolver` este null,
  // deci nicio cale din pagina nu poate produce un apel catre GeoJS.
  const resolver =
    options.resolver !== undefined
      ? options.resolver
      : config.geoDetectionEnabled === true
        ? createCountryResolver({
            config,
            storage: sessionStorageRef,
            fetchImpl: options.fetchImpl,
            log: options.log
          })
        : null;

  function currentPathname() {
    if (typeof options.pathname === "string") return options.pathname;

    const location = getGlobal("location");

    return location && typeof location.pathname === "string"
      ? location.pathname
      : "/";
  }

  // Sursa unica pentru limba paginii: translatorul din runtime.js.
  // Limba continutului static se aplica SINCRON, inainte ca modulele
  // care randeaza continut dinamic sa apeleze t().
  const translator =
    options.translator ||
    getPageTranslator({ pathname: currentPathname(), onMissing: options.onMissing });

  translator.setLanguage(resolvePageLanguage(currentPathname(), config));

  /**
   * Aplica limba pe elementul <html> (lang + dir).
   */
  function applyDocumentLanguage(language) {
    const locale = LOCALES[language];

    if (!locale || !documentRef || !documentRef.documentElement) return null;

    documentRef.documentElement.lang = locale.htmlLang;
    documentRef.documentElement.dir = locale.dir;

    return locale;
  }

  /**
   * Rezolva limba, o aplica si traduce elementele marcate din pagina.
   * Nu arunca niciodata: la eroare neasteptata revine la limba implicita.
   *
   * @returns {Promise<{language:string, source:string, country:(string|null),
   *   pageLanguage:string, currentPath:string, equivalent:(string|null),
   *   elapsedMs:number, navigation:{action:string, target:(string|null)}}>}
   */
  async function init() {
    const startedAt = now();
    const pathname = currentPathname();

    let result;

    try {
      result = await resolveLanguage({
        config,
        pathname,
        store,
        resolver
      });
    } catch (error) {
      if (typeof options.onError === "function") options.onError(error);
      result = { language: config.defaultLanguage, source: "default", country: null };
    }

    // O alegere explicita facuta in timpul rezolvarii (de exemplu cat o cerere
    // geo era inca in curs) prevaleaza asupra oricarui rezultat intarziat.
    const latePreference = store.get();

    if (
      latePreference !== null &&
      result.source !== "url" &&
      result.language !== latePreference
    ) {
      result = {
        language: latePreference,
        source: "preference",
        country: result.country
      };
    }

    const pageLanguage = resolvePageLanguage(pathname, config);
    const elapsedMs = now() - startedAt;
    const equivalent = equivalentPath(pathname, result.language, config);

    const navigation = planLanguageNavigation({
      resolvedLanguage: result.language,
      pageLanguage,
      currentPath: pathname,
      equivalentPath: equivalent,
      elapsedMs,
      policy: config.navigationPolicy,
      deadlineMs: config.navigateDeadlineMs
    });

    // Documentul curent are continut static in limba paginii, deci aceea este
    // limba declarata in <html lang>. Limba ceruta de vizitator produce, daca
    // este cazul, navigarea catre pagina echivalenta.
    translator.setLanguage(pageLanguage);
    applyDocumentLanguage(pageLanguage);

    if (options.applyDom !== false && documentRef) {
      try {
        translator.applyTranslations(documentRef);
      } catch (error) {
        if (typeof options.onError === "function") options.onError(error);
      }
    }

    return {
      language: result.language,
      source: result.source,
      country: result.country,
      pageLanguage,
      currentPath: pathname,
      equivalent,
      elapsedMs,
      navigation
    };
  }

  /**
   * Salveaza preferinta explicita. Nu navigheaza.
   * Returneaza limba salvata sau null.
   */
  function setLanguage(language) {
    const saved = store.set(language);

    if (saved !== null) translator.setLanguage(saved);

    return saved;
  }

  /**
   * Calea echivalenta pentru limba tinta (folosita de selectorul RO | EN).
   */
  function getEquivalentPath(language) {
    return equivalentPath(currentPathname(), language, config);
  }

  return {
    init,
    setLanguage,
    getLanguage: translator.getLanguage,
    getLocale: translator.getLocale,
    getEquivalentPath,
    applyDocumentLanguage,
    t: translator.t,
    has: translator.has,
    formatNumber: translator.formatNumber,
    applyTranslations: translator.applyTranslations,
    store,
    resolver,
    translator,
    config
  };
}

/**
 * Scurtatura pentru pagini: rezolva limba si o aplica.
 */
export function initLanguage(options = {}) {
  return createLanguageService(options).init();
}

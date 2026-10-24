// =====================================================
// Digital Music Romania — i18n
// config.js — configurare centralizata
//
// Fara dependinte externe. Fara efecte secundare la import.
// =====================================================

/**
 * Limba folosita cand tara nu poate fi determinata,
 * cand serviciul de geolocalizare raspunde invalid sau cand
 * vizitatorul nu este din Romania.
 */
export const DEFAULT_LANGUAGE = "en";

/**
 * Limbile suportate de site.
 */
export const SUPPORTED_LANGUAGES = Object.freeze(["ro", "en"]);

/**
 * Tara pentru care limba implicita este romana (ISO 3166-1 alpha-2).
 */
export const ROMANIA_COUNTRY_CODE = "RO";

/**
 * Endpoint de geolocalizare (GeoJS).
 *
 * Raspuns: {"country":"RO","country_3":"ROU","ip":"1.2.3.4","name":"Romania"}
 * Documentatie: https://www.geojs.io/docs/v1/endpoints/country/
 *
 * NU se trimit parametri de query si NU se trimite IP-ul ca parametru:
 * endpoint-ul foloseste IP-ul sursa al cererii. Se schimba usor
 * (ex. un endpoint first-party in spatele Cloudflare) fara alte modificari.
 */
export const GEO_ENDPOINT = "https://get.geojs.io/v1/ip/country.json";

/**
 * Timeout configurabil pentru apelul de geolocalizare, in milisecunde.
 *
 * NU blocheaza randarea: pagina se afiseaza imediat in limba implicita,
 * iar rezultatul geolocalizarii se aplica doar daca soseste la timp.
 */
export const GEO_TIMEOUT_MS = 2000;

/**
 * Detectarea tarii dupa IP (GeoJS) — comutator principal.
 *
 * `false` (valoarea implicita): pagina NU contacteaza niciun serviciu de
 * geolocalizare. Limba se stabileste exclusiv din:
 *   1. URL-ul explicit (`/ro/...` => romana),
 *   2. preferinta salvata a utilizatorului (`dmr.lang`),
 *   3. limba implicita (`DEFAULT_LANGUAGE` => engleza).
 * Niciun `fetch` si nicio scriere in `dmr.geo` nu au loc.
 *
 * `true`: se activeaza detectarea prin `GEO_ENDPOINT`, adica exact
 * comportamentul din etapele anterioare. Reactivarea este o schimbare de
 * configurare, nu de cod.
 *
 * De ce implicit OFF: orice cerere catre un serviciu de geolocalizare
 * transfera adresa IP a vizitatorului catre un terț. Transferul trebuie
 * insotit de o informare de confidentialitate publicata si de o verificare
 * juridica prealabila. Vezi docs/i18n/GEO-SI-CONFIDENTIALITATE.md.
 */
export const GEO_DETECTION_ENABLED = false;

/**
 * Optiuni de fetch: fara cookie-uri, fara Referer, fara cache.
 *
 * ATENTIE: `referrerPolicy` controleaza DOAR header-ul `Referer`. Header-ele
 * implicite ale browserului (`User-Agent`, `Accept-Language`, `Accept`,
 * `Accept-Encoding`) sunt trimise in continuare si nu pot fi eliminate
 * din JavaScript.
 */
export const GEO_FETCH_OPTIONS = Object.freeze({
  method: "GET",
  mode: "cors",
  credentials: "omit",
  referrerPolicy: "no-referrer",
  cache: "no-store"
});

/**
 * Chei de stocare locala.
 *  - language: preferinta explicita a utilizatorului (localStorage, persistent)
 *  - country : tara detectata (sessionStorage, doar pentru sesiunea curenta)
 */
export const STORAGE_KEYS = Object.freeze({
  language: "dmr.lang",
  country: "dmr.geo",
  banner: "dmr.banner"
});

/**
 * Cod de tara valid: exact doua litere mari.
 */
export const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

/**
 * Coduri care nu reprezinta o tara reala si sunt tratate ca nedetectabile.
 *  - XX: necunoscut (Cloudflare / GeoJS)
 *  - T1: reteaua Tor
 *  - A1 / A2 / O1: intervale anonime (Cloudflare)
 */
export const RESERVED_COUNTRY_CODES = Object.freeze(["XX", "T1", "A1", "A2", "O1"]);

/**
 * Perechi de pagini echivalente, folosite de selectorul RO | EN.
 */
export const PAGE_PAIRS = Object.freeze([
  Object.freeze({ key: "home", en: "/", ro: "/ro/" }),
  Object.freeze({ key: "home-index", en: "/index.html", ro: "/ro/" }),
  Object.freeze({ key: "registry", en: "/registry.html", ro: "/ro/registru/" })
]);

/**
 * Prefixul de cale asociat fiecarei limbi.
 * Engleza ramane la URL-urile actuale (fara prefix).
 */
export const LANGUAGE_PREFIX = Object.freeze({
  en: "/",
  ro: "/ro/"
});

/**
 * Politici de navigare catre pagina echivalenta.
 */
export const NAVIGATION_POLICIES = Object.freeze(["navigate", "suggest", "off"]);

/**
 * Comportamentul implicit cand limba rezolvata difera de limba paginii curente:
 *  - "navigate": se navigheaza la pagina echivalenta, dar numai daca rezultatul
 *    soseste in fereastra `navigateDeadlineMs`
 *  - "suggest" : nu se navigheaza automat; se afiseaza o propunere
 *  - "off"     : nicio actiune automata
 */
export const NAVIGATION_POLICY = "navigate";

/**
 * Fereastra maxima (ms) in care acceptam o navigare automata.
 * Dupa acest prag, o limba detectata tarziu nu mai produce o schimbare de pagina
 * (se afiseaza, cel mult, o propunere), pentru a evita un "flash" de limba.
 */
export const NAVIGATE_DEADLINE_MS = 2000;

/**
 * Creeaza o configuratie noua, fara a modifica valorile implicite.
 */
export function createConfig(overrides = {}) {
  return {
    defaultLanguage: DEFAULT_LANGUAGE,
    supportedLanguages: [...SUPPORTED_LANGUAGES],
    romaniaCountryCode: ROMANIA_COUNTRY_CODE,
    geoEndpoint: GEO_ENDPOINT,
    geoTimeoutMs: GEO_TIMEOUT_MS,
    geoDetectionEnabled: GEO_DETECTION_ENABLED,
    geoFetchOptions: { ...GEO_FETCH_OPTIONS },
    storageKeys: { ...STORAGE_KEYS },
    countryCodePattern: COUNTRY_CODE_PATTERN,
    reservedCountryCodes: [...RESERVED_COUNTRY_CODES],
    pagePairs: PAGE_PAIRS.map((pair) => ({ ...pair })),
    languagePrefix: { ...LANGUAGE_PREFIX },
    navigationPolicy: NAVIGATION_POLICY,
    navigateDeadlineMs: NAVIGATE_DEADLINE_MS,
    ...overrides
  };
}

/**
 * Configuratia implicita, folosita cand nu se injecteaza alta.
 */
export const defaultConfig = createConfig();

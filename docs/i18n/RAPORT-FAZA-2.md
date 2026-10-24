# Raport etapă 2 — nucleul i18n + mecanismul geo

**Branch:** `feat/i18n-ro-en` (creat din `main` @ `b017d44`)
**Data:** 24.10.2026
**Status:** ✅ implementat și testat · ⏸️ **fără commit, fără push, fără deployment**

---

## 1. Scopul etapei (limitat conform cerinței)

- ✅ Etapa 0: branch nou + verificare de integritate.
- ✅ Nucleul i18n și mecanismul de detectare a țării, **izolate în module noi**.
- ✅ Teste fără dependențe externe, fără apelarea serviciului geo real.
- ❌ **Nu** s-au modificat paginile HTML existente.
- ❌ **Nu** s-au modificat modulele JS existente.
- ❌ **Nu** s-au tradus paginile (etapa următoare, după verificarea acestui raport).

---

## 2. Fișiere create

### Module (site)

| Fișier | Rol |
|---|---|
| `js/i18n/config.js` | configurare centralizată: limbi suportate, limba implicită, țara `RO`, endpoint geo, **timeout configurabil (`GEO_TIMEOUT_MS = 2000`)**, opțiuni fetch, chei de stocare, pattern + coduri rezervate, perechi de pagini echivalente, `createConfig()` |
| `js/i18n/geo.js` | validarea codului de țară (`normalizeCountryCode`, `parseCountryCode`, `isValidCountryCode`) și resolverul (`createCountryResolver`) cu timeout, `AbortController`, cache de sesiune, fără retry |
| `js/i18n/language.js` | `normalizeLanguage`, `languageFromPath`, `countryToLanguage`, `createLanguageStore`, `resolveLanguage` (ordinea de prioritate), `equivalentPath` |
| `js/i18n/i18n.js` | runtime de traduceri: `lookup`, `interpolate`, `createI18n` → `t`, `has`, `formatNumber`, `setLanguage`, `applyTranslations` (suportă `data-i18n`, `data-i18n-placeholder`, `-title`, `-aria-label`, `-value`) |
| `js/i18n/locales/en.js` | metadate EN + dicționar EN (doar cheile nucleului) |
| `js/i18n/locales/ro.js` | metadate RO + dicționar RO (aceleași chei) |
| `js/i18n/index.js` | fațada publică: `createLanguageService()`, `initLanguage()`, `LOCALES`, `DICTIONARIES`, `INTL_LOCALES`. Fără efecte secundare la import |

### Teste (fără dependențe externe, `node:test` + `node:assert`)

| Fișier | Acoperire |
|---|---|
| `tests/helpers/fakes.mjs` | storage fals / storage defect, răspunsuri HTTP false, fetch fals / fetch care nu răspunde, elemente și rădăcini DOM false |
| `tests/geo-validation.test.mjs` | validarea codului de țară (normalizare, format, coduri rezervate, configurabilitate) |
| `tests/geo-resolver.test.mjs` | RO / altă țară / răspunsuri invalide / HTTP 500, 429, 404 / JSON invalid / offline / erori sincrone / timeout / opțiunile cererii / cache de sesiune / storage indisponibil |
| `tests/language.test.mjs` | normalizare, cale URL, `countryToLanguage`, store, **ordinea de prioritate**, `equivalentPath` (inclusiv test anti-buclă) |
| `tests/i18n.test.mjs` | `t`, `has`, `setLanguage`, interpolare, chei lipsă, `formatNumber`, `applyTranslations` pe DOM fals |
| `tests/locales.test.mjs` | **paritate RO/EN** (set identic de chei), fără traduceri goale, fără marcaj HTML, convenția cheilor, metadate de limbă |
| `tests/service.test.mjs` | integrarea fațadei: `init()`, aplicarea pe `<html lang>`, preferință, `getEquivalentPath`, `formatNumber`, `initLanguage()` |
| `tests/no-side-effects.test.mjs` | importul nu face apeluri de rețea și nu creează/modifică globals; `navigator.language` nu e folosit nicăieri în sursă; configul nu partajează referințe |

### Instrumentare și documentație

| Fișier | Rol |
|---|---|
| `package.json` | **nou**, doar `{"type":"module"}` + script `test`. Zero dependențe, fără build |
| `tools/geo-check.mjs` | verificare **manuală** a integrării reale cu GeoJS (nu rulează în `npm test`) |
| `docs/i18n/GEO-SI-CONFIDENTIALITATE.md` | limitările GeoJS, datele transmise, stocarea locală, măsurători reale, checklist de confidențialitate înainte de publicare |

## 3. Fișiere modificate

**Niciunul.** Verificat cu `git status --porcelain`: doar intrări `??` (fișiere noi).
`git diff --stat main` este **gol** → nicio linie din codul existent nu a fost atinsă.
`CNAME`, `robots.txt`, `sitemap.xml`, `data.json`, toate paginile HTML și toate modulele
JS existente sunt neatinse.

---

## 4. Ordinea de prioritate implementată

```
1. URL explicit        /ro/... => ro ; /en/... => en      (source: "url")
2. preferință salvată  localStorage["dmr.lang"]           (source: "preference")
3. țara detectată      RO => ro ; altă țară validă => en  (source: "country")
4. fallback            engleză                            (source: "default")
```

Reguli aplicate:

- Detectarea țării **nu se apelează** dacă există URL explicit sau preferință salvată
  (testat: `resolver.calls === 0`).
- `navigator.language` **nu** este folosit ca semnal (testat prin scanarea sursei).
- Un singur apel de rețea per sesiune; rezultatul valid se cachează în `sessionStorage`.
- Rezultatele invalide (format greșit, coduri rezervate `XX`/`T1`/`A1`/`A2`/`O1`) **nu**
  se cachează.
- Niciun header de țară furnizat de client nu este citit sau acceptat.
- `resolveLanguage()` și `detect()` **nu aruncă niciodată**; orice eroare ⇒ engleză.

---

## 5. Teste — rezultate reale

```bash
npm test
# echivalent cu: node --test "tests/**/*.test.mjs"
```

| Metrică | Valoare |
|---|---|
| Fișiere de test | 7 |
| Suites | 26 |
| Teste | **127** |
| Trecute | **127** |
| Eșuate | **0** |
| Durată | ~0,3 s |
| Dependențe instalate | **0** |
| Apeluri reale către serviciul geo | **0** (fetch injectat; test dedicat verifică absența rețelei la import și la `init()` cu `fetchImpl: null`) |

Sintaxa tuturor modulelor a fost verificată suplimentar cu `node --check` (8 fișiere, toate OK).

---

## 6. Verificarea manuală a integrării reale (nu face parte din `npm test`)

Instrument: `node tools/geo-check.mjs`

| Rulare | Durată | Rezultat |
|---|---|---|
| 1 | 2007 ms | nedetectat (timeout) ⇒ fallback `en` |
| 2 | 2620 ms | nedetectat (timeout) ⇒ fallback `en` |
| 3 | 192 ms | `RO` ⇒ `ro` |
| 4–7 | 177–209 ms | `RO` ⇒ `ro` |

Măsurători suplimentare:

- timeout onorat precis cu fetch blocat artificial: **300 ms → 302 ms**, **1000 ms → 1002 ms**;
- prima cerere într-un proces nou: **1,2 s – 7,6 s** (acest mediu);
- într-o rulare instrumentată, **timerul de 2000 ms a sunat la 2608 ms** — întârzierea
  vine din stratul de rețea/event loop al mediului, nu din cod (un timer de 500 ms a sunat
  la 501 ms când nu era implicată nicio conexiune).

**Concluzie:** mecanismul funcționează și fallback-ul este garantat. Rezultatul `RO` este
valabil **doar** pentru rețeaua de test — **nu** dovedește detecția corectă pentru alte țări.

---

## 7. Probleme identificate

1. **Latență variabilă la conexiunea „rece” (mediu de test).** Prima cerere poate depăși
   2 s, iar timerul de timeout poate suna cu ~600 ms întârziere. Impact: la unele vizite
   rezultatul poate sosi mai târziu decât fereastra configurată. Nu blochează pagina.
   *Propunere:* valoarea e deja configurabilă; recomand **2500–3000 ms** în producție și,
   în etapa 3, aplicarea limbii doar dacă rezultatul sosește în fereastra stabilită.
2. **`node --test tests/` nu funcționează pe Node 26** (tratează directorul ca modul).
   Rezolvat: scriptul folosește `node --test "tests/**/*.test.mjs"`.
3. **Fișiere noi servite public de GitHub Pages.** `package.json`, `tests/`, `tools/`,
   `docs/`, `js/i18n/` devin accesibile pe `digitalmusicromania.com`. Nu conțin secrete
   și nu afectează site-ul, dar trebuie acceptat explicit. Alternativă: mutarea testelor
   într-un folder exclus (necesită `.nojekyll` sau un branch separat).
4. **Fără `.nojekyll`.** GitHub Pages rulează Jekyll la publicare. Fișierele noi nu au
   front matter, deci sunt copiate ca atare; nu am observat risc, dar rămâne de verificat
   după primul deploy.
5. **Datorii existente neatinse** (raportate, nerezolvate, conform cerinței): `js/search.js`
   caută `#searchBox` inexistent; `js/certificate.js`, `certificari/catalog.js`,
   `certificari/certificate copy.js`, `css/style.css`, `assets/icons/*`,
   `coming-soon.html` nefolosite; `404.html` și `coming-soon.html` au `ref=` în loc de
   `href=` și un text literal `...` în `<head>`; FontAwesome încărcat de două ori în
   `certificari/`; `.DS_Store` comise; `/index.html` duplicat în sitemap.
6. **`sitemap.xml` nu a fost modificat** (așteaptă aprobarea pentru etapa de SEO).
7. **`/certificari/` și `/i/` nu au fost atinse.** Strategia SEO propusă (păstrarea
   URL-urilor, fără a declara două versiuni lingvistice pentru aceeași adresă) este
   detaliată în raportul din conversație și se implementează în etapa 3/8.

---

## 8. Ce urmează (nu se începe fără aprobare)

1. Etapa 3: `ro/index.html` (shell static RO) + selectorul `RO | EN` + `hreflang`/`canonical`.
2. Etapa 4: wiring-ul modulelor JS existente la runtime-ul i18n (fără schimbarea designului).
3. Etapa 5: `ro/registru/`.
4. Etapa 6: `/certificari/` și `/i/` bilingve, cu URL-uri neschimbate.
5. Etapa 7–8: 404 bilingv, SEO, sitemap.
6. Etapa 9: testare completă + raport final.

**Fără commit, fără push, fără deployment** până la o aprobare separată.

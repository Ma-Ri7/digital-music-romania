# Raport etapă 3 — pagina principală română + selector RO | EN

**Branch:** `feat/i18n-ro-en` (0 commit-uri) · **Data:** 24.10.2026
**Status:** ✅ implementat și testat · ⏸️ **fără commit, fără push, fără deployment**

---

## 1. Verificarea codului din etapa 2 (înainte de modificări)

Verificat direct, nu din raport:

| Verificare | Rezultat |
|---|---|
| Cele 127 de teste se reproduc | ✅ 127/127 |
| Importuri ESM + căi relative în structura reală | ✅ toate cele 7 module se importă (13/4/6/4/5/2/2 exporturi) |
| Geo nu poate suprascrie o alegere manuală | ✅ `resolveLanguage()` citește preferința **înainte** de a apela resolver-ul |
| Timeout / răspuns invalid / serviciu indisponibil → EN | ✅ testat pentru fiecare caz |
| Fără HTML nesigur în dicționare/mecanism | ✅ zero `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`eval`/`document.write`; doar `textContent` + `setAttribute` |
| Fără efecte secundare la import | ✅ test dedicat: 0 apeluri de rețea, globals nemodificate |
| Fără cereri geo inutile | ✅ `resolver.calls === 0` când URL-ul sau preferința decide limba |

**Probleme găsite și corectate (strict necesare):**

1. **`planLanguageNavigation()` ignora politica `"suggest"`** — returna `"navigate"` în loc de `"suggest"`. Corectat; testul care a expus-o este păstrat.
2. **Semantica `<html lang>` era incorectă pentru paginile cu URL neprefixat.** Se aplica limba *cerută de vizitator*, deci pe `/` un vizitator RO ar fi avut `lang="ro"` pe conținut englez. Acum se aplică **limba conținutului static** (`pageLanguage`), iar limba cerută produce navigarea/propunerea. Două teste din etapa 2 au fost actualizate în consecință (raportat explicit).

---

## 2. Fișiere create (etapa 3)

| Fișier | Rol |
|---|---|
| `ro/index.html` | pagina principală română (644 linii), traducere completă |
| `js/i18n/lang-switcher.js` | selectorul `RO \| EN` + propunerea de limbă (accesibile, fără `innerHTML`) |
| `js/i18n/page.js` | punctul de intrare al paginii: rezolvă limba, aplică `lang`, inițializează selectorul, navighează/propune |
| `css/i18n.css` | stilurile selectorului și ale propunerii (paleta existentă: `#FFD700`, `#B8860B`, `#111`) |
| `tests/language-navigation.test.mjs` | `resolvePageLanguage`, `planLanguageNavigation`, planul de navigare, cursa cu geo |
| `tests/lang-switcher.test.mjs` | selectorul, propunerea, `startPageLanguage` |
| `tests/page-shell.test.mjs` | verificări statice pe `/` și `/ro/` (SEO, echivalență, căi) |
| `docs/i18n/RAPORT-FAZA-3.md` | acest document |

## 3. Fișiere modificate

**Un singur fișier existent:** `index.html` — **33 linii adăugate, 1 modificată**:

- `<html lang="ro">` → `<html lang="en">` (corecție SEO: conținutul era englez)
- `canonical` + `hreflang` `en`/`ro`/`x-default`
- `<link rel="stylesheet" href="css/i18n.css">`
- markup-ul selectorului `RO | EN`
- `<script type="module" src="js/i18n/page.js"></script>`

**Niciunul din cele 22 de module JS existente nu a fost modificat.**
`registry.html`, `/certificari/`, `/i/`, `sitemap.xml`, `404.html`, `coming-soon.html`,
`style.css`, `data.json` — **neatinse**.

---

## 4. Comportamentul de inițializare a limbii

```
1. URL explicit      /ro/... => ro ; /en/... => en
2. preferință salvată (localStorage "dmr.lang")
3. țara detectată    RO => ro ; altă țară => en
4. fallback          engleză
```

Aplicarea:
- `<html lang>` = **limba conținutului paginii** (descrie documentul real).
- Dacă limba rezolvată diferă de limba paginii și rezultatul a sosit în **≤ 2000 ms**
  (`navigateDeadlineMs`) → `location.replace()` către pagina echivalentă.
- Dacă rezultatul a sosit mai târziu → **fără navigare**, se afișează o propunere
  închisibilă (evită „flash”-ul de limbă).
- Politica este configurabilă: `navigationPolicy` = `"navigate"` / `"suggest"` / `"off"`.
- **Alegerea manuală făcută în timpul unei cereri geo prevalează**: după await se
  re-citește preferința și, dacă URL-ul nu este explicit, aceasta câștigă.

---

## 5. Detalii tehnice importante

### `<base href="/">` în pagina română
Modulele JS existente folosesc căi relative. Măsurat:

| Referință | fără `<base>` | cu `<base href="/">` |
|---|---|---|
| `data.json` | `/ro/data.json` ❌ 404 | `/data.json` ✅ |
| `covers/X.webp` | `/ro/covers/X.webp` ❌ | `/covers/X.webp` ✅ |
| `certificari/?search=X` | `/ro/certificari/` ❌ | `/certificari/` ✅ |
| `js/app.js` | `/ro/js/app.js` ❌ | `/js/app.js` ✅ |

Consecință: ancorele de tip `#hero` ar fi rezolvat greșit (`/#hero`), deci în pagina
română toate ancorele sunt absolute: `/ro/#hero`, `/ro/#about`, `/ro/#footer` etc.
Legăturile placeholder `href="#"` au devenit `/ro/#latest` (altfel un click înainte de
încărcarea JS ar fi dus vizitatorul pe pagina engleză).

### Selectorul folosește `<div role="navigation">`, nu `<nav>`
`style.css` conține reguli pe elementul `nav` (`nav{display:flex;gap:32px}` și, sub
900 px, `nav{position:absolute;top:100%;width:100%;display:none}`). Un `<nav>` ar fi
moștenit aceste reguli (inclusiv ascunderea pe mobil). Clasa `.lang-switcher` evită
orice coliziune, fără a modifica `style.css`.

### Echivalența conținutului este reală
Cele două pagini au **exact același set de 31 de id-uri** (verificat automat), aceleași
secțiuni (`hero`, `latest`, `about`, `recommended`, `catalog`, `footer`) și același
schelet DOM, deci `hreflang` este justificat. Textele diferă doar prin limbă.

---

## 6. Rezultatele testelor

| Metrică | Etapa 2 | Etapa 3 |
|---|---|---|
| Fișiere de test | 7 | **10** |
| Suites | 26 | **37** |
| Teste | 127 | **185** |
| Trecute | 127 | **185** |
| Eșuate | 0 | **0** |
| Apeluri reale către serviciul geo | 0 | **0** |

Teste noi pentru: limba paginii, planul de navigare (inclusiv pragul exact și politicile),
cursa „alegere manuală în timpul cererii geo”, selectorul în ambele sensuri, persistența
preferinței, propunerea de limbă (afișare, închidere, memorare în sesiune),
`startPageLanguage` (navigare / propunere / fără acțiune / fără `location` / fără `body`),
metadatele SEO, căile absolute, echivalența id-urilor, absența textelor engleze rămase.

---

## 7. Verificări manuale

- **Server local** (`python3 -m http.server 8123`): `/` și `/ro/` → 200 `text/html`;
  `/style.css`, `/css/i18n.css`, `/js/app.js`, `/js/i18n/page.js`, `/data.json`,
  `/favicon.ico`, `/covers/*.webp` → 200 cu tipurile corecte.
- **Bucle de redirecționare**: simulate 9 scenarii (RO/DE/preferințe/geo indisponibil,
  pe `/` și pe `/ro/`) — maximum **1 navigare**, apoi `"none"`. **Zero bucle.**
- **SEO**: `/` → `lang="en"`, canonical `…/`, hreflang `en`→`/`, `ro`→`/ro/`, `x-default`→`/`;
  `/ro/` → `lang="ro"`, canonical `…/ro/`, hreflang reciproc.
- **Integritate markup**: diferența `</div>` vs `<div>` (+1) este **pre-existentă** în
  `index.html` original și este identică în ambele pagini — nu a fost introdusă de mine.

---

## 8. Limitări și probleme rămase

1. **`/registry.html` este doar în engleză.** Butonul „Vezi registrul complet” și linkul
   „Registru” din pagina română duc la `/registry.html` (pagina existentă, funcțională),
   pentru a evita un 404. Se rezolvă în etapa 5 (`/ro/registru/`).
2. **Textele injectate de modulele existente rămân în engleză**: `js/cards.js`
   („View Certificate →”, „Bitcoin SV Blockchain”), `js/carousel.js` („Certificate”,
   „Inscription”), `js/certificate-preview.js` (modalul), `js/latest.js`
   („Official Blockchain Certified Release.”). Se rezolvă în etapa 4, când modulele
   existente se conectează la runtime-ul i18n (necesită aprobare explicită).
3. **Text românesc pe pagina engleză**: blocul de eroare din `js/app.js`
   („⚠ Catalog indisponibil”) apare așa și pe `/`. Se rezolvă în etapa 4.
4. **Descrierile melodiilor** din `data.json` sunt, în proporție covârșitoare,
   placeholder (`xxx`/`XXX`) — nu au fost traduse și nu s-a inventat conținut.
5. **`sitemap.xml` nu conține încă `/ro/`** (necesită aprobare separată).
6. **Timeout-ul geo rămâne 2000 ms**, conform deciziei tale. La unele vizite rezultatul
   poate sosi mai târziu; în acest caz nu se navighează, ci se afișează propunerea.
7. **„Flash” de limbă**: la navigarea automată pagina engleză se poate vedea ~0,2–2 s
   înainte de `location.replace`. Este comportamentul cerut (vizitator RO → română),
   dar rămâne o limitare de UX. Alternativa (politica `"suggest"`) elimină complet
   flash-ul, cu prețul unui click suplimentar.
8. **Verificarea în browser real** (selector, click, focus, aspect pe mobil) nu a fost
   făcută — nu am acces la un browser în acest mediu. Testele acoperă logica, nu randarea.

---

## 9. Recomandare pentru etapa următoare

**Etapa 4 — conectarea modulelor JS existente la runtime-ul i18n** (texte injectate
dinamic: carduri, carusel, modal, loader, mesaje de eroare), cu aprobare explicită
pentru modificarea modulelor, **fără** atingerea designului.

Înainte de etapa 4 se recomandă o verificare în browser a paginilor `/` și `/ro/`
(selector, focus, aspect mobil, `base href`).

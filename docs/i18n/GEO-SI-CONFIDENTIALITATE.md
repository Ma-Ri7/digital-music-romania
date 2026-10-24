# Detectarea țării: serviciul folosit, date transmise, confidențialitate

Document de referință pentru versiunea bilingvă RO/EN a site-ului
`digitalmusicromania.com` (GitHub Pages, site static).

**Status: NECESITĂ REVIZUIRE JURIDICĂ ÎNAINTE DE PUBLICARE.**
Acest document descrie tehnic ce se întâmplă; nu constituie consultanță juridică.

---

## 0. Stare curentă: detectarea după IP este DEZACTIVATĂ

Din etapa 6.4, comutatorul `GEO_DETECTION_ENABLED` (`js/i18n/config.js`) are
valoarea implicită **`false`**. În această configurație:

- **nu se face nicio cerere** către GeoJS și către niciun alt serviciu de
  geolocalizare;
- **nu se scrie și nu se citește** cheia `dmr.geo`;
- limba se stabilește exclusiv din URL-ul explicit, din preferința salvată a
  utilizatorului sau din limba implicită (`en`);
- selectorul `RO | EN`, traducerile, rutele, sitemap-ul și navigarea între
  paginile lingvistice funcționează neschimbat.

Codul GeoJS este păstrat integral. Reactivarea se face printr-o singură
schimbare de configurare (`geoDetectionEnabled: true`), fără modificări de cod.
Detaliile comutatorului sunt în secțiunea 8.

**Important:** oprirea GeoJS **nu** elimină transferurile către celelalte
servicii externe folosite de site. Vezi secțiunea 9.

---

## 1. Metoda de detectare a țării

Limba implicită se determină în ordinea:

1. **URL explicit** — `/ro/...` ⇒ română; `/en/...` ⇒ engleză.
2. **Preferința salvată** explicit de utilizator (selectorul `RO | EN`).
3. **Țara vizitatorului**, determinată printr-un singur apel către GeoJS —
   **numai dacă `geoDetectionEnabled === true`**. Când comutatorul este `false`
   (valoarea implicită), acest pas este sărit complet.
4. **Fallback: engleză** — la orice eroare, timeout, răspuns invalid, țară
   nedetectabilă sau detectare dezactivată.

Pașii 1 și 2 au prioritate necondiționată: dacă URL-ul sau preferința stabilesc
limba, pasul 3 nu este atins niciodată, indiferent de valoarea comutatorului.

Nu se citește și nu se acceptă **niciun header de țară furnizat de client** ca dovadă
a locației reale. Nu se folosește `navigator.language` ca semnal de limbă.

---

## 2. Serviciul extern folosit

| Element | Valoare |
|---|---|
| Serviciu | GeoJS |
| Endpoint | `https://get.geojs.io/v1/ip/country.json` |
| Documentație | https://www.geojs.io/docs/v1/endpoints/country/ |
| Politica de confidențialitate | https://www.geojs.io/privacy/ |
| Autentificare | nu necesită cheie API, nu necesită cont |
| Cost | gratuit |
| Răspuns | `{"country":"RO","country_3":"ROU","ip":"1.2.3.4","name":"Romania"}` |
| Câmp folosit | **doar** `country` (cod ISO 3166-1 alpha-2) |

Serviciul este izolat în `js/i18n/geo.js` + `js/i18n/config.js`. Schimbarea
providerului (inclusiv trecerea la un endpoint first-party în spatele Cloudflare)
înseamnă modificarea unei singure constante: `GEO_ENDPOINT`.

**Serviciul nu este folosit în configurația actuală.** Comutatorul
`GEO_DETECTION_ENABLED` (`js/i18n/config.js`) este `false` implicit, iar
`js/i18n/index.js` nu mai construiește deloc resolverul în acest caz
(`service.resolver === null`). În plus, chiar dacă un resolver ar fi construit,
`detect()` (`js/i18n/geo.js`) returnează `null` imediat, fără `fetch` și fără
acces la cache. Nu există nicio cale prin care o pagină să contacteze GeoJS
cât timp comutatorul este `false`. Vezi secțiunea 8.

---

## 3. Ce se transmite exact serviciului extern

**Această secțiune descrie ce s-ar transmite DACĂ detectarea ar fi activată.**
În configurația actuală (`geoDetectionEnabled: false`) nu se transmite nimic,
pentru că cererea nu are loc.

O **singură** cerere `GET`, fără parametri de query, doar dacă **toate** condițiile
următoare sunt îndeplinite:

- `geoDetectionEnabled === true` (comutatorul de detectare), **și**
- pagina nu are prefix de limbă în URL, **și**
- nu există preferință salvată, **și**
- nu există rezultat în cache-ul de sesiune.

| Transmis | Detaliu |
|---|---|
| Adresa IP publică a vizitatorului | implicit, orice cerere HTTP dezvăluie IP-ul către serverul destinatar. Nu este trimisă de cod ca parametru. |
| Metoda și calea | `GET /v1/ip/country.json` |
| `User-Agent` | trimis automat de browser. Dezvăluie browserul, sistemul de operare și versiunea. **Nu este eliminat de cod** — nu poate fi controlat din JavaScript. |
| `Accept-Language` | trimis automat de browser. Indică preferințele lingvistice ale utilizatorului. **Nu este eliminat de cod.** |
| `Accept`, `Accept-Encoding` | trimise automat de browser; descriu formatele și compresia acceptate. |
| Amprenta de transport (TLS/TCP) | proprietăți ale conexiunii, vizibile oricărui server destinatar. |

| NU se transmite | Detaliu |
|---|---|
| Cookie-uri | `credentials: "omit"` |
| Referer | `referrerPolicy: "no-referrer"` |
| Parametri de query | niciunul |
| Date de formular, ISRC, ID-uri, identificatori de utilizator | nimic |
| IP-ul către alte servicii | nu există alte apeluri externe pentru detecția limbii |

Cererea se face cu `cache: "no-store"`, `mode: "cors"`.

**Precizare importantă despre `referrerPolicy: "no-referrer"`:** această opțiune
suprimă **doar** header-ul `Referer`. Ea **nu** are niciun efect asupra
header-elor implicite enumerate mai sus (`User-Agent`, `Accept-Language`,
`Accept`, `Accept-Encoding`) și nici asupra adresei IP. Acestea sunt trimise de
browser în orice cerere `fetch` și **nu pot fi eliminate din JavaScript**.
Minimizarea realizată de cod se limitează la: fără cookie-uri, fără `Referer`,
fără parametri de query, o singură cerere per sesiune, un singur câmp folosit
din răspuns (`country`).

---

## 4. Ce se stochează local (fără cookie-uri)

| Cheie | Loc | Conținut | Durată | Scrisă când |
|---|---|---|---|---|
| `dmr.lang` | `localStorage` | `"ro"` sau `"en"` — **doar** dacă utilizatorul a ales explicit limba | până la ștergerea manuală | la alegerea explicită din selector |
| `dmr.geo` | `sessionStorage` | codul de țară detectat (ex. `"RO"`) — **doar dacă detectarea este activată** | până la închiderea tabului | după un răspuns GeoJS valid |
| `dmr.banner` | `sessionStorage` | `"hidden"` | până la închiderea tabului | la închiderea propunerii de limbă |

În configurația actuală (`geoDetectionEnabled: false`) **`dmr.geo` nu este scris
și nu este citit deloc**.

Nu se folosesc cookie-uri, analytics, pixeli de urmărire sau identificatori persistenți
pentru comportament. `dmr.geo` are rolul de a **evita apeluri repetate** către serviciul
extern (un singur apel per sesiune).

---

## 5. Limitările GeoJS

### Documentate / observabile din politicile lor

- **Fără SLA și fără garanție de disponibilitate** — serviciu gratuit, întreținut de o
  persoană, sponsorizat (Digital Ocean, Cloudflare, Micron21). Nu există limită de
  trafic documentată public pentru endpoint-ul de țară, dar nici vreo garanție.
- **Politica lor de confidențialitate** afirmă: nu stochează log-uri de acces,
  stochează doar log-uri de erori anonimizate; nu folosește cookie-uri; traficul trece
  prin rețeaua Cloudflare; își rezervă dreptul de a partaja date cu terți care prestează
  servicii pentru ei și de a coopera cu autoritățile; contact: contact@geojs.io.
  Formularea exactă din politică este: *„GeoJS stores anonymised error logs for error
  reporting/tracking but does not store access logs”*.
- **Notă de infrastructură**: „GeoJS has moved to Hetzner” — deci procesarea are loc în
  infrastructura Hetzner (UE), cu tranzit prin Cloudflare.

### Distincție necesară: log-urile GeoJS vs. retenția infrastructurii

Această distincție trebuie păstrată explicit, pentru că cele două afirmații au
statut diferit și **nu trebuie confundate**:

| Nivel | Ce se afirmă | Cine afirmă | Verificabil? |
|---|---|---|---|
| Log-urile proprii ale GeoJS | nu stochează log-uri de acces; doar log-uri de erori anonimizate | GeoJS, în propria politică de confidențialitate | **nu** — este o auto-declarație, fără mecanism public de verificare |
| Log-urile infrastructurii de tranzit și găzduire | **nu există nicio afirmație** despre retenția cererilor în Cloudflare, Hetzner, Digital Ocean sau Micron21 | nimeni | **nu** — politicile acestor furnizori se aplică independent și nu sunt documentate în politica GeoJS |

Consecințe care trebuie reținute:

- Afirmația „nu stochează log-uri de acces” se referă **exclusiv** la log-urile
  proprii ale GeoJS. Ea **nu** spune nimic despre log-urile de acces ale rețelei
  Cloudflare (prin care trece traficul, conform propriei politici GeoJS) și nici
  despre cele ale furnizorului de găzduire.
- Politica GeoJS **nu menționează nicio durată de retenție**.
- Politica GeoJS **nu menționează GDPR, un acord de prelucrare (DPA), clauze
  contractuale standard sau vreun temei pentru transferuri internaționale**.
- Termenii de serviciu precizează că acordul este guvernat de **legea Australiei**,
  iar răspunderea totală este limitată la suma plătită (zero).
- Absența stocării în codul site-ului **nu** implică faptul că furnizorul nu
  păstrează date.

Aceste puncte rămân **întrebări deschise**, nu concluzii. Ele nu pot fi rezolvate
prin analiza codului.
- Serviciul poate fi retras sau schimbat fără notificare.

### Tehnice

- Acuratețe limitată pe **VPN, proxy, Tor** (Tor este raportat cu codul rezervat `T1`,
  ignorat explicit de cod) și pe **NAT de operator mobil**.
- Poate returna coduri care nu sunt țări reale (`XX`, `A1`, `A2`, `O1`) — tratate ca
  nedetectabile.
- Codurile invalide (ex. `ROU`) sunt respinse; validarea acceptă doar `^[A-Z]{2}$`.

### Măsurători reale (24.10.2026, rețeaua de dezvoltare)

| Măsurătoare | Rezultat |
|---|---|
| Latență GeoJS, cerere „caldă” | **20–210 ms** (5 rulări) |
| Latență GeoJS, prima cerere după pornire | **1,2 s – 7,6 s** (variabilă în acest mediu) |
| Rezultat la succes | `RO` → limba `ro` (corect pentru rețeaua de test) |
| Timeout onorat precis (fetch blocat artificial) | 300 ms → 302 ms; 1000 ms → 1002 ms |
| Timeout pe rețea reală, în caz de întârziere | **timerul de 2000 ms a sunat la 2608 ms** |

**Concluzie onestă:** logica de timeout este corectă, dar în acest mediu de test
*întârzierea nu vine din cod*, ci din stratul de rețea/event loop la conexiunea „rece”
(timerul `setTimeout` însuși a fost întârziat cu ~600 ms). Efectul posibil: la unele
vizite, rezultatul geolocalizării poate sosi mai târziu decât valoarea configurată.
Site-ul **nu se blochează** în niciun caz și folosește engleza ca fallback.

**Recomandare, între timp implementată:** aplicarea limbii detectate se face doar dacă
rezultatul sosește în fereastra stabilită (`navigateDeadlineMs = 2000`); altfel pagina
rămâne pe limba implicită și, cel mult, se afișează o propunere, ca să nu existe o
schimbare vizibilă de limbă după ce pagina s-a afișat.

**Notă de actualitate:** măsurătorile de mai sus au fost făcute cu detectarea activată.
În configurația actuală (`geoDetectionEnabled: false`) nu se face nicio cerere, deci
aceste variații de latență nu au niciun efect asupra paginilor publicate.

---

## 6. Verificări de confidențialitate

### 6a. Necesare ÎNAINTE de publicarea versiunii bilingve

Cu `geoDetectionEnabled: false` (valoarea implicită), aceste verificări privesc
celelalte servicii externe, nu GeoJS:

- [ ] **Politică de confidențialitate publicată** care menționează toate resursele
      externe încărcate de pagini (vezi secțiunea 9), stocarea locală
      (`dmr.lang`, `dmr.banner`) și durata acesteia.
- [ ] **Stocarea locală**: se menționează durata și faptul că terții nu au acces
      la aceste valori.
- [ ] **Drepturile utilizatorului**: menționarea modului de ștergere a preferinței
      (ștergerea datelor site-ului din browser) și a faptului că limba poate fi
      schimbată oricând manual.
- [ ] **Verificare juridică finală** înainte de publicare.

### 6b. Necesare ÎNAINTE de activarea detectării după IP

Aceste verificări se aplică **numai** dacă se decide trecerea
`geoDetectionEnabled` la `true`:

- [ ] **Politică de confidențialitate extinsă** care menționează explicit: serviciul
      GeoJS, scopul (alegerea limbii implicite), datele implicate (adresa IP și
      header-ele implicite ale browserului) și stocarea `dmr.geo`.
- [ ] **Bază legală documentată** pentru prelucrare. Documentul nu stabilește care
      temei este corect; aceasta este o decizie juridică, nu una tehnică.
- [ ] **Transfer de date**: se analizează dacă este necesar un acord de prelucrare
      (DPA) și dacă transferul este acoperit. Politica furnizorului nu oferă
      niciun astfel de mecanism (vezi secțiunea 5).
- [ ] **Retenție**: politica furnizorului nu declară nicio durată. De clarificat
      înainte de activare.
- [ ] **Minimizarea datelor**: deja implementată — o singură cerere per sesiune,
      fără cookie-uri, fără Referer, fără parametri, doar câmpul `country` folosit,
      cache doar pe sesiune. Header-ele implicite ale browserului rămân însă în
      afara controlului codului.
- [ ] **Alternativa fără transfer de date**: un endpoint first-party
      (`/cdn-cgi/trace` în spatele Cloudflare), astfel încât IP-ul să nu ajungă la
      un serviciu terț de geolocalizare. Necesită aprobare separată pentru
      modificări DNS.

---

## 7. Verificare manuală a integrării reale

Testele automate **nu** apelează serviciul extern (fetch-ul este injectat). Testele
verifică, în schimb, că în configurația implicită **nu există niciun apel**.

Pentru verificarea reală există un instrument separat, rulat manual:

```bash
node tools/geo-check.mjs
```

**Instrumentul activează explicit detectarea** (`geoDetectionEnabled: true`),
pentru că scopul lui este exact verificarea integrării reale. Rularea lui trimite
IP-ul mașinii de dezvoltare către GeoJS. El nu reflectă comportamentul site-ului
publicat, care are detectarea dezactivată.

Rezultatul este valabil **doar** pentru rețeaua de pe care s-a rulat. Nu dovedește
detecția corectă pentru vizitatori din alte țări; aceasta se verifică separat
(VPN în altă țară, persoană din altă țară, sau date reale după publicare).

---

## 8. Comutatorul de detectare (`geoDetectionEnabled`)

### Valoare și loc

| Element | Valoare |
|---|---|
| Constantă | `GEO_DETECTION_ENABLED` în `js/i18n/config.js` |
| Valoare implicită | **`false`** |
| Proprietate în configurație | `geoDetectionEnabled` |
| Reactivare | `createConfig({ geoDetectionEnabled: true })` |

### Efectul valorii `false`

Există **două** straturi independente care garantează absența apelurilor:

1. **Stratul de intrare** (`js/i18n/index.js`): resolverul nu este construit deloc.
   `service.resolver` este `null`. Nu există obiect pe care să se poată apela
   `detect()`.
2. **Stratul resolverului** (`js/i18n/geo.js`): chiar dacă un resolver ar fi
   construit, `detect()` verifică întâi comutatorul și returnează `null` imediat —
   fără `fetch`, fără citirea cache-ului, fără scrierea cache-ului. `readCache()`
   returnează de asemenea `null`.

În plus, `js/i18n/page.js` și `js/i18n/index.js` **nu** construiesc niciun alt
client de rețea pentru limba paginii, iar `js/i18n/runtime.js` nu conține niciun
apel de rețea.

### Ce NU se schimbă când comutatorul este `false`

- Ordinea priorităților: URL explicit → preferință salvată → (țară, dacă este
  activată) → `en`.
- Timeout-ul de 2000 ms și `navigateDeadlineMs` de 2000 ms (rămân neschimbate,
  indiferent de comutator).
- Selectorul `RO | EN`, `aria-current`, `hreflang`, rutele `/ro/` și
  `/ro/registru/`, sitemap-ul, traducerile, `runtime.js`.
- Politica de navigare (`navigationPolicy`), care rămâne `"navigate"`.
  Cu detectarea oprită, navigarea automată nu se mai poate declanșa din țară;
  ea poate fi declanșată doar de o preferință salvată explicit de utilizator.

### Efectul valorii `true`

Comportamentul revine exact la cel din etapele anterioare: un singur apel GeoJS per
sesiune, în condițiile din secțiunea 3. Codul, testele și instrumentul de verificare
manuală sunt păstrate integral, deci reactivarea nu necesită nicio modificare de cod.

---

## 9. Alte transferuri, care NU depind de GeoJS

Oprirea GeoJS **nu** elimină transferurile preexistente către alte servicii.
Acestea sunt încărcate direct de paginile HTML, independent de `js/i18n/`:

| Resursă externă | Unde este încărcată | Entitate | Moment |
|---|---|---|---|
| `fonts.googleapis.com`, `fonts.gstatic.com` | `index.html`, `ro/index.html` | Google LLC | la fiecare vizită pe `/` și `/ro/` |
| `cdnjs.cloudflare.com` (FontAwesome) | `index.html`, `ro/index.html`, `certificari/index.html`, `coming-soon.html` | Cloudflare, Inc. | la fiecare vizită pe aceste pagini |
| `unpkg.com` (`qr-code-styling`) | `certificari/index.html` | Cloudflare, Inc. | la fiecare vizită pe `/certificari/` |
| Găzduirea GitHub Pages | toate paginile | GitHub / Microsoft | la fiecare cerere |

Observații care trebuie reținute în analiză:

- Adresa IP a vizitatorului ajunge deja la acești destinatari, indiferent de
  GeoJS. Oprirea GeoJS **nu** reduce la zero transferul de IP către terți.
- `certificari/index.html` încarcă FontAwesome de două ori (linii duplicate).
- `qr-code-styling` este încărcat de pe `unpkg.com` fără a fi folosit de cod.
- Aceste resurse pot fi eliminate fără pierdere funcțională (fonturi și biblioteci
  găzduite local), ceea ce ar reduce transferurile. Este însă o modificare separată,
  neefectuată în această etapă.

Acest document **nu** evaluează temeiul juridic al acestor transferuri și **nu**
afirmă că situația este conformă. El constată doar existența lor.

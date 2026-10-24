// =====================================================
// Digital Music Romania — i18n
// tools/geo-check.mjs — verificare MANUALA a integrarii reale
//
// ATENTIE: acest script NU face parte din suita automata de teste
// (`npm test`) si nu este folosit de site. Se ruleaza manual,
// intentionat, pentru a verifica integrarea reala cu GeoJS.
//
//   node tools/geo-check.mjs
//
// Ce se transmite: o singura cerere GET catre endpoint-ul GeoJS,
// fara cookie-uri si fara Referer. IP-ul public al masinii de pe
// care ruleaza scriptul este vizibil pentru serviciu (este
// vizibil oricarui server caruia i se face o cerere HTTP).
//
// ATENTIE: site-ul are detectarea DEZACTIVATA implicit
// (GEO_DETECTION_ENABLED = false in js/i18n/config.js). Acest script o
// activeaza explicit, pentru ca scopul lui este exact verificarea integrarii
// reale. Rularea lui trimite IP-ul masinii de dezvoltare catre GeoJS.
// =====================================================

import { GEO_ENDPOINT, GEO_TIMEOUT_MS, createConfig } from "../js/i18n/config.js";
import { createCountryResolver, isValidCountryCode } from "../js/i18n/geo.js";
import { countryToLanguage } from "../js/i18n/language.js";

const startedAt = Date.now();

const resolver = createCountryResolver({
  config: createConfig({ geoTimeoutMs: GEO_TIMEOUT_MS, geoDetectionEnabled: true }),
  log: (message) => console.log("  [log]", message)
});

const country = await resolver.detect();

const duration = Date.now() - startedAt;

console.log("");
console.log("Endpoint :", GEO_ENDPOINT);
console.log("Timeout  :", GEO_TIMEOUT_MS, "ms");
console.log("Durata   :", duration, "ms");
console.log("Cod tara :", country === null ? "(nedetectat)" : country);
console.log("Valid    :", isValidCountryCode(country));
console.log("Limba    :", countryToLanguage(country) ?? "en (fallback)");
console.log("");

if (country === null) {
  console.log("REZULTAT: serviciul nu a putut fi folosit => site-ul va folosi engleza.");
  process.exitCode = 1;
} else {
  console.log(`REZULTAT: detectat ${country} => limba implicita ${countryToLanguage(country)}.`);
  console.log("NOTA: rezultatul este valabil doar pentru reteaua de pe care s-a rulat.");
}

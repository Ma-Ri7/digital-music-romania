// =====================================================
// Digital Music Romania — i18n
// locales/en.js — limba engleza (limba sursa / fallback)
//
// SCOPUL ACESTUI FISIER (etapa curenta): doar nucleul i18n.
// Cheile de pagina (navbar, hero, registry, certificate, footer)
// se adauga in etapa de traducere a paginilor, folosind exact
// aceeasi structura. Testul de paritate ro/en protejeaza
// cele doua fisiere sa nu divergheze.
// =====================================================

export const locale = Object.freeze({
  code: "en",
  htmlLang: "en",
  dir: "ltr",
  intlLocale: "en-US",
  label: "English",
  nativeLabel: "English"
});

export const messages = Object.freeze({
  // selector de limba
  "language.switcher.label": "Language",
  "language.switcher.short.ro": "RO",
  "language.switcher.short.en": "EN",
  "language.switcher.name.ro": "Română",
  "language.switcher.name.en": "English",
  "language.switcher.current": "Current language: {language}",
  "language.switcher.switchTo": "Switch to {language}",

  // propunere de schimbare a limbii (afisata cand tara detectata
  // nu corespunde limbii paginii curente)
  "language.suggestion.title": "Continue in Romanian?",
  "language.suggestion.action": "Open the Romanian version",
  "language.suggestion.dismiss": "Stay in English",

  // texte comune folosite de nucleu
  "common.loading": "Loading…",

  // carduri din catalog si registru (js/cards.js)
  "cards.isrc": "ISRC",
  "cards.network": "Bitcoin SV Blockchain",
  "cards.viewCertificate": "View Certificate →",
  "cards.openCertificate": "Open Certificate →",
  "cards.verified": "✓ VERIFIED",

  // carusel de lansari recomandate (js/carousel.js)
  "carousel.certificate": "Certificate",
  "carousel.inscription": "Inscription",

  // ultima lansare (js/latest.js)
  "latest.descriptionFallback": "Official Blockchain Certified Release.",

  // previzualizare certificat (js/certificate-preview.js)
  "preview.verifiedBadge": "✓ VERIFIED",
  "preview.certificateInfo": "Certificate Information",
  "preview.isrc": "ISRC",
  "preview.txid": "Transaction Hash (TXID)",
  "preview.status": "Status",
  "preview.statusVerified": "Verified ✓",
  "preview.blockchain": "Blockchain",
  "preview.network": "Network",
  "preview.registration": "Registration",
  "preview.copyIsrc": "Copy ISRC",
  "preview.copyHash": "Copy Blockchain Hash",
  "preview.viewInscription": "View Blockchain Inscription",
  "preview.copied": "Copied!",

  // rezultat gol in catalog (js/catalog.js)
  "catalog.emptyTitle": "No Blockchain Record Found",
  "catalog.emptyMessage": "No music certificate matches your search.",

  // erori de incarcare (js/app.js)
  "app.catalogUnavailable": "⚠ Catalog unavailable",
  "app.catalogUnavailableMessage": "The data.json file could not be loaded.",
  "app.loadError": "Could not load data.json",
  "app.emptyCatalog": "Empty catalog."
});

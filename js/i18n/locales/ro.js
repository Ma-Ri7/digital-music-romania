// =====================================================
// Digital Music Romania — i18n
// locales/ro.js — limba romana
//
// SCOPUL ACESTUI FISIER (etapa curenta): doar nucleul i18n.
// Cheile de pagina (navbar, hero, registry, certificate, footer)
// se adauga in etapa de traducere a paginilor, folosind exact
// aceeasi structura. Testul de paritate ro/en protejeaza
// cele doua fisiere sa nu divergheze.
// =====================================================

export const locale = Object.freeze({
  code: "ro",
  htmlLang: "ro",
  dir: "ltr",
  intlLocale: "ro-RO",
  label: "Română",
  nativeLabel: "Română"
});

export const messages = Object.freeze({
  // selector de limba
  "language.switcher.label": "Limbă",
  "language.switcher.short.ro": "RO",
  "language.switcher.short.en": "EN",
  "language.switcher.name.ro": "Română",
  "language.switcher.name.en": "English",
  "language.switcher.current": "Limba curentă: {language}",
  "language.switcher.switchTo": "Comută la {language}",

  // propunere de schimbare a limbii (afisata cand tara detectata
  // nu corespunde limbii paginii curente)
  "language.suggestion.title": "Continuați în engleză?",
  "language.suggestion.action": "Deschide versiunea în engleză",
  "language.suggestion.dismiss": "Rămâi pe română",

  // texte comune folosite de nucleu
  "common.loading": "Se încarcă…",

  // carduri din catalog si registru (js/cards.js)
  "cards.isrc": "ISRC",
  "cards.network": "Blockchain Bitcoin SV",
  "cards.viewCertificate": "Vezi certificatul →",
  "cards.openCertificate": "Deschide certificatul →",
  "cards.verified": "✓ VERIFICAT",

  // carusel de lansari recomandate (js/carousel.js)
  "carousel.certificate": "Certificat",
  "carousel.inscription": "Inscripție",

  // ultima lansare (js/latest.js)
  "latest.descriptionFallback": "Lansare oficială certificată pe blockchain.",

  // previzualizare certificat (js/certificate-preview.js)
  "preview.verifiedBadge": "✓ VERIFICAT",
  "preview.certificateInfo": "Informații certificat",
  "preview.isrc": "ISRC",
  "preview.txid": "Hash tranzacție (TXID)",
  "preview.status": "Stare",
  "preview.statusVerified": "Verificat ✓",
  "preview.blockchain": "Blockchain",
  "preview.network": "Rețea",
  "preview.registration": "Înregistrare",
  "preview.copyIsrc": "Copiază ISRC",
  "preview.copyHash": "Copiază hash-ul blockchain",
  "preview.viewInscription": "Vezi inscripția pe blockchain",
  "preview.copied": "Copiat!",

  // rezultat gol in catalog (js/catalog.js)
  "catalog.emptyTitle": "Nu a fost găsită nicio înregistrare",
  "catalog.emptyMessage": "Niciun certificat muzical nu corespunde căutării.",

  // erori de incarcare (js/app.js)
  "app.catalogUnavailable": "⚠ Catalog indisponibil",
  "app.catalogUnavailableMessage": "Nu s-a putut încărca fișierul data.json.",
  "app.loadError": "Nu s-a putut încărca data.json",
  "app.emptyCatalog": "Catalog gol."
});

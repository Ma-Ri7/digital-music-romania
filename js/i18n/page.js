// =====================================================
// Digital Music Romania — i18n
// page.js — punct de intrare pentru pagini
//
// Ruleaza la incarcarea paginii:
//  1. rezolva limba (URL -> preferinta -> tara -> fallback EN)
//  2. aplica limba continutului paginii pe <html lang>
//  3. initializeaza selectorul manual RO | EN
//  4. navigheaza la pagina echivalenta, dar numai daca rezultatul
//     a sosit in fereastra limita; altfel propune schimbarea
//
// Nu arunca niciodata: orice eroare este raportata in consola,
// iar pagina rămâne functionala in limba ei statica.
// =====================================================

import { createLanguageService } from "./index.js";
import { initLanguageSwitcher, watchSwitcherClicks } from "./lang-switcher.js";

function resolveLocation(options) {
  if (options.location !== undefined) return options.location;
  return typeof globalThis === "undefined" ? undefined : globalThis.location;
}

function resolveGlobal(name) {
  return typeof globalThis === "undefined" ? undefined : globalThis[name];
}

/**
 * Urmareste navigarile initiate de utilizator.
 *
 * Daca vizitatorul apasa un link (intern sau extern) cat timp detectarea
 * tarii este inca in curs, redirectionarea automata intarziata nu mai are
 * voie sa-i suprascrie actiunea.
 */
export function watchUserNavigation(documentRef) {
  const state = { started: false };

  if (!documentRef || typeof documentRef.addEventListener !== "function") {
    return state;
  }

  documentRef.addEventListener(
    "click",
    (event) => {
      const node = event && event.target;

      if (!node || typeof node.closest !== "function") return;

      const anchor = node.closest("a[href]");

      if (!anchor) return;

      const href = anchor.getAttribute("href");

      // Fragmentele nu schimba documentul, deci nu blocheaza redirectionarea.
      if (!href || href.startsWith("#")) return;

      state.started = true;
    },
    true
  );

  return state;
}

export async function startPageLanguage(options = {}) {
  const documentRef =
    options.document !== undefined ? options.document : resolveGlobal("document");

  // Se inregistreaza INAINTE de rezolvarea limbii, ca sa prinda
  // click-urile facute cat timp cererea geo este in curs.
  const navigationGuard = watchUserNavigation(documentRef);

  const service = createLanguageService(options);

  // Persistarea alegerii manuale se inregistreaza sincron, ca sa functioneze
  // si cat timp cererea geo este inca in curs.
  watchSwitcherClicks(service, documentRef);

  const result = await service.init();
  const ui = initLanguageSwitcher(service, result, options);

  const navigation = result.navigation || { action: "none", target: null };
  const target = navigation.target;

  if (navigation.action === "navigate" && target && !navigationGuard.started) {
    const locationRef = resolveLocation(options);

    if (locationRef && typeof locationRef.replace === "function") {
      locationRef.replace(target);
      return { service, result, ui, navigated: true, suppressed: false };
    }
  }

  if (navigation.action === "suggest" && target) {
    ui.showSuggestion(target);
  }

  return {
    service,
    result,
    ui,
    navigated: false,
    suppressed: navigationGuard.started
  };
}

// Pornire automata doar intr-un document real (nu la import in teste).
if (typeof document !== "undefined") {
  startPageLanguage().catch((error) => {
    console.error("[i18n] initializarea limbii a esuat:", error);
  });
}

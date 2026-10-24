// =====================================================
// Teste de integrare — js/app.js (calea de eroare la incarcarea catalogului)
// Import dinamic cu interogare unica, pentru evaluare curata la fiecare test.
// =====================================================

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { getPageTranslator, resetPageTranslator } from "../js/i18n/runtime.js";
import { messages as enMessages } from "../js/i18n/locales/en.js";
import { messages as roMessages } from "../js/i18n/locales/ro.js";
import { createFakeDocument, installGlobals } from "./helpers/fake-dom.mjs";

let importCounter = 0;

beforeEach(() => {
  resetPageTranslator();
});

/**
 * Porneste pagina cu un fetch care eșueaza, ca sa ajungem pe ramura de eroare.
 */
async function runErrorPath(pathname) {
  getPageTranslator({ pathname });

  const documentRef = createFakeDocument({ ids: ["loader", "songs-container"] });
  const container = documentRef.getElementById("songs-container");
  const loader = documentRef.getElementById("loader");
  const logged = [];

  const originalConsoleError = console.error;

  console.error = (...args) => logged.push(args);

  const restore = installGlobals({
    document: documentRef,
    fetch: async () => {
      throw new TypeError("offline");
    }
  });

  try {
    importCounter += 1;

    await import(`../js/app.js?test=${importCounter}`);

    documentRef.dispatchEvent("DOMContentLoaded");

    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
  } finally {
    restore();
    console.error = originalConsoleError;
  }

  return { container, loader, logged };
}

describe("js/app.js — catalog indisponibil", () => {
  it("pe pagina romana foloseste mesajele romanesti", async () => {
    const { container } = await runErrorPath("/ro/");
    const html = container.innerHTML;

    assert.ok(html.includes(roMessages["app.catalogUnavailable"]));
    assert.ok(html.includes(roMessages["app.catalogUnavailableMessage"]));
    assert.ok(html.includes("⚠ Catalog indisponibil"));
  });

  it("pe pagina engleza afiseaza mesaje englezesti (fara inversiune de limba)", async () => {
    const { container } = await runErrorPath("/");
    const html = container.innerHTML;

    assert.ok(html.includes(enMessages["app.catalogUnavailable"]));
    assert.ok(html.includes(enMessages["app.catalogUnavailableMessage"]));
    assert.ok(html.includes("⚠ Catalog unavailable"));
    assert.ok(!html.includes("Catalog indisponibil"));
  });

  it("mesajele sunt inserate in continut, nu in atribute", async () => {
    const { container } = await runErrorPath("/ro/");
    const html = container.innerHTML;
    const textOnly = html.replace(/="[^"]*"/g, '=""');

    assert.ok(textOnly.includes(roMessages["app.catalogUnavailable"]));
    assert.ok(textOnly.includes(roMessages["app.catalogUnavailableMessage"]));
    assert.ok(!html.includes(`="${roMessages["app.catalogUnavailable"]}"`));
  });

  it("structura si clasele blocului de eroare sunt neschimbate", async () => {
    const { container } = await runErrorPath("/ro/");
    const html = container.innerHTML;

    assert.ok(html.includes('class="no-results"'));
    assert.ok(html.includes("<h2>"));
    assert.ok(html.includes("<p>"));
  });

  it("loader-ul este ascuns dupa eroare", async () => {
    const { loader } = await runErrorPath("/ro/");

    assert.equal(loader.style.display, "none");
  });

  it("eroarea este raportata in consola", async () => {
    const { logged } = await runErrorPath("/ro/");

    assert.ok(logged.length >= 1);
  });
});

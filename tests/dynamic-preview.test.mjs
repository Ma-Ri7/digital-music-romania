// =====================================================
// Teste de integrare — js/certificate-preview.js
// Include butoanele de copiere (aceeasi cheie la afisare si la revenire).
// =====================================================

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { openPreview } from "../js/certificate-preview.js";
import { getPageTranslator, resetPageTranslator } from "../js/i18n/runtime.js";
import { messages as enMessages } from "../js/i18n/locales/en.js";
import { messages as roMessages } from "../js/i18n/locales/ro.js";
import { createFakeDocument, installGlobals, flushMicrotasks } from "./helpers/fake-dom.mjs";

const SONG = Object.freeze({
  id: "test-song",
  title: "Test Song",
  artist: "Test Artist",
  isrc: "GX0000000001",
  upc: "5063958150871",
  cover: "covers/test.webp",
  inscription: "5f912728d390f1b9ef352a5316cf2e1f06e3716464e271ed65e28cac9fdc1dbb",
  blockchain_url: "https://ordinals.gorillapool.io/content/abc",
  description: ""
});

const PREVIEW_IDS = [
  "certificate-modal",
  "certificate-content",
  "copy-isrc",
  "copy-hash",
  "view-blockchain"
];

beforeEach(() => {
  resetPageTranslator();
});

/**
 * Deschide previzualizarea intr-un mediu controlat si ruleaza callback-ul
 * in interiorul acelui mediu (butoanele de copiere folosesc navigator).
 */
async function withPreview(pathname, callback) {
  getPageTranslator({ pathname });

  const documentRef = createFakeDocument({ ids: PREVIEW_IDS });
  const timers = [];

  const restore = installGlobals({
    document: documentRef,
    navigator: { clipboard: { writeText: async () => {} } },
    window: { open() {} }
  });

  const originalSetTimeout = globalThis.setTimeout;

  globalThis.setTimeout = (callbackFn) => {
    timers.push(callbackFn);
    return timers.length;
  };

  try {
    openPreview({ ...SONG });

    return await callback({
      documentRef,
      timers,
      content: documentRef.getElementById("certificate-content")
    });
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    restore();
  }
}

describe("js/certificate-preview.js — etichete", () => {
  it("pe pagina romana foloseste etichetele romanesti", async () => {
    await withPreview("/ro/", ({ content }) => {
      const html = content.innerHTML;

      assert.ok(html.includes(roMessages["preview.certificateInfo"]));
      assert.ok(html.includes(roMessages["preview.txid"]));
      assert.ok(html.includes(roMessages["preview.statusVerified"]));
      assert.ok(html.includes(roMessages["preview.network"]));
      assert.ok(html.includes(roMessages["preview.registration"]));
      assert.ok(html.includes(roMessages["preview.copyIsrc"]));
      assert.ok(html.includes(roMessages["preview.copyHash"]));
      assert.ok(html.includes(roMessages["preview.viewInscription"]));
      assert.ok(!html.includes("Certificate Information"));
      assert.ok(!html.includes("Copy Blockchain Hash"));
    });
  });

  it("pe pagina engleza pastreaza exact textele originale", async () => {
    await withPreview("/", ({ content }) => {
      const html = content.innerHTML;

      assert.ok(html.includes("Certificate Information"));
      assert.ok(html.includes("Transaction Hash (TXID)"));
      assert.ok(html.includes("Verified ✓"));
      assert.ok(html.includes("Copy ISRC"));
      assert.ok(html.includes("Copy Blockchain Hash"));
      assert.ok(html.includes("View Blockchain Inscription"));
      assert.ok(html.includes("✓ VERIFIED"));
    });
  });

  it("traducerile sunt inserate in continut, nu in atribute", async () => {
    await withPreview("/ro/", ({ content }) => {
      const html = content.innerHTML;
      const textOnly = html.replace(/="[^"]*"/g, '=""');

      ["preview.certificateInfo", "preview.copyIsrc", "preview.copyHash"].forEach((key) => {
        assert.ok(textOnly.includes(roMessages[key]), `${key} trebuie in continut`);
        assert.ok(!html.includes(`="${roMessages[key]}"`), `${key} nu trebuie in atribut`);
      });
    });
  });

  it("nu modifica structura, clasele si linkurile", async () => {
    await withPreview("/ro/", ({ documentRef, content }) => {
      const html = content.innerHTML;

      assert.ok(html.includes('class="preview-layout"'));
      assert.ok(html.includes('class="preview-cover"'));
      assert.ok(html.includes('class="preview-badge"'));
      assert.ok(html.includes('class="preview-actions"'));
      assert.ok(html.includes('class="meta-row"'));
      assert.ok(html.includes('class="status-ok"'));
      assert.ok(
        html.includes('href="https://whatsonchain.com/tx/5f912728d390f1b9ef352a5316cf2e1f06e3716464e271ed65e28cac9fdc1dbb"')
      );
      assert.ok(html.includes("Test Song"));
      assert.ok(html.includes("GX0000000001"));
      assert.ok(html.includes("Bitcoin SV"));
      assert.equal(documentRef.getElementById("certificate-modal").classList.contains("show"), true);
    });
  });
});

describe("butoanele de copiere", () => {
  it("afiseaza confirmarea si revin la aceeasi cheie (RO)", async () => {
    await withPreview("/ro/", async ({ documentRef, timers }) => {
      const copyHash = documentRef.getElementById("copy-hash");

      copyHash.dispatchEvent("click");
      await flushMicrotasks();

      assert.equal(copyHash.textContent, roMessages["preview.copied"]);
      assert.equal(copyHash.textContent, "Copiat!");
      assert.equal(timers.length, 1, "revenirea este programata");

      timers[0]();

      assert.equal(copyHash.textContent, roMessages["preview.copyHash"]);
      assert.equal(copyHash.textContent, "Copiază hash-ul blockchain");
    });
  });

  it("butonul ISRC revine la eticheta tradusa", async () => {
    await withPreview("/ro/", async ({ documentRef, timers }) => {
      const copyIsrc = documentRef.getElementById("copy-isrc");

      copyIsrc.dispatchEvent("click");
      await flushMicrotasks();

      assert.equal(copyIsrc.textContent, roMessages["preview.copied"]);

      timers[0]();

      assert.equal(copyIsrc.textContent, roMessages["preview.copyIsrc"]);
      assert.equal(copyIsrc.textContent, "Copiază ISRC");
    });
  });

  it("pe pagina engleza etichetele originale sunt pastrate", async () => {
    await withPreview("/", async ({ documentRef, timers, content }) => {
      const copyHash = documentRef.getElementById("copy-hash");

      assert.ok(
        content.innerHTML.includes("Copy Blockchain Hash"),
        "eticheta initiala din continut este cea engleza"
      );

      copyHash.dispatchEvent("click");
      await flushMicrotasks();

      assert.equal(copyHash.textContent, "Copied!");

      timers[0]();

      assert.equal(copyHash.textContent, "Copy Blockchain Hash");
    });
  });

  it("eticheta afisata si cea restaurata folosesc aceeasi cheie", () => {
    assert.equal(roMessages["preview.copyHash"], "Copiază hash-ul blockchain");
    assert.equal(roMessages["preview.copyIsrc"], "Copiază ISRC");
    assert.equal(roMessages["preview.copied"], "Copiat!");
    assert.equal(enMessages["preview.copyHash"], "Copy Blockchain Hash");
    assert.equal(enMessages["preview.copyIsrc"], "Copy ISRC");
    assert.equal(enMessages["preview.copied"], "Copied!");
  });
});

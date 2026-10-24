// =====================================================
// Teste de integrare — js/latest.js si js/carousel.js
// DOM fals, fara retea. Verifica si textele englezesti originale.
// =====================================================

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { loadLatest } from "../js/latest.js";
import { loadCarousel } from "../js/carousel.js";
import { getPageTranslator, resetPageTranslator } from "../js/i18n/runtime.js";
import { messages as enMessages } from "../js/i18n/locales/en.js";
import { messages as roMessages } from "../js/i18n/locales/ro.js";
import { createFakeDocument, createFakeElement, installGlobals } from "./helpers/fake-dom.mjs";

const SONG = Object.freeze({
  id: "test-song",
  title: "Test Song",
  artist: "Test Artist",
  isrc: "GX0000000001",
  cover: "covers/test.webp",
  description: ""
});

const LATEST_IDS = [
  "latest-cover",
  "latest-title",
  "latest-artist",
  "listen-latest",
  "verify-latest",
  "spotify-link",
  "apple-link",
  "youtube-link",
  "amazon-link",
  "deezer-link"
];

beforeEach(() => {
  resetPageTranslator();
});

function usePage(pathname) {
  return getPageTranslator({ pathname });
}

function withGlobals(documentRef, callback) {
  const restore = installGlobals({
    document: documentRef,
    window: { location: { origin: "https://digitalmusicromania.com" } }
  });

  try {
    return callback();
  } finally {
    restore();
  }
}

describe("js/latest.js — descrierea implicita", () => {
  function setup(pathname) {
    usePage(pathname);

    const description = createFakeElement("p");

    const documentRef = createFakeDocument({
      ids: LATEST_IDS,
      selectors: { ".latest-description": description }
    });

    return { documentRef, description };
  }

  it("pe pagina romana foloseste traducerea romaneasca", () => {
    const { documentRef, description } = setup("/ro/");

    withGlobals(documentRef, () => loadLatest({ ...SONG }));

    assert.equal(description.textContent, roMessages["latest.descriptionFallback"]);
    assert.equal(description.textContent, "Lansare oficială certificată pe blockchain.");
  });

  it("pe pagina engleza pastreaza textul englez original", () => {
    const { documentRef, description } = setup("/");

    withGlobals(documentRef, () => loadLatest({ ...SONG }));

    assert.equal(description.textContent, enMessages["latest.descriptionFallback"]);
    assert.equal(description.textContent, "Official Blockchain Certified Release.");
  });

  it("descrierea din data.json nu este tradusa", () => {
    const { documentRef, description } = setup("/ro/");

    withGlobals(documentRef, () => loadLatest({ ...SONG, description: "xxx" }));

    assert.equal(description.textContent, "xxx");
  });

  it("nu modifica titlul, artistul, cover-ul si linkurile", () => {
    const { documentRef } = setup("/ro/");

    withGlobals(documentRef, () => loadLatest({ ...SONG }));

    assert.equal(documentRef.getElementById("latest-title").textContent, "Test Song");
    assert.equal(documentRef.getElementById("latest-artist").textContent, "Test Artist");
    assert.equal(documentRef.getElementById("latest-cover").src, "covers/test.webp");
    assert.equal(
      documentRef.getElementById("verify-latest").href,
      "certificari/?search=GX0000000001"
    );
    assert.equal(
      documentRef.getElementById("listen-latest").href,
      "https://push.fm/fl/GX0000000001"
    );
    assert.equal(
      documentRef.getElementById("spotify-link").href,
      "https://push.fm/fl/GX0000000001"
    );
  });
});

describe("js/carousel.js — butoanele cardurilor", () => {
  function render(pathname) {
    usePage(pathname);

    const carousel = createFakeElement("div");
    const documentRef = createFakeDocument();

    documentRef.register("carousel", carousel);

    withGlobals(documentRef, () => loadCarousel([SONG]));

    const card = carousel.children[0];

    return { card, html: card.innerHTML };
  }

  it("pe pagina romana foloseste etichetele romanesti", () => {
    const { html } = render("/ro/");

    assert.ok(html.includes(roMessages["carousel.certificate"]));
    assert.ok(html.includes(roMessages["carousel.inscription"]));
    assert.ok(!html.includes(">Certificate<"));
  });

  it("pe pagina engleza pastreaza etichetele originale", () => {
    const { html } = render("/");

    assert.ok(html.includes(enMessages["carousel.certificate"]));
    assert.ok(html.includes(enMessages["carousel.inscription"]));
  });

  it("nu modifica structura, clasele si linkurile", () => {
    const { card, html } = render("/ro/");

    assert.equal(card.className, "carousel-card");
    assert.ok(html.includes("carousel-btn gold"));
    assert.ok(html.includes("carousel-btn dark"));
    assert.ok(html.includes('class="carousel-cover"'));
    assert.ok(html.includes('class="carousel-info"'));
    assert.ok(html.includes('class="carousel-buttons"'));
    assert.ok(html.includes('href="certificari/?search=GX0000000001"'));
    assert.ok(html.includes("https://digitalmusicromania.com/i/?song=test-song"));
    assert.ok(html.includes("Test Song"));
    assert.ok(html.includes("Test Artist"));
    assert.ok(html.includes("GX0000000001"));
  });
});

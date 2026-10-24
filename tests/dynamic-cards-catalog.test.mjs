// =====================================================
// Teste de integrare — js/cards.js si js/catalog.js
// Include verificarea contextului real de inserare (text vs atribut).
// =====================================================

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { createCatalogCard, createRegistryCard } from "../js/cards.js";
import { render, setContainer } from "../js/catalog.js";
import { getPageTranslator, resetPageTranslator } from "../js/i18n/runtime.js";
import { messages as enMessages } from "../js/i18n/locales/en.js";
import { messages as roMessages } from "../js/i18n/locales/ro.js";
import { createFakeDocument, createFakeElement, installGlobals } from "./helpers/fake-dom.mjs";

const SONG = Object.freeze({
  id: "test-song",
  title: "Test Song",
  artist: "Test Artist",
  isrc: "GX0000000001",
  upc: "5063958150871",
  cover: "covers/test.webp",
  inscription: "5f912728d390f1b9ef352a5316cf2e1f06e3716464e271ed65e28cac9fdc1dbb",
  description: ""
});

/**
 * Elimina valorile atributelor, ca sa verificam ca un text este
 * inserat in continut si NU intr-un atribut.
 */
function withoutAttributeValues(html) {
  return html.replace(/="[^"]*"/g, '=""');
}

beforeEach(() => {
  resetPageTranslator();
});

function withGlobals(callback) {
  const restore = installGlobals({
    document: createFakeDocument(),
    window: { location: { origin: "https://digitalmusicromania.com" } }
  });

  try {
    return callback();
  } finally {
    restore();
  }
}

describe("js/cards.js — carduri de catalog", () => {
  function catalogCard(pathname) {
    getPageTranslator({ pathname });

    const card = withGlobals(() => createCatalogCard({ ...SONG }));

    return { card, html: card.innerHTML };
  }

  function registryCard(pathname) {
    getPageTranslator({ pathname });

    const card = withGlobals(() => createRegistryCard({ ...SONG }));

    return { card, html: card.innerHTML };
  }

  it("pe pagina romana foloseste etichetele romanesti", () => {
    const { html } = catalogCard("/ro/");

    assert.ok(html.includes(roMessages["cards.viewCertificate"]));
    assert.ok(html.includes(roMessages["cards.network"]));
    assert.ok(html.includes(roMessages["cards.isrc"]));
    assert.ok(!html.includes("Bitcoin SV Blockchain"));
    assert.ok(!html.includes("View Certificate"));
  });

  it("pe pagina engleza pastreaza exact textele originale", () => {
    const { html } = catalogCard("/");

    assert.ok(html.includes("View Certificate →"));
    assert.ok(html.includes("Bitcoin SV Blockchain"));
    assert.ok(html.includes("<span>ISRC</span>"));
  });

  it("cardul de registru foloseste etichetele romanesti", () => {
    const { html } = registryCard("/ro/");

    assert.ok(html.includes(roMessages["cards.openCertificate"]));
    assert.ok(html.includes(roMessages["cards.verified"]));
    assert.ok(!html.includes("Open Certificate"));
    assert.ok(!html.includes("✓ VERIFIED"));
  });

  it("cardul de registru pastreaza textele englezesti", () => {
    const { html } = registryCard("/");

    assert.ok(html.includes("Open Certificate →"));
    assert.ok(html.includes("✓ VERIFIED"));
  });

  it("traducerile sunt inserate in continut, nu in atribute", () => {
    const { html } = catalogCard("/ro/");
    const textOnly = withoutAttributeValues(html);

    ["cards.viewCertificate", "cards.network", "cards.isrc"].forEach((key) => {
      const value = roMessages[key];

      assert.ok(textOnly.includes(value), `${key} trebuie sa fie in continut`);
      assert.ok(!html.includes(`="${value}"`), `${key} nu trebuie folosit ca atribut`);
    });
  });

  it("nu modifica structura, clasele si linkurile", () => {
    const { card, html } = catalogCard("/ro/");

    assert.equal(card.className, "registry-card");
    assert.ok(html.includes('class="registry-cover"'));
    assert.ok(html.includes('class="registry-content"'));
    assert.ok(html.includes('class="registry-artist"'));
    assert.ok(html.includes('class="registry-isrc"'));
    assert.ok(html.includes('class="registry-footer"'));
    assert.ok(html.includes('class="registry-network"'));
    assert.ok(html.includes('class="registry-open"'));
    assert.ok(html.includes('href="certificari/?search=GX0000000001"'));
    assert.ok(html.includes("covers/test.webp"));
    assert.ok(html.includes("Test Song"));
    assert.ok(html.includes("GX0000000001"));
  });

  it("cardul de registru pastreaza clasa compusa", () => {
    const { card } = registryCard("/ro/");

    assert.equal(card.className, "registry-card registry-single");
  });
});

describe("js/catalog.js — mesajul de rezultat gol", () => {
  function renderEmpty(pathname) {
    getPageTranslator({ pathname });

    const container = createFakeElement("div");

    setContainer(container);

    withGlobals(() => render([]));

    return container.innerHTML;
  }

  it("pe pagina romana foloseste mesajele romanesti", () => {
    const html = renderEmpty("/ro/");

    assert.ok(html.includes(roMessages["catalog.emptyTitle"]));
    assert.ok(html.includes(roMessages["catalog.emptyMessage"]));
    assert.ok(!html.includes("No Blockchain Record Found"));
  });

  it("pe pagina engleza pastreaza mesajele originale", () => {
    const html = renderEmpty("/");

    assert.ok(html.includes("No Blockchain Record Found"));
    assert.ok(html.includes("No music certificate matches your search."));
  });

  it("mesajele sunt inserate in continut, nu in atribute", () => {
    const html = renderEmpty("/ro/");
    const textOnly = withoutAttributeValues(html);

    assert.ok(textOnly.includes(roMessages["catalog.emptyTitle"]));
    assert.ok(textOnly.includes(roMessages["catalog.emptyMessage"]));
    assert.ok(!html.includes(`="${roMessages["catalog.emptyTitle"]}"`));
  });

  it("structura si clasele rezultatului gol sunt neschimbate", () => {
    const html = renderEmpty("/ro/");

    assert.ok(html.includes('class="no-results"'));
    assert.ok(html.includes("<h2>"));
    assert.ok(html.includes("<p>"));
  });

  it("un singur rezultat foloseste cardul de registru", () => {
    getPageTranslator({ pathname: "/ro/" });

    const container = createFakeElement("div");

    setContainer(container);

    withGlobals(() => render([{ ...SONG }]));

    assert.equal(container.classList.contains("single-result"), true);
    assert.equal(container.children.length, 1);
    assert.equal(container.children[0].className, "registry-card registry-single");
    assert.ok(container.children[0].innerHTML.includes(roMessages["cards.openCertificate"]));
  });

  it("textul englezesc rămâne neschimbat pe pagina engleza", () => {
    assert.equal(enMessages["catalog.emptyTitle"], "No Blockchain Record Found");
    assert.equal(
      enMessages["catalog.emptyMessage"],
      "No music certificate matches your search."
    );
  });
});

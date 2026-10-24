// =====================================================
// Teste — structura paginilor de registru (/registry.html si /ro/registru/)
// Verificari statice pe fisiere. Fara DOM extern, fara retea.
// =====================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const BASE = "https://digitalmusicromania.com";
const EN_URL = `${BASE}/registry.html`;
const RO_URL = `${BASE}/ro/registru/`;

async function readPage(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

function htmlLang(html) {
  const match = /<html\s+lang="([^"]+)"/.exec(html);
  return match ? match[1] : null;
}

function canonical(html) {
  const match = /<link\s+rel="canonical"\s+href="([^"]+)"/.exec(html);
  return match ? match[1] : null;
}

function hreflangs(html) {
  const map = {};
  const pattern = /<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"/g;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    map[match[1]] = match[2];
  }

  return map;
}

function ids(html) {
  const found = new Set();
  const pattern = /\sid="([^"]+)"/g;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    found.add(match[1]);
  }

  return found;
}

function sortOptions(html) {
  return [...html.matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)].map((match) => ({
    value: match[1],
    label: match[2]
  }));
}

const enPage = await readPage("registry.html");
const roPage = await readPage("ro/registru/index.html");

describe("registry.html (englezesc)", () => {
  it("declara limba engleza", () => {
    assert.equal(htmlLang(enPage), "en");
  });

  it("are canonical si hreflang reciproc", () => {
    const alternates = hreflangs(enPage);

    assert.equal(canonical(enPage), EN_URL);
    assert.equal(alternates.en, EN_URL);
    assert.equal(alternates.ro, RO_URL);
    assert.equal(alternates["x-default"], EN_URL);
  });

  it("contine selectorul de limba cu engleza activa", () => {
    assert.match(enPage, /data-lang-switcher/);
    assert.match(enPage, /data-lang-option="ro"[\s\S]*?href="\/ro\/registru\/"/);
    assert.match(enPage, /data-lang-option="en"[\s\S]*?aria-current="true"/);
  });

  it("incarca stilurile si modulul de limba", () => {
    assert.match(enPage, /href="css\/i18n\.css"/);
    assert.match(enPage, /src="js\/registry\.js"/);
    assert.match(enPage, /src="js\/i18n\/page\.js"/);
  });

  it("pastreaza textele si structura originale", () => {
    assert.match(enPage, /← Back to Home/);
    assert.match(enPage, /Official Digital Music Romania Blockchain Archive/);
    assert.match(enPage, /Registered Releases/);
    assert.match(enPage, /placeholder="Search by Title, Artist, ISRC or Inscription"/);
    assert.match(enPage, /<label for="sort-select">Sort by<\/label>/);
    assert.match(enPage, /href="index.html"/);
  });
});

describe("ro/registru/ (romanesc)", () => {
  it("declara limba romana", () => {
    assert.equal(htmlLang(roPage), "ro");
  });

  it("are canonical propriu si hreflang reciproc", () => {
    const alternates = hreflangs(roPage);

    assert.equal(canonical(roPage), RO_URL);
    assert.equal(alternates.ro, RO_URL);
    assert.equal(alternates.en, EN_URL);
    assert.equal(alternates["x-default"], EN_URL);
  });

  it("hreflang este reciproc intre cele doua pagini", () => {
    assert.equal(hreflangs(enPage).ro, canonical(roPage));
    assert.equal(hreflangs(roPage).en, canonical(enPage));
  });

  it("foloseste <base href='/'> pentru ca modulele existente sa functioneze", () => {
    assert.match(roPage, /<base href="\/">/);
  });

  it("foloseste doar cai absolute pentru resurse", () => {
    assert.match(roPage, /href="\/style\.css"/);
    assert.match(roPage, /href="\/css\/i18n\.css"/);
    assert.match(roPage, /href="\/favicon\.ico"/);
    assert.match(roPage, /src="\/js\/registry\.js"/);
    assert.match(roPage, /src="\/js\/i18n\/page\.js"/);

    const relative = /(?:href|src)="(?!\/|https?:|#|mailto:)([^"]+)"/g;
    const offenders = [];
    let match;

    while ((match = relative.exec(roPage)) !== null) {
      offenders.push(match[1]);
    }

    assert.deepEqual(offenders, [], "nu exista cai relative in pagina romana");
  });

  it("contine selectorul de limba cu romana activa", () => {
    assert.match(roPage, /data-lang-switcher/);
    assert.match(roPage, /data-lang-option="ro"[\s\S]*?aria-current="true"/);
    assert.match(roPage, /data-lang-option="en"[\s\S]*?href="\/registry\.html"/);
  });

  it("are exact aceleasi elemente cerute de module", () => {
    assert.deepEqual([...ids(roPage)].sort(), [...ids(enPage)].sort());
  });

  it("pastreaza valorile logicii de sortare si schimba doar etichetele", () => {
    const enOptions = sortOptions(enPage);
    const roOptions = sortOptions(roPage);

    assert.deepEqual(
      roOptions.map((option) => option.value),
      enOptions.map((option) => option.value)
    );

    assert.deepEqual(
      roOptions.map((option) => option.value),
      ["newest", "oldest", "title-asc", "title-desc", "artist-asc", "artist-desc"]
    );

    assert.notEqual(roOptions[0].label, enOptions[0].label);
    assert.equal(roOptions[0].label, "Cele mai noi");
  });

  it("continutul este tradus, fara texte engleze rămase", () => {
    assert.match(roPage, /Registru Blockchain/);
    assert.match(roPage, /Lansări înregistrate/);
    assert.match(roPage, /Caută după titlu, artist, ISRC sau inscripție/);
    assert.match(roPage, /<label for="sort-select">Sortează după<\/label>/);

    const leftovers = [
      "Back to Home",
      "Blockchain Registry",
      "Official Digital Music Romania Blockchain Archive",
      "Registered Releases",
      "Sort by",
      "Newest Releases",
      "Oldest Releases",
      "Search by Title"
    ];

    leftovers.forEach((text) => {
      assert.ok(!roPage.includes(text), `text englez rămas in pagina romana: ${text}`);
    });
  });
});

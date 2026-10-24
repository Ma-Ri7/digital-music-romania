// =====================================================
// Teste — structura paginilor / (EN) si /ro/ (RO)
// Verificari statice pe fisierele HTML. Fara DOM extern.
// =====================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const BASE = "https://digitalmusicromania.com";

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

const enPage = await readPage("index.html");
const roPage = await readPage("ro/index.html");

describe("pagina engleza /", () => {
  it("declara limba engleza", () => {
    assert.equal(htmlLang(enPage), "en");
  });

  it("are canonical catre propria adresa", () => {
    assert.equal(canonical(enPage), `${BASE}/`);
  });

  it("declara hreflang reciproc si x-default", () => {
    const alternates = hreflangs(enPage);

    assert.equal(alternates.en, `${BASE}/`);
    assert.equal(alternates.ro, `${BASE}/ro/`);
    assert.equal(alternates["x-default"], `${BASE}/`);
  });

  it("contine selectorul de limba cu ambele optiuni", () => {
    assert.match(enPage, /data-lang-switcher/);
    assert.match(enPage, /data-lang-option="ro"[\s\S]*?href="\/ro\/"/);
    assert.match(enPage, /data-lang-option="en"/);
    assert.match(enPage, /aria-current="true"/);
  });

  it("incarca stilurile si modulul de limba", () => {
    assert.match(enPage, /href="css\/i18n\.css"/);
    assert.match(enPage, /src="js\/i18n\/page\.js"/);
  });

  it("pastreaza titlul, descrierea si legatura catre registru", () => {
    assert.match(enPage, /<title>Digital Music Romania \| Blockchain Music Registry<\/title>/);
    assert.match(enPage, /name="description"/);
    assert.match(enPage, /href="registry.html"/);
  });
});

describe("pagina romana /ro/", () => {
  it("declara limba romana", () => {
    assert.equal(htmlLang(roPage), "ro");
  });

  it("are canonical catre propria adresa", () => {
    assert.equal(canonical(roPage), `${BASE}/ro/`);
  });

  it("declara hreflang reciproc si x-default", () => {
    const alternates = hreflangs(roPage);

    assert.equal(alternates.ro, `${BASE}/ro/`);
    assert.equal(alternates.en, `${BASE}/`);
    assert.equal(alternates["x-default"], `${BASE}/`);
  });

  it("foloseste <base href='/'> pentru ca modulele existente sa functioneze", () => {
    assert.match(roPage, /<base href="\/">/);
  });

  it("foloseste doar cai absolute pentru resurse", () => {
    assert.match(roPage, /href="\/style\.css"/);
    assert.match(roPage, /href="\/css\/i18n\.css"/);
    assert.match(roPage, /href="\/favicon\.ico"/);
    assert.match(roPage, /src="\/js\/app\.js"/);
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
    assert.match(roPage, /data-lang-option="en"[\s\S]*?href="\/"/);
  });

  it("navigheaza in pagina cu ancore absolute /ro/#...", () => {
    assert.match(roPage, /href="\/ro\/#hero"/);
    assert.match(roPage, /href="\/ro\/#about"/);
    assert.match(roPage, /href="\/ro\/#footer"/);
    assert.doesNotMatch(roPage, /href="#/, "ancorele relative s-ar rezolva gresit cu <base>");
  });
});

describe("echivalenta reala intre cele doua pagini", () => {
  it("pagina romana contine toate elementele cerute de modulele JS existente", () => {
    const required = [
      "hero-image",
      "hero-song",
      "hero-artist",
      "latest-cover",
      "latest-title",
      "latest-artist",
      "latest-description",
      "spotify-link",
      "apple-link",
      "youtube-link",
      "amazon-link",
      "deezer-link",
      "listen-latest",
      "verify-latest",
      "totalSongs",
      "totalArtists",
      "carousel",
      "songs-container",
      "loader",
      "certificate-modal",
      "certificate-close",
      "certificate-content",
      "back-to-top",
      "menuToggle",
      "mainMenu"
    ];

    const roIds = ids(roPage);

    required.forEach((id) => {
      assert.ok(roIds.has(id), `pagina romana nu are #${id}`);
    });
  });

  it("ambele pagini au aceleasi sectiuni", () => {
    const sections = ["hero", "latest", "about", "recommended", "catalog", "footer"];

    sections.forEach((id) => {
      assert.ok(ids(enPage).has(id), `pagina engleza nu are #${id}`);
      assert.ok(ids(roPage).has(id), `pagina romana nu are #${id}`);
    });
  });

  it("hreflang este reciproc intre pagini", () => {
    assert.equal(hreflangs(enPage).ro, canonical(roPage));
    assert.equal(hreflangs(roPage).en, canonical(enPage));
  });

  it("continutul romanesc este tradus, fara texte engleze rămase", () => {
    assert.match(roPage, /Registru Muzical Blockchain/);
    assert.match(roPage, /Ultima lansare/);
    assert.match(roPage, /Lansări recomandate/);
    assert.match(roPage, /Melodii certificate/);
    assert.match(roPage, /Vezi registrul complet/);

    const leftovers = [
      "Latest Release",
      "NEW RELEASE",
      "Recommended Releases",
      "Certified Songs",
      "Available On",
      "View Complete Registry",
      "Listen Now",
      "Loading registry",
      "Blockchain Music Registry",
      "Music.<br>"
    ];

    leftovers.forEach((text) => {
      assert.ok(!roPage.includes(text), `text englez rămas in pagina romana: ${text}`);
    });
  });

  it("nu s-a modificat designul: aceleasi fisiere CSS de baza", () => {
    assert.match(enPage, /href="style\.css"/);
    assert.match(roPage, /href="\/style\.css"/);
    assert.match(enPage, /src="js\/app\.js"/);
    assert.match(roPage, /src="\/js\/app\.js"/);
  });
});

// =====================================================
// Teste — sitemap.xml bilingv
// Fara dependinte noi: doar citire de fisiere si expresii regulate.
// =====================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const BASE = "https://digitalmusicromania.com";
const ROOT = new URL("../", import.meta.url);

const xml = await readFile(new URL("sitemap.xml", ROOT), "utf8");
const dataJson = JSON.parse(await readFile(new URL("data.json", ROOT), "utf8"));

/** ISRC-urile aprobate pentru adaugare in Etapa 6.2 (P4). */
const ADDED_ISRCS = [
  "GXHZK2613770",
  "GXHZK2635137",
  "GXHZK2641715",
  "GXHZK2658345",
  "GXHZK2659817",
  "GXHZK2661751",
  "GXHZK2662965",
  "GXHZK2675986",
  "GXHZK2677883",
  "GXHZK2686311",
  "GXHZK2695860",
  "GXHZK2696133"
];

function urlBlocks(source) {
  return [...source.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1]);
}

function locs(source) {
  return [...source.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function alternates(block) {
  return [...block.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\/>/g)].map(
    (match) => ({ hreflang: match[1], href: match[2] })
  );
}

function blockFor(source, loc) {
  return urlBlocks(source).find((block) => block.includes(`<loc>${loc}</loc>`)) || null;
}

function pathToFile(path) {
  const clean = path.split("?")[0];

  if (clean === "/") return "index.html";
  if (clean.endsWith("/")) return `${clean.slice(1)}index.html`;

  return clean.slice(1);
}

async function pageHreflangs(relativePath) {
  const html = await readFile(new URL(relativePath, ROOT), "utf8");
  const map = {};
  const pattern = /<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"/g;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    map[match[1]] = match[2];
  }

  return map;
}

const blocks = urlBlocks(xml);
const allLocs = locs(xml);

describe("sitemap.xml — structura si sintaxa", () => {
  it("incepe cu declaratia XML si declara ambele namespace-uri", () => {
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.match(xml, /<urlset\s+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
    assert.match(xml, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
  });

  it("are taguri <url> echilibrate", () => {
    const open = (xml.match(/<url>/g) || []).length;
    const close = (xml.match(/<\/url>/g) || []).length;

    assert.equal(open, close);
    assert.equal(open, blocks.length);
    assert.ok(xml.trimEnd().endsWith("</urlset>"));
  });

  it("nu contine date lastmod inventate", () => {
    assert.ok(!xml.includes("<lastmod>"));
  });

  it("fiecare <loc> foloseste https pe domeniul corect", () => {
    allLocs.forEach((loc) => {
      assert.ok(loc.startsWith(`${BASE}/`), `URL neasteptat: ${loc}`);
    });

    assert.ok(!xml.includes("<loc>http://"));
  });

  it("toate elementele <loc> sunt unice", () => {
    assert.equal(new Set(allLocs).size, allLocs.length);

    const duplicates = allLocs.filter((loc, index) => allLocs.indexOf(loc) !== index);

    assert.deepEqual(duplicates, [], "nu exista URL-uri duplicate");
  });
});

describe("sitemap.xml — pagini declarate", () => {
  it("declara toate paginile existente in ambele limbi", () => {
    [`${BASE}/`, `${BASE}/ro/`, `${BASE}/registry.html`, `${BASE}/ro/registru/`].forEach((loc) => {
      assert.ok(allLocs.includes(loc), `lipseste ${loc}`);
    });
  });

  it("fiecare URL nou corespunde unui fisier real", () => {
    [`${BASE}/ro/`, `${BASE}/ro/registru/`].forEach((loc) => {
      const file = pathToFile(loc.replace(BASE, ""));

      assert.ok(existsSync(new URL(file, ROOT)), `nu exista fisierul ${file}`);
    });
  });

  it("toate paginile non-certificari corespund unor fisiere reale", () => {
    allLocs
      .filter((loc) => !loc.includes("/certificari/"))
      .forEach((loc) => {
        const file = pathToFile(loc.replace(BASE, ""));

        assert.ok(existsSync(new URL(file, ROOT)), `nu exista fisierul ${file} (${loc})`);
      });
  });

  it("pastreaza toate paginile de certificat distincte", () => {
    const certificari = allLocs.filter((loc) => loc.includes("/certificari/?search="));

    assert.equal(certificari.length, 132);
    assert.equal(new Set(certificari).size, 132);
    assert.ok(allLocs.includes(`${BASE}/certificari/?search=GX5MX2504700`));
  });

  it("nu mai declara cele trei URL-uri soft-404 (P3)", () => {
    ["GX4R52604134", "GX4R52611732", "GX4R52634960"].forEach((isrc) => {
      const loc = `${BASE}/certificari/?search=${isrc}`;

      assert.ok(!allLocs.includes(loc), `${isrc} nu trebuie sa fie in sitemap`);
    });
  });

  it("declara toate cele 12 ISRC-uri aprobate (P4)", () => {
    ADDED_ISRCS.forEach((isrc) => {
      assert.ok(
        allLocs.includes(`${BASE}/certificari/?search=${isrc}`),
        `lipseste ${isrc}`
      );
    });
  });

  it("fiecare ISRC nou exista in data.json si este neambiguu", () => {
    const songs = dataJson.songs;

    ADDED_ISRCS.forEach((isrc) => {
      const matches = songs.filter(
        (song) => song.isrc.trim().toLowerCase() === isrc.toLowerCase()
      );

      assert.equal(matches.length, 1, `${isrc} trebuie sa existe exact o data in data.json`);
      assert.ok(matches[0].id, `${isrc} trebuie sa aiba id pentru pagina /i/`);
      assert.ok(matches[0].blockchain_url, `${isrc} trebuie sa aiba blockchain_url`);
    });
  });

  it("fiecare URL de certificat din sitemap este rezolvabil in data.json", () => {
    const known = new Set(dataJson.songs.map((song) => song.isrc.trim().toLowerCase()));

    allLocs
      .filter((loc) => loc.includes("/certificari/?search="))
      .forEach((loc) => {
        const isrc = loc.split("search=")[1].toLowerCase();

        assert.ok(known.has(isrc), `nu exista in data.json: ${isrc}`);
      });
  });

  it("unul dintre URL-urile anterior duplicate rămâne declarat o singura data", () => {
    const deduplicated = [
      "GX3HH2697552",
      "GX3HH2603551",
      "GXF972516899",
      "GXF972504104",
      "GX8LE2549689",
      "GX8LD2587619",
      "GXBDT2529856",
      "GXBDT2542493",
      "GX8LE2603472",
      "GX8LD2594384"
    ];

    deduplicated.forEach((isrc) => {
      const loc = `${BASE}/certificari/?search=${isrc}`;

      assert.equal(allLocs.filter((value) => value === loc).length, 1, `${isrc} trebuie exact o data`);
    });
  });

  it("intrarile noi respecta conventia existenta", () => {
    [`${BASE}/ro/`, `${BASE}/ro/registru/`].forEach((loc) => {
      const block = blockFor(xml, loc);

      assert.ok(block, `lipseste blocul pentru ${loc}`);
      assert.ok(block.includes("<changefreq>weekly</changefreq>"));
      assert.ok(block.includes("<priority>0.8</priority>"));
    });
  });

  it("nu declara /index.html (duplicat necanonic al lui /)", () => {
    assert.ok(!allLocs.includes(`${BASE}/index.html`));
  });

  it("/ rămâne declarat si isi pastreaza alternantele", () => {
    const block = blockFor(xml, `${BASE}/`);

    assert.ok(block, "pagina principala trebuie sa rămâna in sitemap");
    assert.equal(alternates(block).length, 3);
  });
});

describe("sitemap.xml — hreflang", () => {
  const clusters = [
    {
      loc: `${BASE}/`,
      expected: { en: `${BASE}/`, ro: `${BASE}/ro/`, "x-default": `${BASE}/` }
    },
    {
      loc: `${BASE}/ro/`,
      expected: { ro: `${BASE}/ro/`, en: `${BASE}/`, "x-default": `${BASE}/` }
    },
    {
      loc: `${BASE}/registry.html`,
      expected: {
        en: `${BASE}/registry.html`,
        ro: `${BASE}/ro/registru/`,
        "x-default": `${BASE}/registry.html`
      }
    },
    {
      loc: `${BASE}/ro/registru/`,
      expected: {
        ro: `${BASE}/ro/registru/`,
        en: `${BASE}/registry.html`,
        "x-default": `${BASE}/registry.html`
      }
    }
  ];

  clusters.forEach((cluster) => {
    it(`${cluster.loc} declara en, ro si x-default`, () => {
      const block = blockFor(xml, cluster.loc);
      const map = {};

      alternates(block).forEach((entry) => {
        map[entry.hreflang] = entry.href;
      });

      assert.deepEqual(map, cluster.expected);
    });
  });

  it("relatiile sunt reciproce in interiorul sitemap-ului", () => {
    clusters.forEach((cluster) => {
      alternates(blockFor(xml, cluster.loc)).forEach((entry) => {
        const targetBlock = blockFor(xml, entry.href);

        assert.ok(targetBlock, `nu exista bloc pentru ${entry.href}`);

        const targetAlternates = alternates(targetBlock);
        const hasBackLink = targetAlternates.some(
          (back) => back.hreflang === cluster.loc.split("/").pop() || back.href === cluster.loc
        );

        assert.ok(
          targetAlternates.some((back) => back.href === cluster.loc),
          `${entry.href} nu trimite inapoi la ${cluster.loc}`
        );
        assert.ok(hasBackLink);
      });
    });
  });

  it("fiecare clasa are exact 3 alternante si niciuna in plus", () => {
    const withAlternates = blocks.filter((block) => alternates(block).length > 0);

    assert.equal(withAlternates.length, 4);
    withAlternates.forEach((block) => {
      assert.equal(alternates(block).length, 3);
    });
  });

  it("paginile din certificari nu declara alternante lingvistice", () => {
    blocks
      .filter((block) => block.includes("/certificari/"))
      .forEach((block) => {
        assert.deepEqual(alternates(block), []);
      });
  });
});

describe("sitemap.xml — coerenta cu paginile reale", () => {
  const pages = [
    { loc: `${BASE}/`, file: "index.html" },
    { loc: `${BASE}/ro/`, file: "ro/index.html" },
    { loc: `${BASE}/registry.html`, file: "registry.html" },
    { loc: `${BASE}/ro/registru/`, file: "ro/registru/index.html" }
  ];

  pages.forEach((page) => {
    it(`alternantele din sitemap pentru ${page.loc} coincid cu pagina`, async () => {
      const fromPage = await pageHreflangs(page.file);
      const fromSitemap = {};

      alternates(blockFor(xml, page.loc)).forEach((entry) => {
        fromSitemap[entry.hreflang] = entry.href;
      });

      assert.deepEqual(fromSitemap, fromPage);
    });
  });
});

// =====================================================
// Teste — pagina intermediara /i/ si limba paginii /certificari/
// Testul de redirect evalueaza scriptul REAL din i/index.html,
// intr-un sandbox, fara browser si fara retea.
// =====================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

import { flushMicrotasks } from "./helpers/fake-dom.mjs";

const ROOT = new URL("../", import.meta.url);

const iPage = await readFile(new URL("i/index.html", ROOT), "utf8");
const certificariPage = await readFile(new URL("certificari/index.html", ROOT), "utf8");
const certificateJs = await readFile(new URL("certificari/certificate.js", ROOT), "utf8");
const carouselJs = await readFile(new URL("js/carousel.js", ROOT), "utf8");
const cardsJs = await readFile(new URL("js/cards.js", ROOT), "utf8");
const latestJs = await readFile(new URL("js/latest.js", ROOT), "utf8");
const sitemap = await readFile(new URL("sitemap.xml", ROOT), "utf8");

function extractInlineScript(html) {
  const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);

  return blocks.find((block) => block.includes("URLSearchParams")) || "";
}

const redirectScript = extractInlineScript(iPage);

/**
 * Ruleaza scriptul de redirect din pagina reala intr-un sandbox controlat.
 */
async function runRedirect({ search, songs = [], failFetch = false }) {
  const replaced = [];
  const timers = [];
  const fetched = [];
  const elements = {
    ".status": { textContent: "" },
    ".message": { textContent: "" }
  };

  const sandbox = {
    URLSearchParams,
    window: {
      location: {
        search,
        replace: (url) => replaced.push(url)
      }
    },
    document: {
      querySelector: (selector) => elements[selector] || null
    },
    fetch: async (url) => {
      fetched.push(url);

      if (failFetch) throw new TypeError("offline");

      return { json: async () => ({ songs }) };
    },
    setTimeout: (callback, delay) => {
      timers.push({ callback, delay });
      return timers.length;
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(redirectScript, sandbox);

  await flushMicrotasks(20);

  return { replaced, timers, fetched, elements };
}

describe("i/index.html — directiva noindex", () => {
  it("declara noindex, follow in head", () => {
    assert.match(iPage, /<meta name="robots" content="noindex, follow">/);

    const head = iPage.split("</head>")[0];

    assert.ok(head.includes('content="noindex, follow"'), "directiva trebuie sa fie in head");
  });

  it("nu este inclusa in sitemap", () => {
    assert.ok(!sitemap.includes("/i/"));
  });
});

describe("i/index.html — fluxul de redirect rămâne neschimbat", () => {
  it("citeste parametrul song si incarca ../data.json", async () => {
    const { fetched } = await runRedirect({
      search: "?song=alpha",
      songs: [{ id: "alpha", blockchain_url: "https://example.test/alpha" }]
    });

    assert.deepEqual(fetched, ["../data.json"]);
    assert.match(iPage, /params\.get\("song"\)/);
  });

  it("redirectioneaza catre blockchain_url dupa 700 ms", async () => {
    const { replaced, timers } = await runRedirect({
      search: "?song=alpha",
      songs: [{ id: "alpha", blockchain_url: "https://ordinals.gorillapool.io/content/abc" }]
    });

    assert.equal(timers.length, 1);
    assert.equal(timers[0].delay, 700, "temporizarea de 700 ms este neschimbata");
    assert.deepEqual(replaced, [], "nu redirectioneaza inainte de expirarea temporizarii");

    timers[0].callback();

    assert.deepEqual(replaced, ["https://ordinals.gorillapool.io/content/abc"]);
  });

  it("foloseste window.location.replace, nu assign", () => {
    assert.match(iPage, /window\.location\.replace\(song\.blockchain_url\)/);
  });

  it("afiseaza mesajul de negasit pentru un song inexistent", async () => {
    const { replaced, timers, elements } = await runRedirect({
      search: "?song=nu-exista",
      songs: [{ id: "alpha", blockchain_url: "https://example.test/alpha" }]
    });

    assert.deepEqual(replaced, []);
    assert.equal(timers.length, 0);
    assert.equal(elements[".status"].textContent, "Song not found");
    assert.equal(elements[".message"].textContent, "The requested release could not be found.");
  });

  it("afiseaza eroarea de conexiune cand fetch eșueaza", async () => {
    const { elements } = await runRedirect({ search: "?song=alpha", failFetch: true });

    assert.equal(elements[".status"].textContent, "Connection Error");
    assert.equal(elements[".message"].textContent, "Unable to load release information.");
  });

  it("nu are canonical sau hreflang (nu este o pagina de continut)", () => {
    assert.ok(!iPage.includes('rel="canonical"'));
    assert.ok(!iPage.includes("hreflang"));
  });
});

describe("formatul URL-urilor din codurile QR rămâne neschimbat", () => {
  it("certificari/certificate.js genereaza /i/?song=<id>", () => {
    assert.match(
      certificateJs,
      /window\.location\.origin \+ "\/i\/\?song=" \+ encodeURIComponent\(song\.id\)/
    );
    assert.match(certificateJs, /href="\$\{window\.location\.origin\}\/i\/\?song=/);
  });

  it("js/carousel.js foloseste acelasi format", () => {
    assert.match(carouselJs, /href="\$\{window\.location\.origin\}\/i\/\?song=\$\{encodeURIComponent\(song\.id\)\}"/);
  });

  it("linkurile catre certificate rămân /certificari/?search=<ISRC>", () => {
    [cardsJs, latestJs, carouselJs].forEach((source) => {
      assert.match(source, /certificari\/\?search=/);
    });

    assert.ok(!iPage.includes("/certificari/"), "pagina /i/ nu trimite spre /certificari/");
  });
});

describe("certificari/index.html — limba documentului", () => {
  it("declara engleza (limba predominanta a continutului)", () => {
    assert.match(certificariPage, /<html lang="en">/);
    assert.ok(!certificariPage.includes('<html lang="ro">'));
  });

  it("nu i s-a adaugat canonical sau hreflang generic", () => {
    assert.ok(!certificariPage.includes('rel="canonical"'));
    assert.ok(!certificariPage.includes("hreflang"));
  });

  it("nu i s-a adaugat noindex (paginile de certificat trebuie sa rămâna indexabile)", () => {
    assert.ok(!certificariPage.includes('name="robots"'));
  });

  it("isi pastreaza resursele si scriptul propriu", () => {
    assert.match(certificariPage, /href="style\.css"/);
    assert.match(certificariPage, /src="certificate\.js"/);
  });
});

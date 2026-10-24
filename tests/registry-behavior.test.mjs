// =====================================================
// Teste de comportament — registrul (cautare, filtre, sortare, randare)
// Ruleaza pe ambele limbi, cu DOM fals. Fara retea.
// =====================================================

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { render, setContainer } from "../js/catalog.js";
import { initSearch } from "../js/registry-search.js";
import { initSort } from "../js/registry-sort.js";
import { updateStats } from "../js/registry-stats.js";
import { setSongs } from "../js/registry-store.js";
import { getPageTranslator, resetPageTranslator } from "../js/i18n/runtime.js";
import { messages as enMessages } from "../js/i18n/locales/en.js";
import { messages as roMessages } from "../js/i18n/locales/ro.js";
import { createFakeDocument, installGlobals } from "./helpers/fake-dom.mjs";

const BASE = "https://digitalmusicromania.com";

const SONGS = Object.freeze([
  Object.freeze({
    id: "alpha",
    title: "Alpha Song",
    artist: "Zeta Artist",
    isrc: "GX0000000001",
    upc: "1",
    cover: "covers/alpha.webp",
    inscription: "aaaa1111aaaa1111",
    description: ""
  }),
  Object.freeze({
    id: "beta",
    title: "Beta Song",
    artist: "Alpha Artist",
    isrc: "GX0000000002",
    upc: "2",
    cover: "covers/beta.webp",
    inscription: "bbbb2222bbbb2222",
    description: ""
  }),
  Object.freeze({
    id: "gamma",
    title: "Gamma Song",
    artist: "Mu Artist",
    isrc: "GX0000000003",
    upc: "3",
    cover: "covers/gamma.webp",
    inscription: "cccc3333cccc3333",
    description: ""
  })
]);

const REGISTRY_IDS = [
  "registry-search",
  "sort-select",
  "visible-results",
  "total-releases",
  "total-artists",
  "songs-container"
];

beforeEach(() => {
  resetPageTranslator();
});

/**
 * Pregateste registrul exact ca registry.js, intr-un document fals.
 */
function run(pathname, callback) {
  getPageTranslator({ pathname });

  const documentRef = createFakeDocument({ ids: REGISTRY_IDS });
  const container = documentRef.getElementById("songs-container");
  const searchInput = documentRef.getElementById("registry-search");
  const sortSelect = documentRef.getElementById("sort-select");

  const restore = installGlobals({
    document: documentRef,
    window: { location: { origin: BASE } }
  });

  try {
    setContainer(container);
    setSongs(SONGS);
    updateStats(SONGS);
    render(SONGS);
    initSearch(SONGS);
    initSort();

    return callback({ documentRef, container, searchInput, sortSelect });
  } finally {
    restore();
  }
}

function search(searchInput, value) {
  searchInput.value = value;
  searchInput.dispatchEvent("input");
}

function sort(sortSelect, value) {
  sortSelect.value = value;
  sortSelect.dispatchEvent("change");
}

function titles(container) {
  return container.children.map((child) => {
    const match = /<h3>([^<]+)<\/h3>/.exec(child.innerHTML);
    return match ? match[1] : null;
  });
}

describe("registru — randare initiala", () => {
  it("afiseaza toate lansarile", () => {
    run("/registry.html", ({ container, documentRef }) => {
      assert.equal(container.children.length, 3);
      assert.equal(documentRef.getElementById("total-releases").textContent, 3);
      assert.equal(documentRef.getElementById("total-artists").textContent, 3);
      assert.equal(documentRef.getElementById("visible-results").textContent, 3);
    });
  });

  it("fiecare card duce la certificatul corect", () => {
    run("/registry.html", ({ container }) => {
      assert.ok(container.children[0].innerHTML.includes('href="certificari/?search=GX0000000001"'));
    });
  });
});

describe("registru — cautare", () => {
  it("filtreaza dupa titlu", () => {
    run("/registry.html", ({ container, searchInput, documentRef }) => {
      search(searchInput, "Alpha Song");

      assert.equal(container.children.length, 1);
      assert.equal(container.children[0].className, "registry-card registry-single");
      assert.equal(documentRef.getElementById("visible-results").textContent, 1);
      assert.equal(documentRef.getElementById("total-releases").textContent, 3);
    });
  });

  it("filtreaza pe toate campurile (titlu + artist)", () => {
    run("/registry.html", ({ container, searchInput }) => {
      // "Alpha" apare in titlul unei melodii si in numele artistului alteia
      search(searchInput, "Alpha");

      assert.deepEqual(titles(container), ["Alpha Song", "Beta Song"]);
    });
  });

  it("filtreaza dupa artist", () => {
    run("/registry.html", ({ container, searchInput }) => {
      search(searchInput, "Mu Artist");

      assert.deepEqual(titles(container), ["Gamma Song"]);
    });
  });

  it("filtreaza dupa ISRC", () => {
    run("/registry.html", ({ container, searchInput }) => {
      search(searchInput, "GX0000000002");

      assert.deepEqual(titles(container), ["Beta Song"]);
    });
  });

  it("filtreaza dupa inscripție", () => {
    run("/registry.html", ({ container, searchInput }) => {
      search(searchInput, "cccc3333");

      assert.deepEqual(titles(container), ["Gamma Song"]);
    });
  });

  it("ignora majusculele si spatiile", () => {
    run("/registry.html", ({ container, searchInput }) => {
      search(searchInput, "   alpha song   ");

      assert.deepEqual(titles(container), ["Alpha Song"]);
    });
  });

  it("golirea cautarii readuce toate rezultatele", () => {
    run("/registry.html", ({ container, searchInput, documentRef }) => {
      search(searchInput, "Zeta");
      assert.equal(container.children.length, 1);

      search(searchInput, "");

      assert.equal(container.children.length, 3);
      assert.equal(documentRef.getElementById("visible-results").textContent, 3);
    });
  });

  it("mesajul de rezultat gol este tradus pe pagina romana", () => {
    run("/ro/registru/", ({ container, searchInput }) => {
      search(searchInput, "nu-exista");

      assert.equal(container.children.length, 0);
      assert.ok(container.innerHTML.includes(roMessages["catalog.emptyTitle"]));
      assert.ok(container.innerHTML.includes(roMessages["catalog.emptyMessage"]));
      assert.ok(!container.innerHTML.includes("No Blockchain Record Found"));
    });
  });

  it("mesajul de rezultat gol este cel englezesc pe pagina engleza", () => {
    run("/registry.html", ({ container, searchInput }) => {
      search(searchInput, "nu-exista");

      assert.ok(container.innerHTML.includes(enMessages["catalog.emptyTitle"]));
    });
  });
});

describe("registru — sortare", () => {
  it("titlu A–Z si Z–A", () => {
    run("/registry.html", ({ container, sortSelect }) => {
      sort(sortSelect, "title-asc");
      assert.deepEqual(titles(container), ["Alpha Song", "Beta Song", "Gamma Song"]);

      sort(sortSelect, "title-desc");
      assert.deepEqual(titles(container), ["Gamma Song", "Beta Song", "Alpha Song"]);
    });
  });

  it("artist A–Z si Z–A", () => {
    run("/registry.html", ({ container, sortSelect }) => {
      sort(sortSelect, "artist-asc");
      assert.deepEqual(titles(container), ["Beta Song", "Gamma Song", "Alpha Song"]);

      sort(sortSelect, "artist-desc");
      assert.deepEqual(titles(container), ["Alpha Song", "Gamma Song", "Beta Song"]);
    });
  });

  it("sortarea respecta filtrul activ", () => {
    run("/registry.html", ({ container, searchInput, sortSelect }) => {
      search(searchInput, "Song");
      sort(sortSelect, "title-desc");

      assert.deepEqual(titles(container), ["Gamma Song", "Beta Song", "Alpha Song"]);
    });
  });

  it("sortarea functioneaza identic pe pagina romana", () => {
    run("/ro/registru/", ({ container, sortSelect }) => {
      sort(sortSelect, "title-asc");

      assert.deepEqual(titles(container), ["Alpha Song", "Beta Song", "Gamma Song"]);
    });
  });
});

describe("registru — etichetele cardurilor", () => {
  it("pe pagina romana sunt traduse", () => {
    run("/ro/registru/", ({ container }) => {
      const html = container.children[0].innerHTML;

      assert.ok(html.includes(roMessages["cards.viewCertificate"]));
      assert.ok(html.includes(roMessages["cards.network"]));
      assert.ok(!html.includes("View Certificate"));
    });
  });

  it("pe pagina engleza sunt cele originale", () => {
    run("/registry.html", ({ container }) => {
      const html = container.children[0].innerHTML;

      assert.ok(html.includes("View Certificate →"));
      assert.ok(html.includes("Bitcoin SV Blockchain"));
    });
  });
});

// =====================================================
// Teste — protectia navigarii (A3.1) si accesibilitatea propunerii
// Fara DOM real, fara retea.
// =====================================================

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { startPageLanguage, watchUserNavigation } from "../js/i18n/page.js";
import { createSuggestionBanner } from "../js/i18n/lang-switcher.js";
import { resetPageTranslator, getPageTranslator } from "../js/i18n/runtime.js";
import { createFakeStorage, createFakeLocation } from "./helpers/fakes.mjs";
import {
  createFakeDocument,
  createFakeElement,
  flushMicrotasks
} from "./helpers/fake-dom.mjs";

beforeEach(() => {
  resetPageTranslator();
});

function createLangSwitcher() {
  const ro = createFakeElement("a");
  ro.setAttribute("data-lang-option", "ro");
  ro.setAttribute("href", "/ro/");

  const en = createFakeElement("a");
  en.setAttribute("data-lang-option", "en");
  en.setAttribute("href", "/");

  const container = createFakeElement("div");
  container.setAttribute("data-lang-switcher", "");

  container.querySelector = (selector) => {
    const match = /^\[data-lang-option="([^"]+)"\]$/.exec(selector);

    if (!match) return null;
    if (match[1] === "ro") return ro;
    if (match[1] === "en") return en;

    return null;
  };

  return { container, ro, en };
}

function link(href) {
  const element = createFakeElement("a");
  element.setAttribute("href", href);
  return element;
}

/**
 * Porneste pagina cu o cerere geo care nu se termina inca.
 */
async function startWithPendingGeo() {
  let release;
  const documentRef = createFakeDocument();
  const { container, ro, en } = createLangSwitcher();

  documentRef.querySelector = (selector) =>
    selector === "[data-lang-switcher]" ? container : null;

  const locationRef = createFakeLocation("/");
  const storage = createFakeStorage();
  const sessionStorage = createFakeStorage();

  const promise = startPageLanguage({
    pathname: "/",
    storage,
    sessionStorage,
    document: documentRef,
    location: locationRef,
    resolver: {
      detect: () =>
        new Promise((resolve) => {
          release = resolve;
        })
    }
  });

  await flushMicrotasks(1);

  return { promise, release, documentRef, locationRef, storage, sessionStorage, container, ro, en };
}

describe("watchUserNavigation", () => {
  it("marcheaza navigarea la click pe un link cu href", () => {
    const documentRef = createFakeDocument();
    const state = watchUserNavigation(documentRef);

    assert.equal(state.started, false);

    documentRef.dispatchEvent({ type: "click", target: link("/registry.html") });

    assert.equal(state.started, true);
  });

  it("ignora click-urile care nu sunt pe linkuri", () => {
    const documentRef = createFakeDocument();
    const state = watchUserNavigation(documentRef);

    documentRef.dispatchEvent({ type: "click", target: createFakeElement("div") });

    assert.equal(state.started, false);
  });

  it("ignora ancorele din interiorul documentului", () => {
    const documentRef = createFakeDocument();
    const state = watchUserNavigation(documentRef);

    documentRef.dispatchEvent({ type: "click", target: link("#hero") });

    assert.equal(state.started, false);
  });

  it("tolereaza documente fara addEventListener", () => {
    assert.deepEqual(watchUserNavigation(null), { started: false });
    assert.deepEqual(watchUserNavigation({}), { started: false });
  });
});

describe("click in timpul cererii geo", () => {
  it("link intern: redirectarea automata intarziata este suprimata", async () => {
    const context = await startWithPendingGeo();

    context.documentRef.dispatchEvent({ type: "click", target: link("/registry.html") });

    context.release("RO");

    const outcome = await context.promise;

    assert.equal(outcome.result.navigation.action, "navigate", "planul exista");
    assert.deepEqual(context.locationRef.replaced, [], "dar nu se executa");
    assert.equal(outcome.navigated, false);
    assert.equal(outcome.suppressed, true);
  });

  it("link extern: redirectarea automata este suprimata", async () => {
    const context = await startWithPendingGeo();

    context.documentRef.dispatchEvent({
      type: "click",
      target: link("https://open.spotify.com/artist/5AreayId9gVRUpJ8jeHRYP")
    });

    context.release("RO");

    const outcome = await context.promise;

    assert.deepEqual(context.locationRef.replaced, []);
    assert.equal(outcome.suppressed, true);
  });

  it("selectorul RO | EN: preferinta este salvata si redirectarea suprimata", async () => {
    const context = await startWithPendingGeo();

    context.documentRef.dispatchEvent({ type: "click", target: context.en });

    context.release("RO");

    const outcome = await context.promise;

    assert.equal(context.storage.dump()["dmr.lang"], "en", "preferinta este salvata");
    assert.equal(outcome.result.language, "en");
    assert.equal(outcome.result.source, "preference");
    assert.deepEqual(context.locationRef.replaced, [], "nu se navigheaza peste alegere");
    assert.equal(outcome.suppressed, true);
  });

  it("selectorul RO | EN pe pagina romaneasca: alegerea EN este respectata", async () => {
    const documentRef = createFakeDocument();
    const { container, en } = createLangSwitcher();

    documentRef.querySelector = (selector) =>
      selector === "[data-lang-switcher]" ? container : null;

    const locationRef = createFakeLocation("/ro/");
    const storage = createFakeStorage();

    const promise = startPageLanguage({
      pathname: "/ro/",
      storage,
      sessionStorage: createFakeStorage(),
      document: documentRef,
      location: locationRef,
      resolver: { detect: async () => "DE" }
    });

    documentRef.dispatchEvent({ type: "click", target: en });

    await promise;

    assert.equal(storage.dump()["dmr.lang"], "en");
    assert.deepEqual(locationRef.replaced, [], "URL-ul explicit nu este schimbat de selector");
  });

  it("rezultat geo sosit dupa initierea navigarii nu produce redirectare", async () => {
    const context = await startWithPendingGeo();

    context.documentRef.dispatchEvent({ type: "click", target: link("/ro/") });

    await flushMicrotasks(2);
    context.release("RO");

    const outcome = await context.promise;

    assert.deepEqual(context.locationRef.replaced, []);
    assert.equal(outcome.suppressed, true);
  });
});

describe("absenta navigarilor suplimentare nedorite", () => {
  it("fara interactiune, navigarea automata are loc exact o data", async () => {
    const context = await startWithPendingGeo();

    context.release("RO");

    const outcome = await context.promise;

    assert.deepEqual(context.locationRef.replaced, ["/ro/"]);
    assert.equal(outcome.navigated, true);
    assert.equal(outcome.suppressed, false);
  });

  it("click pe o ancora interna nu blocheaza navigarea automata", async () => {
    const context = await startWithPendingGeo();

    context.documentRef.dispatchEvent({ type: "click", target: link("#hero") });

    context.release("RO");

    const outcome = await context.promise;

    assert.deepEqual(context.locationRef.replaced, ["/ro/"]);
    assert.equal(outcome.suppressed, false);
  });

  it("cand limba paginii coincide, nu se navigheaza deloc", async () => {
    const context = await startWithPendingGeo();

    context.release("DE");

    const outcome = await context.promise;

    assert.deepEqual(context.locationRef.replaced, []);
    assert.equal(outcome.navigated, false);
    assert.equal(outcome.suppressed, false);
  });
});

describe("accesibilitatea propunerii de limba", () => {
  it("propunerea este anuntata fara a muta focusul", () => {
    const documentRef = createFakeDocument();
    const service = { t: (key) => getPageTranslator().t(key) };

    const banner = createSuggestionBanner(documentRef, service, "/ro/", {
      language: "ro"
    });

    assert.equal(banner.element.getAttribute("aria-live"), "polite");
    assert.equal(banner.element.getAttribute("aria-atomic"), "true");
    assert.equal(banner.element.getAttribute("role"), "region");
    assert.ok(banner.element.getAttribute("aria-label"));
    assert.equal(banner.dismiss.getAttribute("type"), "button");
  });

  it("propunerea are texte traduse si buton de inchidere", () => {
    const documentRef = createFakeDocument();
    const service = { t: (key) => getPageTranslator().t(key) };

    const banner = createSuggestionBanner(documentRef, service, "/ro/");

    assert.equal(banner.text.textContent.length > 0, true);
    assert.equal(banner.action.getAttribute("href"), "/ro/");
    assert.equal(banner.dismiss.textContent.length > 0, true);
  });
});

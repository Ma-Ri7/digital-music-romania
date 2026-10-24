// =====================================================
// Test helpers — fara dependinte externe
// Nu se executa ca test (nu respecta pattern-ul *.test.mjs).
// =====================================================

/**
 * Storage fals in memorie, cu contor de operatiuni.
 */
export function createFakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  const stats = { reads: 0, writes: 0, removes: 0 };

  return {
    getItem(key) {
      stats.reads += 1;
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      stats.writes += 1;
      data.set(key, String(value));
    },
    removeItem(key) {
      stats.removes += 1;
      data.delete(key);
    },
    clear() {
      data.clear();
    },
    get stats() {
      return { ...stats };
    },
    dump() {
      return Object.fromEntries(data);
    }
  };
}

/**
 * Storage care arunca la orice operatiune (mod privat / storage blocat).
 */
export function createFailingStorage() {
  const fail = () => {
    throw new Error("storage indisponibil");
  };

  return {
    getItem: fail,
    setItem: fail,
    removeItem: fail,
    clear: fail
  };
}

/**
 * Raspuns HTTP fals.
 */
export function jsonResponse(payload, init = {}) {
  return {
    ok: init.ok !== undefined ? init.ok : true,
    status: init.status !== undefined ? init.status : 200,
    json: async () => payload
  };
}

/**
 * Raspuns cu JSON invalid.
 */
export function invalidJsonResponse(init = {}) {
  return {
    ok: init.ok !== undefined ? init.ok : true,
    status: init.status !== undefined ? init.status : 200,
    json: async () => {
      throw new SyntaxError("JSON invalid");
    }
  };
}

/**
 * fetch fals care inregistreaza apelurile.
 */
export function createFakeFetch(handler) {
  const calls = [];

  const impl = async (url, options = {}) => {
    calls.push({ url, options });
    return handler(url, options, calls.length);
  };

  impl.calls = calls;

  return impl;
}

/**
 * fetch fals care nu raspunde niciodata, dar respecta abort-ul.
 */
export function createHangingFetch() {
  const calls = [];

  const impl = (url, options = {}) => {
    calls.push({ url, options });

    return new Promise((resolve, reject) => {
      if (options && options.signal) {
        if (options.signal.aborted) {
          reject(abortError());
          return;
        }

        options.signal.addEventListener("abort", () => reject(abortError()));
      }
    });
  };

  impl.calls = calls;

  return impl;
}

function abortError() {
  const error = new Error("abortat");
  error.name = "AbortError";
  return error;
}

/**
 * Element fals cu atribute, textContent, evenimente si copii.
 */
export function createFakeElement(attributes = {}) {
  const attrs = { ...attributes };
  const listeners = new Map();

  const element = {
    textContent: "",
    className: "",
    tagName: "",
    children: [],
    parentNode: null,
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null;
    },
    setAttribute(name, value) {
      attrs[name] = value;
    },
    removeAttribute(name) {
      delete attrs[name];
    },
    hasAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attrs, name);
    },
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    removeEventListener(type, handler) {
      const handlers = listeners.get(type);
      if (!handlers) return;

      const index = handlers.indexOf(handler);
      if (index >= 0) handlers.splice(index, 1);
    },
    dispatchEvent(type) {
      const handlers = listeners.get(type) || [];

      handlers.forEach((handler) => handler({ type }));

      return handlers.length > 0;
    },
    appendChild(child) {
      child.parentNode = element;
      element.children.push(child);
      return child;
    },
    remove() {
      if (!element.parentNode) return;

      const index = element.parentNode.children.indexOf(element);

      if (index >= 0) element.parentNode.children.splice(index, 1);

      element.parentNode = null;
    },
    getAttributes() {
      return { ...attrs };
    },
    get listenerTypes() {
      return [...listeners.keys()];
    }
  };

  return element;
}

/**
 * Container fals pentru selectorul de limba.
 * Raspunde la querySelector('[data-lang-option="ro"]') etc.
 */
export function createFakeLangContainer(languages = ["ro", "en"]) {
  const links = new Map();

  languages.forEach((language) => {
    links.set(language, createFakeElement({ "data-lang-option": language }));
  });

  const container = createFakeElement({ "data-lang-switcher": "" });

  container.querySelector = (selector) => {
    const match = /^\[data-lang-option="([^"]+)"\]$/.exec(selector);
    if (!match) return null;
    return links.get(match[1]) || null;
  };

  return { container, links };
}

/**
 * Document fals minimal, cu body, createElement si querySelector.
 */
export function createFakeDomDocument(selectors = {}) {
  const body = createFakeElement();
  const created = [];

  return {
    documentElement: { lang: "", dir: "" },
    body,
    createElement(tagName) {
      const element = createFakeElement();
      element.tagName = tagName;
      created.push(element);
      return element;
    },
    querySelector(selector) {
      return Object.prototype.hasOwnProperty.call(selectors, selector)
        ? selectors[selector]
        : null;
    },
    querySelectorAll: () => [],
    get created() {
      return created;
    }
  };
}

/**
 * location fals care inregistreaza navigarile.
 */
export function createFakeLocation(pathname = "/") {
  const replaced = [];

  return {
    pathname,
    replace(url) {
      replaced.push(url);
    },
    get replaced() {
      return [...replaced];
    }
  };
}

/**
 * Radacina falsa pentru applyTranslations().
 */
export function createFakeRoot(selectorMap = {}) {
  const queried = [];

  return {
    querySelectorAll(selector) {
      queried.push(selector);
      return selectorMap[selector] || [];
    },
    get queried() {
      return [...queried];
    }
  };
}

/**
 * document fals minimal (doar documentElement).
 */
export function createFakeDocument() {
  return {
    documentElement: { lang: "", dir: "" },
    querySelectorAll: () => []
  };
}

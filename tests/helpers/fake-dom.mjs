// =====================================================
// Test helpers — DOM fals minimal, fara dependinte externe
//
// Suficient pentru modulele care randeaza continut dinamic:
// createElement, getElementById, querySelector, evenimente,
// classList, atribute, appendChild.
// =====================================================

export function createFakeClassList() {
  const names = new Set();

  return {
    add: (...values) => values.forEach((value) => names.add(value)),
    remove: (...values) => values.forEach((value) => names.delete(value)),
    contains: (value) => names.has(value),
    toggle: (value) => {
      if (names.has(value)) {
        names.delete(value);
        return false;
      }

      names.add(value);
      return true;
    },
    get value() {
      return [...names].join(" ");
    }
  };
}

/**
 * Potrivire minimala pentru selectorii folositi in teste:
 * "a", "a[href]", "[data-lang-option]".
 */
function matchesSelector(node, selector) {
  if (!node || typeof node.hasAttribute !== "function") return false;

  const attributeOnly = /^\[([^\]=]+)\]$/.exec(selector);

  if (attributeOnly) return node.hasAttribute(attributeOnly[1]);

  const tagWithAttribute = /^([a-zA-Z]+)\[([^\]=]+)\]$/.exec(selector);

  if (tagWithAttribute) {
    return (
      node.tagName === tagWithAttribute[1].toUpperCase() &&
      node.hasAttribute(tagWithAttribute[2])
    );
  }

  return node.tagName === String(selector).toUpperCase();
}

export function createFakeElement(tagName = "div") {
  const attributes = new Map();
  const listeners = new Map();

  const element = {
    tagName: String(tagName).toUpperCase(),
    textContent: "",
    className: "",
    children: [],
    parentNode: null,
    style: {},
    classList: createFakeClassList(),

    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    hasAttribute(name) {
      return attributes.has(name);
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
    dispatchEvent(event) {
      const type = event && event.type ? event.type : event;
      const handlers = listeners.get(type) || [];
      const payload = typeof event === "string" ? { type } : event;

      handlers.forEach((handler) => handler(payload));

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
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    closest(selector) {
      let node = element;

      while (node) {
        if (matchesSelector(node, selector)) return node;

        node = node.parentNode;
      }

      return null;
    },
    get attributes() {
      return Object.fromEntries(attributes);
    },
    get listenerTypes() {
      return [...listeners.keys()];
    }
  };

  // innerHTML gol goleste copiii, ca intr-un DOM real.
  let html = "";

  Object.defineProperty(element, "innerHTML", {
    configurable: true,
    get() {
      return html;
    },
    set(value) {
      html = String(value);

      if (html === "") element.children = [];
    }
  });

  return element;
}

/**
 * Document fals cu registru de id-uri si selectori.
 */
export function createFakeDocument(options = {}) {
  const ids = new Map();
  const selectors = new Map(Object.entries(options.selectors || {}));
  const listeners = new Map();

  (options.ids || []).forEach((id) => {
    ids.set(id, createFakeElement());
  });

  const documentRef = {
    documentElement: createFakeElement("html"),
    body: createFakeElement("body"),

    createElement(tagName) {
      return createFakeElement(tagName);
    },
    getElementById(id) {
      return ids.get(id) || null;
    },
    querySelector(selector) {
      return selectors.get(selector) || null;
    },
    querySelectorAll() {
      return [];
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
    dispatchEvent(event) {
      const type = event && event.type ? event.type : event;
      const handlers = listeners.get(type) || [];
      const payload = typeof event === "string" ? { type } : event;

      handlers.forEach((handler) => handler(payload));

      return handlers.length > 0;
    },
    register(id, element) {
      ids.set(id, element || createFakeElement());
      return ids.get(id);
    },
    get listenerTypes() {
      return [...listeners.keys()];
    }
  };

  return documentRef;
}

/**
 * Instaleaza globals pentru modulele care folosesc `document`/`window`.
 * Returneaza functia de restaurare.
 */
export function installGlobals(globals = {}) {
  const previous = new Map();
  const names = ["document", "window", "navigator", "fetch", "setTimeout"];

  names.forEach((name) => {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  });

  names.forEach((name) => {
    if (Object.prototype.hasOwnProperty.call(globals, name)) {
      Object.defineProperty(globalThis, name, {
        value: globals[name],
        configurable: true,
        writable: true
      });
    }
  });

  return function restore() {
    names.forEach((name) => {
      const descriptor = previous.get(name);

      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor);
      } else {
        delete globalThis[name];
      }
    });
  };
}

/**
 * Asteapta microtask-urile (pentru handlere async fara timere reale).
 */
export async function flushMicrotasks(times = 6) {
  for (let index = 0; index < times; index += 1) {
    await Promise.resolve();
  }
}

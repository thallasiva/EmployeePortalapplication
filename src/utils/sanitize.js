












let purify = null;
try {


  purify = require("dompurify");
  if (purify.default) purify = purify.default;
} catch {
  purify = null;
}


const ALLOWED_TAGS = new Set([
"p", "br", "b", "i", "u", "strong", "em", "span", "div", "ul", "ol", "li",
"h1", "h2", "h3", "h4", "h5", "h6", "a", "table", "thead", "tbody", "tr", "th", "td",
"blockquote", "pre", "code", "hr", "small", "mark"]
);
const ALLOWED_ATTRS = new Set(["href", "title", "class", "id", "target", "rel"]);
const SAFE_PROTOCOLS = /^(https?|mailto):/i;

function fallbackSanitize(dirty) {
  const doc = new DOMParser().parseFromString(dirty, "text/html");

  function clean(node) {
    const toRemove = [];
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const tag = child.tagName.toLowerCase();
        if (!ALLOWED_TAGS.has(tag)) {
          toRemove.push(child);
          return;
        }

        Array.from(child.attributes).forEach((attr) => {
          if (!ALLOWED_ATTRS.has(attr.name)) {
            child.removeAttribute(attr.name);
          } else if (attr.name === "href" && !SAFE_PROTOCOLS.test(attr.value)) {
            child.removeAttribute("href");
          }
        });

        if (tag === "a") {
          child.setAttribute("rel", "noopener noreferrer");
          if (!child.hasAttribute("target")) child.setAttribute("target", "_blank");
        }
        clean(child);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        toRemove.push(child);
      }
    });
    toRemove.forEach((n) => n.parentNode?.removeChild(n));
  }

  clean(doc.body);
  return doc.body.innerHTML;
}







export function sanitize(dirty, opts = {}) {
  if (!dirty) return "";
  if (purify) {
    return purify.sanitize(dirty, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "style"],
      ...opts
    });
  }
  return fallbackSanitize(String(dirty));
}





export function safeHtml(dirty, opts) {
  return { __html: sanitize(dirty, opts) };
}


export function stripHtml(dirty) {
  if (!dirty) return "";
  const doc = new DOMParser().parseFromString(dirty, "text/html");
  return doc.body.textContent || "";
}





export function escapeHtml(value) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
  return String(value ?? '').replace(/[&<>"']/g, (c) => map[c]);
}






export function suppressConsoleLogs() {
  if (process.env.NODE_ENV === 'production') {
    const noop = () => {};

    window.console.log = noop;
    window.console.debug = noop;
    window.console.info = noop;


  }
}

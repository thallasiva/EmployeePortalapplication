/**
 * Safe HTML sanitisation
 * ──────────────────────
 * Never pass raw server/user content to dangerouslySetInnerHTML without
 * running it through this first. Uses DOMPurify when available (install with
 * `npm install dompurify`); falls back to a strict built-in allowlist parser.
 *
 * Risks of dangerouslySetInnerHTML without sanitisation:
 *  • XSS: attacker injects <script> or onerror= attributes
 *  • DOM clobbering: malicious elements shadow built-in browser APIs
 *  • Prototype pollution via attribute injection
 */

let purify = null;
try {
  // DOMPurify is loaded lazily so the app boots even without the package
  // eslint-disable-next-line
  purify = require("dompurify");
  if (purify.default) purify = purify.default;
} catch {
  purify = null;
}

/** Allowed tags and attributes for the built-in fallback */
const ALLOWED_TAGS = new Set([
  "p","br","b","i","u","strong","em","span","div","ul","ol","li",
  "h1","h2","h3","h4","h5","h6","a","table","thead","tbody","tr","th","td",
  "blockquote","pre","code","hr","small","mark",
]);
const ALLOWED_ATTRS = new Set(["href","title","class","id","target","rel"]);
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
        // Remove disallowed attributes
        Array.from(child.attributes).forEach((attr) => {
          if (!ALLOWED_ATTRS.has(attr.name)) {
            child.removeAttribute(attr.name);
          } else if (attr.name === "href" && !SAFE_PROTOCOLS.test(attr.value)) {
            child.removeAttribute("href");
          }
        });
        // Force external links to be safe
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

/**
 * Returns a sanitised HTML string safe for use in dangerouslySetInnerHTML.
 * @param {string} dirty - Raw HTML from server or user input
 * @param {object} [opts] - DOMPurify options (ignored for fallback)
 * @returns {string} Clean HTML
 */
export function sanitize(dirty, opts = {}) {
  if (!dirty) return "";
  if (purify) {
    return purify.sanitize(dirty, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ["script","style","iframe","object","embed","form","input"],
      FORBID_ATTR: ["onerror","onload","onclick","onmouseover","onfocus","style"],
      ...opts,
    });
  }
  return fallbackSanitize(String(dirty));
}

/**
 * Returns the __html object expected by dangerouslySetInnerHTML.
 * Usage: <div dangerouslySetInnerHTML={safeHtml(content)} />
 */
export function safeHtml(dirty, opts) {
  return { __html: sanitize(dirty, opts) };
}

/** Strip ALL HTML — returns plain text only */
export function stripHtml(dirty) {
  if (!dirty) return "";
  const doc = new DOMParser().parseFromString(dirty, "text/html");
  return doc.body.textContent || "";
}

/**
 * Escapes HTML special characters for safe text interpolation
 * outside of JSX (e.g., email templates, CSV exports).
 */
export function escapeHtml(value) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
  return String(value ?? '').replace(/[&<>"']/g, (c) => map[c]);
}

/**
 * Suppresses non-error console output in production builds to prevent
 * sensitive data (tokens, salary figures, etc.) from leaking via DevTools.
 * Call once at app entry point (index.js).
 */
export function suppressConsoleLogs() {
  if (process.env.NODE_ENV === 'production') {
    const noop = () => {};
    /* eslint-disable no-console */
    window.console.log   = noop;
    window.console.debug = noop;
    window.console.info  = noop;
    // console.warn and console.error preserved for real production issues
    /* eslint-enable no-console */
  }
}

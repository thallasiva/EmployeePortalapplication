/**
 * Blocks outbound fetch/XHR to external URLs in the browser.
 * API layer uses static mocks only — this catches any leftover calls.
 */

const isExternal = (url) => {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("data:") || url.startsWith("blob:")) return false;
  if (url.startsWith("/") && !url.startsWith("//")) return false;
  if (url.startsWith(window.location.origin)) return false;
  return /^https?:\/\//i.test(url);
};

if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = function blockedFetch(input, init) {
    const url = typeof input === "string" ? input : input?.url;
    if (isExternal(url)) {
      console.warn("[NAT IT] Blocked fetch:", url);
      return Promise.reject(new Error("Network disabled — use static data only"));
    }
    return originalFetch.call(this, input, init);
  };

  const XHR = window.XMLHttpRequest;
  const open = XHR.prototype.open;
  XHR.prototype.open = function blockedOpen(method, url, ...rest) {
    if (isExternal(url)) {
      console.warn("[NAT IT] Blocked XHR:", method, url);
      throw new Error("Network disabled — use static data only");
    }
    return open.call(this, method, url, ...rest);
  };
}

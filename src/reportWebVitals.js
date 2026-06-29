/**
 * reportWebVitals — Web Vitals forwarding
 * ─────────────────────────────────────────
 * Called from index.js. Sends Core Web Vitals to:
 *  • PerformanceMonitor component (Sentry + console) — primary path
 *  • This function remains for CRA compatibility and custom callbacks
 */
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && typeof onPerfEntry === "function") {
    import("web-vitals").then(({ getCLS, getFID, getFCP, getLCP, getTTFB, getINP }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);   // kept for older browsers
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
      getINP?.(onPerfEntry); // INP replaces FID in newer spec
    });
  }
};

export default reportWebVitals;

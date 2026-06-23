/**
 * PerformanceMonitor
 * ───────────────────
 * Collects Core Web Vitals (LCP, FID/INP, CLS, FCP, TTFB) and sends them to:
 *  • Sentry (if configured)
 *  • Browser console in development
 *  • Optional custom analytics endpoint
 *
 * Mount once at app root — renders nothing to the DOM.
 *
 * Thresholds (Google "Good" tier):
 *  LCP  < 2.5s   Largest Contentful Paint
 *  INP  < 200ms  Interaction to Next Paint
 *  CLS  < 0.1    Cumulative Layout Shift
 *  FCP  < 1.8s   First Contentful Paint
 *  TTFB < 800ms  Time to First Byte
 */
import { memo, useEffect } from "react";

const THRESHOLDS = {
  LCP:  { good: 2500, poor: 4000 },
  INP:  { good: 200,  poor: 500  },
  CLS:  { good: 0.1,  poor: 0.25 },
  FCP:  { good: 1800, poor: 3000 },
  TTFB: { good: 800,  poor: 1800 },
  FID:  { good: 100,  poor: 300  },
};

function getRating(name, value) {
  const t = THRESHOLDS[name];
  if (!t) return "unknown";
  return value <= t.good ? "good" : value <= t.poor ? "needs-improvement" : "poor";
}

function reportToSentry(metric) {
  try {
    // dynamic import so Sentry is optional
    import("@sentry/react").then((Sentry) => {
      Sentry.setMeasurement(metric.name, metric.value, metric.name === "CLS" ? "" : "millisecond");
    }).catch(() => {});
  } catch {}
}

const COLORS = { good: "color:#22c55e", "needs-improvement": "color:#f59e0b", poor: "color:#ef4444" };

const PerformanceMonitor = memo(function PerformanceMonitor({ analyticsEndpoint }) {
  useEffect(() => {
    let isMounted = true;

    import("web-vitals").then(({ onCLS, onFCP, onLCP, onTTFB, onINP, onFID }) => {
      const handlers = [onCLS, onFCP, onLCP, onTTFB, onINP, onFID].filter(Boolean);

      handlers.forEach((on) => {
        on((metric) => {
          if (!isMounted) return;

          const rating = getRating(metric.name, metric.value);
          const display = metric.name === "CLS"
            ? metric.value.toFixed(4)
            : `${Math.round(metric.value)}ms`;

          if (process.env.NODE_ENV !== "production") {
            console.log(
              `%c[Web Vital] ${metric.name}: ${display} (${rating})`,
              COLORS[rating] ?? ""
            );
          }

          // Send to Sentry
          reportToSentry(metric);

          // Send to custom analytics endpoint if provided
          if (analyticsEndpoint) {
            const body = JSON.stringify({
              name:   metric.name,
              value:  metric.value,
              rating,
              id:     metric.id,
              page:   window.location.pathname,
              ts:     Date.now(),
            });
            // Use sendBeacon so it doesn't block page unload
            if (navigator.sendBeacon) {
              navigator.sendBeacon(analyticsEndpoint, body);
            } else {
              fetch(analyticsEndpoint, { method: "POST", body, keepalive: true }).catch(() => {});
            }
          }
        });
      });
    }).catch(() => {
      console.warn("[PerformanceMonitor] web-vitals not available");
    });

    return () => { isMounted = false; };
  }, [analyticsEndpoint]);

  return null; // renders nothing
});

export default PerformanceMonitor;

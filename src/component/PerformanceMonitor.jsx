
















import { memo, useEffect } from "react";

const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  FID: { good: 100, poor: 300 }
};

function getRating(name, value) {
  const t = THRESHOLDS[name];
  if (!t) return "unknown";
  return value <= t.good ? "good" : value <= t.poor ? "needs-improvement" : "poor";
}

function reportToSentry(metric) {
  try {

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
          const display = metric.name === "CLS" ?
          metric.value.toFixed(4) :
          `${Math.round(metric.value)}ms`;

          if (process.env.NODE_ENV !== "production") {
            console.log(
              `%c[Web Vital] ${metric.name}: ${display} (${rating})`,
              COLORS[rating] ?? ""
            );
          }


          reportToSentry(metric);


          if (analyticsEndpoint) {
            const body = JSON.stringify({
              name: metric.name,
              value: metric.value,
              rating,
              id: metric.id,
              page: window.location.pathname,
              ts: Date.now()
            });

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

    return () => {isMounted = false;};
  }, [analyticsEndpoint]);

  return null;
});

export default PerformanceMonitor;

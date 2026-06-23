/**
 * Sentry initialisation
 * ─────────────────────
 * Run: npm install @sentry/react
 * Set REACT_APP_SENTRY_DSN in your .env file.
 *
 * What this enables
 *  • Automatic JavaScript error capture
 *  • React component stack in error reports
 *  • Browser performance tracing (LCP, FID, CLS via web-vitals)
 *  • Session replay (1 % of sessions sampled)
 */
let Sentry = null;

export async function initSentry() {
  const dsn = process.env.REACT_APP_SENTRY_DSN;
  if (!dsn) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[Sentry] REACT_APP_SENTRY_DSN not set — skipping init");
    }
    return;
  }

  try {
    Sentry = await import("@sentry/react");
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      release:     process.env.REACT_APP_VERSION || "hrms@1.0.0",

      // Capture 100 % of errors; 20 % of page-load traces in production
      tracesSampleRate:       process.env.NODE_ENV === "production" ? 0.2 : 1.0,
      // Replay 1 % of sessions; 100 % of sessions with an error
      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 1.0,

      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
      ],

      // Don't send errors from local development
      beforeSend(event) {
        if (process.env.NODE_ENV === "development") return null;
        return event;
      },
    });
    console.info("[Sentry] Initialized ✓");
  } catch {
    console.warn("[Sentry] @sentry/react not installed — run: npm install @sentry/react");
  }
}

/** Manually capture an error (e.g. from a catch block) */
export function captureError(error, context = {}) {
  if (Sentry) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error("[captureError]", error, context);
  }
}

/** Set the currently logged-in user so Sentry scopes errors to them */
export function setSentryUser(user) {
  if (!Sentry) return;
  if (user) {
    Sentry.setUser({ id: user.userId, email: user.email, role: user.roleName });
  } else {
    Sentry.setUser(null);
  }
}

/** Wrap a React component with a Sentry error boundary */
export function withSentryErrorBoundary(Component, fallback) {
  if (!Sentry) return Component;
  return Sentry.withErrorBoundary(Component, { fallback });
}

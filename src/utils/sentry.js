











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
      release: process.env.REACT_APP_VERSION || "hrms@1.0.0",


      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 1.0,

      integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],



      beforeSend(event) {
        if (process.env.NODE_ENV === "development") return null;
        return event;
      }
    });
    console.info("[Sentry] Initialized ✓");
  } catch {
    console.warn("[Sentry] @sentry/react not installed — run: npm install @sentry/react");
  }
}


export function captureError(error, context = {}) {
  if (Sentry) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error("[captureError]", error, context);
  }
}


export function setSentryUser(user) {
  if (!Sentry) return;
  if (user) {
    Sentry.setUser({ id: user.userId, email: user.email, role: user.roleName });
  } else {
    Sentry.setUser(null);
  }
}


export function withSentryErrorBoundary(Component, fallback) {
  if (!Sentry) return Component;
  return Sentry.withErrorBoundary(Component, { fallback });
}

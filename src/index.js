import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";

import { initSentry } from "./utils/sentry";
import { suppressConsoleLogs } from "./utils/sanitize";
import ErrorBoundary from "./component/ErrorBoundary";
import PerformanceMonitor from "./component/PerformanceMonitor";

// Suppress console.log/debug/info in production to prevent accidental
// leakage of salary figures, tokens, or PII through browser DevTools.
suppressConsoleLogs();

// Initialise Sentry before rendering so the first render is already traced.
// Set REACT_APP_SENTRY_DSN in your .env to activate.
initSentry();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Global error boundary — catches errors that escape all page boundaries */}
    <ErrorBoundary>
      <BrowserRouter>
        {/* Collects LCP, CLS, FCP, TTFB, INP and sends to Sentry + console */}
        <PerformanceMonitor />
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

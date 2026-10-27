import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import App from "./App";
import ErrorBoundary from "./component/ErrorBoundary";
import PerformanceMonitor from "./component/PerformanceMonitor";
import { AuthProvider } from "./context/AuthContext";
import { initSentry } from "./utils/sentry";
import { suppressConsoleLogs } from "./utils/sanitize";
suppressConsoleLogs();
initSentry();
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <PerformanceMonitor />
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

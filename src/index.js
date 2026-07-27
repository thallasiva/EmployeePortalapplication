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

/* ─── Redux Toolkit — uncomment after: npm install @reduxjs/toolkit react-redux ─── */
// import { Provider } from "react-redux";
// import { store }    from "./store";

suppressConsoleLogs();
initSentry();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        {/* <Provider store={store}> */}
        <AuthProvider>
          <PerformanceMonitor />
          <App />
        </AuthProvider>
        {/* </Provider> */}
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

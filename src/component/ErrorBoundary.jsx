
















import React from "react";
import { captureError } from "../utils/sentry";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {

    captureError(error, {
      componentStack: errorInfo?.componentStack,
      location: window.location.href
    });
    this.setState({ errorInfo });

    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary] caught:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-[300px] flex items-center justify-center p-8">
        <div className="max-w-md w-full rounded-xl border border-red-100 bg-red-50 p-6 text-center shadow-sm">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-semibold text-red-800 mb-1">Something went wrong</h2>
          <p className="text-sm text-red-600 mb-4">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          {process.env.NODE_ENV !== "production" && this.state.errorInfo &&
          <details className="text-left mb-4">
              <summary className="text-xs text-red-500 cursor-pointer">Stack trace</summary>
              <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-[10px] text-red-700 max-h-40">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          }
          <div className="flex gap-3 justify-center">
            <button
              onClick={this.handleReset}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">

              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">

              Reload page
            </button>
          </div>
        </div>
      </div>);

  }
}

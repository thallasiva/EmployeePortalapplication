import { Component } from "react";













const IS_PROD = process.env.NODE_ENV === "production";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {



    if (!IS_PROD) {

      console.error("[ErrorBoundary]", error, info);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">

        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true">

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />

          </svg>
        </div>

        <h2 className="text-lg font-semibold text-slate-800 mb-1">
          Something went wrong
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          {IS_PROD ?
          "An unexpected error occurred. Please refresh the page or try again." :
          this.state.error?.message}
        </p>

        {}
        {!IS_PROD && this.state.error?.stack &&
        <pre className="text-left text-xs bg-slate-100 rounded-lg p-4 max-w-2xl overflow-auto text-red-700 mb-4">
            {this.state.error.stack}
          </pre>
        }

        <button
          onClick={this.handleReset}
          className="px-4 py-2 text-sm bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors">

          Try again
        </button>
      </div>);

  }
}

export default ErrorBoundary;

/**
 * PageWrapper — memo + ErrorBoundary wrapper for every page
 * ─────────────────────────────────────────────────────────
 * Wrap page-level components with this to get:
 *  • React.memo (prevents re-render when parent re-renders with same props)
 *  • Per-page ErrorBoundary (isolates crashes; one bad page won't kill app)
 *  • Sentry performance tracing for the page span
 *
 * Usage:
 *   export default PageWrapper(MyPage, "Employee List");
 *
 * Or as a JSX wrapper:
 *   <PageWrapper name="Leave Requests"><RequestsTab /></PageWrapper>
 */
import React, { memo } from "react";
import ErrorBoundary from "./ErrorBoundary";

/** HOC form: PageWrapper(Component, displayName) */
export function withPageWrapper(Component, name) {
  const Wrapped = memo(function WrappedPage(props) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  });
  Wrapped.displayName = `PageWrapper(${name || Component.displayName || Component.name})`;
  return Wrapped;
}

/** JSX form: <PageWrapper name="..."><Child /></PageWrapper> */
const PageWrapper = memo(function PageWrapper({ children, name }) {
  return <ErrorBoundary key={name}>{children}</ErrorBoundary>;
});

export default PageWrapper;

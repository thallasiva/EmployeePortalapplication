













import React, { memo } from "react";
import ErrorBoundary from "./ErrorBoundary";


export function withPageWrapper(Component, name) {
  const Wrapped = memo(function WrappedPage(props) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>);

  });
  Wrapped.displayName = `PageWrapper(${name || Component.displayName || Component.name})`;
  return Wrapped;
}


const PageWrapper = memo(function PageWrapper({ children, name }) {
  return <ErrorBoundary key={name}>{children}</ErrorBoundary>;
});

export default PageWrapper;

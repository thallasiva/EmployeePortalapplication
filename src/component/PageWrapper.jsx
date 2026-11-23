import React, { memo } from "react";
import ErrorBoundary from "./ErrorBoundary";
const PageWrapper = memo(function PageWrapper({
  children,
  name
}) {
  return <ErrorBoundary key={name}>{children}</ErrorBoundary>;
});
export default PageWrapper;
export { withPageWrapper } from "./withPageWrapper";

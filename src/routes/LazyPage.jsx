import React, { Suspense } from "react";
import ErrorBoundary from "../component/ErrorBoundary";
import LoadingFallback from "../component/LoadingFallback";

export default function LazyPage({ children, label })
{
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback label={label || "Loading..."} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

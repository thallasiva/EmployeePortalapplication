import { memo } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
const PageLoader = memo(function PageLoader({
  label = "Loading..."
}) {
  return <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-gray-400">{label}</p>
    </div>;
});
export { PageLoader };

import { memo } from "react";

const SIZES = { sm: "w-4 h-4 border-2", md: "w-8 h-8 border-4", lg: "w-12 h-12 border-4" };

/**
 * Amber spinner — matches the app's primary accent colour.
 * @param {'sm'|'md'|'lg'} size
 * @param {string} className — wrapper className (for centering, margin, etc.)
 */
const LoadingSpinner = memo(function LoadingSpinner({ size = "md", className = "" })
{
  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label="Loading">
      <div
        className={`rounded-full animate-spin ${SIZES[size] ?? SIZES.md}`}
        style={{ borderColor: "#e5e7eb", borderTopColor: "#d97706" }}
      />
    </div>
  );
});

/**
 * Full-page centred loading overlay.
 */
export const PageLoader = memo(function PageLoader({ label = "Loading..." })
{
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
});

/**
 * Inline skeleton line — for text placeholder loading states.
 */
export const SkeletonLine = memo(function SkeletonLine({ width = "w-full", height = "h-4" })
{
  return <div className={`${width} ${height} rounded bg-gray-200 animate-pulse`} />;
});

export default LoadingSpinner;

import { memo } from "react";
import { SIZES } from "./shared";
/**
 * Amber spinner — matches the app's primary accent colour.
 * @param {'sm'|'md'|'lg'} size
 * @param {string} className — wrapper className (for centering, margin, etc.)
 */
const LoadingSpinner = memo(function LoadingSpinner({
  size = "md",
  className = ""
}) {
  return <div className={`flex items-center justify-center ${className}`} role="status" aria-label="Loading">
      <div className={`rounded-full animate-spin ${SIZES[size] ?? SIZES.md}`} style={{
      borderColor: "#e5e7eb",
      borderTopColor: "#d97706"
    }} />
    </div>;
});
/**
 * Full-page centred loading overlay.
 */
export { LoadingSpinner };

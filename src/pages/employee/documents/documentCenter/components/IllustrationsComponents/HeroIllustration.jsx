import React from "react";
const HeroIllustration = React.memo(function HeroIllustration() {
  return <svg width="130" height="70" viewBox="0 0 130 70" fill="none" aria-hidden>
      <circle cx="72" cy="18" r="8" fill="#f5c7a5" />
      <rect x="64" y="26" width="16" height="20" rx="4" fill="#fb923c" />
      <rect x="62" y="46" width="7" height="18" rx="3" fill="#7c3d00" />
      <rect x="75" y="46" width="7" height="18" rx="3" fill="#7c3d00" />
      <rect x="96" y="18" width="4" height="28" fill="#9aa3ad" />
      <rect x="88" y="14" width="20" height="6" rx="3" fill="#cfd7df" />
      <path d="M14 62h102" stroke="#d9dee3" />
    </svg>;
});
export { HeroIllustration };

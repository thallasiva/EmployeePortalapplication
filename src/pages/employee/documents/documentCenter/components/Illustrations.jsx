import React from "react";

export const EmptyDocIllustration = React.memo(function EmptyDocIllustration() {
  return (
    <svg width="120" height="110" viewBox="0 0 120 110" fill="none" aria-hidden>
      <path d="M36 16h34l14 14v52a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6V22a6 6 0 0 1 6-6Z" fill="#f4f7fb" stroke="#b7c7dc" />
      <path d="M70 16v16h16" stroke="#b7c7dc" />
      <path d="M42 48h30M42 57h30M42 66h24" stroke="#b7c7dc" strokeLinecap="round" />
      <circle cx="88" cy="76" r="11" fill="#eef3f9" stroke="#b7c7dc" />
      <path d="M88 70v12M82 76h12" stroke="#9eb2cc" strokeLinecap="round" />
    </svg>
  );
});

export const HeroIllustration = React.memo(function HeroIllustration() {
  return (
    <svg width="130" height="70" viewBox="0 0 130 70" fill="none" aria-hidden>
      <circle cx="72" cy="18" r="8" fill="#f5c7a5" />
      <rect x="64" y="26" width="16" height="20" rx="4" fill="#6ea8dc" />
      <rect x="62" y="46" width="7" height="18" rx="3" fill="#2f4f6f" />
      <rect x="75" y="46" width="7" height="18" rx="3" fill="#2f4f6f" />
      <rect x="96" y="18" width="4" height="28" fill="#9aa3ad" />
      <rect x="88" y="14" width="20" height="6" rx="3" fill="#cfd7df" />
      <path d="M14 62h102" stroke="#d9dee3" />
    </svg>
  );
});

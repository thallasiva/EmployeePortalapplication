import React from "react";
const EmptyDocIllustration = React.memo(function EmptyDocIllustration() {
  return <svg width="120" height="110" viewBox="0 0 120 110" fill="none" aria-hidden>
      <path d="M36 16h34l14 14v52a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6V22a6 6 0 0 1 6-6Z" fill="#f4f7fb" stroke="#b7c7dc" />
      <path d="M70 16v16h16" stroke="#b7c7dc" />
      <path d="M42 48h30M42 57h30M42 66h24" stroke="#b7c7dc" strokeLinecap="round" />
      <circle cx="88" cy="76" r="11" fill="#eef3f9" stroke="#b7c7dc" />
      <path d="M88 70v12M82 76h12" stroke="#fdba74" strokeLinecap="round" />
    </svg>;
});
export { EmptyDocIllustration };

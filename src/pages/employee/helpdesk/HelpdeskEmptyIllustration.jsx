import React from "react";

/** Line-art empty state matching helpdesk reference */
export default function HelpdeskEmptyIllustration() {
  return (
    <svg
      width="200"
      height="140"
      viewBox="0 0 200 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto text-slate-300"
      aria-hidden
    >
      <rect x="55" y="45" width="90" height="58" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M55 55h90" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="78" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M95 88c0-3 2.2-5 5-5s5 2 5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="28" y="62" width="28" height="32" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M34 72h16M34 78h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M42 68l4-4 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <rect x="148" y="58" width="32" height="36" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M154 68h20M154 74h16M154 80h12" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="164" cy="62" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M161 62h6M164 59v6" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="100" cy="28" rx="22" ry="14" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="94" cy="26" r="1.5" fill="currentColor" />
      <circle cx="100" cy="26" r="1.5" fill="currentColor" />
      <circle cx="106" cy="26" r="1.5" fill="currentColor" />
    </svg>
  );
}

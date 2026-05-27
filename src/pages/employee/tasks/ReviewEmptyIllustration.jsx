import React from "react";

export function RegularizationEmptyIllustration() {
  return (
    <svg
      className="review-hub__empty-illustration"
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="70" y="30" width="60" height="50" rx="4" fill="#e8f4fc" stroke="#b3d9f2" strokeWidth="1.5" />
      <text x="100" y="58" textAnchor="middle" fill="#5dade2" fontSize="20" fontWeight="bold">
        ×
      </text>
      <rect x="30" y="55" width="45" height="32" rx="3" fill="#f0f0f0" stroke="#ddd" />
      <circle cx="52" cy="68" r="6" fill="#aed6f1" />
      <ellipse cx="130" y="50" rx="22" ry="14" fill="#e8f4fc" stroke="#b3d9f2" />
      <path d="M125 48 Q135 42 145 48" stroke="#85c1e9" fill="none" strokeWidth="1.5" />
    </svg>
  );
}

export function GenericEmptyIllustration() {
  return (
    <svg
      className="review-hub__empty-illustration"
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="60" y="25" width="80" height="70" rx="4" fill="#f5f5f5" stroke="#ddd" />
      <rect x="70" y="40" width="60" height="6" rx="2" fill="#e0e0e0" />
      <rect x="70" y="52" width="45" height="4" rx="1" fill="#eee" />
      <rect x="70" y="62" width="50" height="4" rx="1" fill="#eee" />
      <circle cx="100" cy="78" r="12" fill="#d6eaf8" />
    </svg>
  );
}

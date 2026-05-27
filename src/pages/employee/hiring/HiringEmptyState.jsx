import React from "react";

export default function HiringEmptyState() {
  return (
    <div className="hiring-empty">
      <svg
        className="hiring-empty__illustration"
        viewBox="0 0 280 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <ellipse cx="140" cy="170" rx="100" ry="18" fill="#e8f4fc" />
        <path
          d="M60 120 Q90 60 140 75 Q190 60 220 120 L200 165 H80 Z"
          fill="#d6eef9"
        />
        <rect x="115" y="95" width="50" height="40" rx="4" fill="#5dade2" />
        <rect x="120" y="100" width="40" height="30" rx="2" fill="#85c1e9" />
        <circle cx="140" cy="72" r="18" fill="#f5cba7" />
        <path
          d="M122 68 Q140 58 158 68 L155 78 Q140 72 125 78 Z"
          fill="#5d4e37"
        />
        <rect x="128" y="88" width="24" height="32" rx="2" fill="#3498db" />
        <rect x="108" y="118" width="18" height="8" rx="2" fill="#3498db" />
        <rect x="154" y="118" width="18" height="8" rx="2" fill="#3498db" />
        <path
          d="M95 85 Q88 70 100 65"
          stroke="#5dade2"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="95" cy="62" rx="8" ry="12" fill="#85c1e9" opacity="0.8" />
        <ellipse cx="175" cy="58" rx="6" ry="10" fill="#85c1e9" opacity="0.7" />
        <ellipse cx="185" cy="72" rx="5" ry="8" fill="#5dade2" opacity="0.6" />
      </svg>
      <h3 className="hiring-empty__title">No results found.</h3>
      <p className="hiring-empty__text">
        We can&apos;t find any item matching your search.
      </p>
    </div>
  );
}

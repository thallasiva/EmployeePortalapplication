import React from "react";

/** Three overlapping profile cards — My Referrals / Applied Jobs empty state */
export default function HiringProfileCardsIllustration() {
  return (
    <svg
      className="hiring-profile-cards"
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="20" y="25" width="70" height="85" rx="6" fill="#fff" stroke="#e0e0e0" strokeWidth="1" />
      <rect x="28" y="35" width="54" height="6" rx="2" fill="#eee" />
      <rect x="28" y="46" width="40" height="4" rx="1" fill="#f0f0f0" />
      <circle cx="55" cy="68" r="16" fill="#5dade2" />
      <circle cx="55" cy="64" r="7" fill="#f5cba7" />

      <rect x="65" y="15" width="70" height="85" rx="6" fill="#fff" stroke="#e0e0e0" strokeWidth="1" />
      <rect x="73" y="25" width="54" height="6" rx="2" fill="#eee" />
      <rect x="73" y="36" width="40" height="4" rx="1" fill="#f0f0f0" />
      <circle cx="100" cy="58" r="16" fill="#82e0aa" />
      <circle cx="100" cy="54" r="7" fill="#f9e79f" />
      <path d="M108 62 L112 58 L116 64" stroke="#f5cba7" strokeWidth="2" fill="none" />

      <rect x="110" y="30" width="70" height="85" rx="6" fill="#fff" stroke="#e0e0e0" strokeWidth="1" />
      <rect x="118" y="40" width="54" height="6" rx="2" fill="#eee" />
      <rect x="118" y="51" width="40" height="4" rx="1" fill="#f0f0f0" />
      <circle cx="145" cy="73" r="16" fill="#5dade2" />
      <circle cx="145" cy="69" r="7" fill="#f5cba7" />
      <rect x="138" y="82" width="14" height="12" rx="2" fill="#3498db" />
    </svg>
  );
}

import React from "react";
import { BRAND } from "../constants";

const LeavingIllustration = React.memo(function LeavingIllustration() {
  return (
    <svg viewBox="0 0 280 200" width="200" height="145" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="155" width="220" height="6" rx="3" fill="#e2e8f0" />
      <rect x="60" y="70" width="80" height="85" rx="4" fill="#cbd5e1" />
      <rect x="64" y="74" width="72" height="77" rx="3" fill="#f1f5f9" />
      <rect x="64" y="74" width="40" height="77" rx="2" fill="#e2e8f0" />
      <circle cx="100" cy="112" r="3" fill="#94a3b8" />
      <rect x="68" y="30" width="72" height="35" rx="4" fill="#bfdbfe" />
      <line x1="104" y1="30" x2="104" y2="65" stroke="#93c5fd" strokeWidth="1.5" />
      <line x1="68" y1="47" x2="140" y2="47" stroke="#93c5fd" strokeWidth="1.5" />
      <circle cx="185" cy="88" r="14" fill={BRAND} />
      <circle cx="185" cy="75" r="9" fill="#fcd34d" />
      <rect x="170" y="108" width="30" height="22" rx="3" fill="#f97316" />
      <line x1="170" y1="116" x2="200" y2="116" stroke="#fff" strokeWidth="1.5" />
      <line x1="185" y1="108" x2="185" y2="130" stroke="#fff" strokeWidth="1.5" />
      <line x1="171" y1="100" x2="160" y2="115" stroke="#fcd34d" strokeWidth="5" strokeLinecap="round" />
      <line x1="199" y1="100" x2="210" y2="115" stroke="#fcd34d" strokeWidth="5" strokeLinecap="round" />
      <circle cx="105" cy="95" r="7" fill="#60a5fa" />
      <rect x="99" y="102" width="12" height="16" rx="3" fill="#93c5fd" />
      <line x1="99" y1="106" x2="92" y2="99" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />
      <circle cx="128" cy="97" r="7" fill="#34d399" />
      <rect x="122" y="104" width="12" height="16" rx="3" fill="#6ee7b7" />
      <line x1="134" y1="104" x2="141" y2="97" stroke="#6ee7b7" strokeWidth="3" strokeLinecap="round" />
      <line x1="178" y1="130" x2="174" y2="155" stroke="#f97316" strokeWidth="5" strokeLinecap="round" />
      <line x1="192" y1="130" x2="196" y2="155" stroke="#f97316" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
});

export default LeavingIllustration;

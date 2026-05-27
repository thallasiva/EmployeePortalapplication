import React from "react";

export default function TasksEmptyIllustration() {
  return (
    <svg
      className="tasks-empty__illustration"
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="55" y="40" width="90" height="110" rx="4" fill="#fff" stroke="#3498db" strokeWidth="2" />
      <rect x="55" y="40" width="90" height="18" fill="#e74c3c" stroke="#3498db" strokeWidth="2" />
      <line x1="65" y1="70" x2="130" y2="70" stroke="#ddd" strokeWidth="1.5" />
      <circle cx="68" cy="70" r="3" fill="none" stroke="#999" />
      <line x1="65" y1="85" x2="130" y2="85" stroke="#ddd" strokeWidth="1.5" />
      <circle cx="68" cy="85" r="3" fill="none" stroke="#999" />
      <line x1="65" y1="100" x2="130" y2="100" stroke="#ddd" strokeWidth="1.5" />
      <circle cx="68" cy="100" r="3" fill="none" stroke="#999" />
      <rect x="35" y="55" width="18" height="18" rx="2" fill="#fff" stroke="#e74c3c" strokeWidth="1.5" transform="rotate(-12 44 64)" />
      <rect x="150" y="50" width="16" height="16" rx="2" fill="#aed6f1" stroke="#3498db" strokeWidth="1" transform="rotate(8 158 58)" />
      <rect x="145" y="95" width="14" height="14" rx="2" fill="#fff" stroke="#ccc" transform="rotate(-5 152 102)" />
      <rect x="40" y="110" width="15" height="15" rx="2" fill="#fadbd8" stroke="#e74c3c" strokeWidth="1" transform="rotate(6 47 117)" />
    </svg>
  );
}

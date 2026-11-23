import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
/* ─── Mini toast component ─── */
function Toast({
  msg,
  type,
  onClose
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  const isSuccess = type === "success";
  return <div style={{
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: isSuccess ? "#f0fdf4" : "#fef2f2",
    border: `1px solid ${isSuccess ? "#86efac" : "#fca5a5"}`,
    borderRadius: 10,
    padding: "10px 14px",
    margin: "0 16px 10px",
    boxShadow: "0 2px 8px rgba(0,0,0,.08)",
    fontSize: 13,
    fontWeight: 600,
    color: isSuccess ? "#15803d" : "#dc2626",
    animation: "slideDown .2s ease"
  }}>
      {isSuccess ? <CheckCircle2 size={16} color="#16a34a" style={{
      flexShrink: 0
    }} /> : <AlertCircle size={16} color="#dc2626" style={{
      flexShrink: 0
    }} />}
      <span style={{
      flex: 1
    }}>{msg}</span>
      <button onClick={onClose} style={{
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 0,
      color: "inherit",
      opacity: 0.6,
      display: "flex"
    }}>
        <X size={14} />
      </button>
    </div>;
}
/* ─── Main component ─── */
export { Toast };

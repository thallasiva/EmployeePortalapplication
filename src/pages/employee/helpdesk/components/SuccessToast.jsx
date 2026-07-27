import { memo } from "react";
import { CheckCircle } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";

/**
 * Floating success notification shown after a ticket is submitted.
 * Single responsibility: display + dismiss only.
 */
const SuccessToast = memo(function SuccessToast({ onDismiss }) {
  return (
    <div className={cssClass({
      position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: "16px 24px",
      display: "flex", alignItems: "center", gap: 12, zIndex: 2000, minWidth: 320,
    })}>
      <CheckCircle size={22} color="#22c55e" />
      <div className={cssClass({ flex: 1 })}>
        <p className={cssClass({ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 })}>
          Request submitted!
        </p>
        <p className={cssClass({ fontSize: 12, color: "#6b7280", margin: "2px 0 0" })}>
          Your request is visible to admin &amp; your manager.
        </p>
      </div>
      <button
        onClick={onDismiss}
        className={cssClass({ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 16, padding: 2 })}
      >
        ✕
      </button>
    </div>
  );
});

export default SuccessToast;

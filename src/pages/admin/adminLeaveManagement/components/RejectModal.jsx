import { memo, useState } from "react";
import { X } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import Btn from "./Btn";

const RejectModal = memo(({ onConfirm, onClose }) => {
  const [remarks, setRemarks] = useState("");

  return (
    <div className={cssClass({ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center" })}>
      <div className={cssClass({ background: "#fff", borderRadius: 14, padding: 24, width: 420, boxShadow: "0 8px 40px #0003" })}>
        <div className={cssClass({ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 16 })}>
          Reject — Add Remarks
        </div>
        <textarea
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Reason for rejection (optional)"
          className={cssClass({ width: "100%", borderRadius: 8, border: "1px solid #e5e7eb", padding: "8px 12px",
            fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit" })}
        />
        <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 })}>
          <Btn variant="cancel" onClick={onClose}>Cancel</Btn>
          <Btn variant="danger" onClick={() => onConfirm(remarks)}>
            <X size={13} />Reject
          </Btn>
        </div>
      </div>
    </div>
  );
});

RejectModal.displayName = "RejectModal";
export default RejectModal;

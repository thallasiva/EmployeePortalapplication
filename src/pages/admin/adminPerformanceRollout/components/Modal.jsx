import React from "react";
import { X } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";

const Modal = React.memo(function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div className={cssClass({ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" })}>
      <div className={cssClass({ background: "#fff", borderRadius: 12, width, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.2)" })}>
        <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #e2e8f0" })}>
          <span className={cssClass({ fontWeight: 700, fontSize: 16 })}>{title}</span>
          <button onClick={onClose} className={cssClass({ background: "none", border: "none", cursor: "pointer", color: "#64748b" })}><X size={18} /></button>
        </div>
        <div className={cssClass({ padding: 22 })}>{children}</div>
      </div>
    </div>
  );
});

export default Modal;

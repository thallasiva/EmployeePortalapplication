import React from "react";
import { X } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";

function Modal({ title, onClose, onSave, onClear, children }) {
  return (
    <div className={cssClass({
      position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.55)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "28px 16px", overflowY: "auto", backdropFilter: "blur(2px)"
    })}>
      <div className={cssClass({
        background: "#fff", borderRadius: 14, width: "100%", maxWidth: 640,
        boxShadow: "0 24px 64px rgba(0,0,0,0.22)", overflow: "hidden"
      })}>
        {}
        <div className={cssClass({ height: 4, background: "linear-gradient(90deg,#f18200,#ffb347)" })} />
        {}
        <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 22px", borderBottom: "1px solid #f1f5f9" })}>
          <h3 className={cssClass({ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b", letterSpacing: "-0.01em" })}>{title}</h3>
          <button type="button" onClick={onClose} className={cssClass(
            { width: 30, height: 30, borderRadius: "50%", border: "none", background: "#f1f5f9",
              cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" })}>
            <X size={15} />
          </button>
        </div>
        {}
        <div className={cssClass({ padding: "18px 22px", maxHeight: "62vh", overflowY: "auto" })}>
          {children}
        </div>
        {}
        <div className={cssClass({ display: "flex", gap: 10, padding: "14px 22px", borderTop: "1px solid #f1f5f9", background: "#fafafa" })}>
          <button type="button" onClick={onSave} className={cssClass({
            flex: 1, padding: "10px", background: "#f18200", color: "#fff", border: "none",
            borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer",
            boxShadow: "0 2px 8px rgba(241,130,0,0.3)"
          })}>Save & Close</button>
          <button type="button" onClick={onClear} className={cssClass({
            padding: "10px 20px", background: "#fff", color: "#64748b",
            border: "1px solid #e2e8f0", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer"
          })}>Clear</button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(Modal);

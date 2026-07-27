import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { fmt } from "../utils/formatters";
import Modal from "./Modal";

const TCS_TDS_ITEMS = [
  { key: "tcs", label: "TCS — Tax Collected at Source", desc: "Tax deducted by seller on high-value transactions" },
  { key: "tds", label: "TDS — Tax Deducted at Source", desc: "Tax withheld by payer on income payments" },
];

function ModalTcsTds({ values, setValues, onClose }) {
  const tcs = Number(values.tcs) || 0;
  const tds = Number(values.tds) || 0;
  const total = tcs + tds;

  return (
    <Modal
      title="Tax Credits — TDS / TCS"
      onClose={onClose}
      onSave={onClose}
      onClear={() => setValues({ tcs: 0, tds: 0 })}
    >
      {}
      <div className={cssClass({ borderRadius: 10, border: "1px solid #fed7aa", marginBottom: 18,
        background: "linear-gradient(135deg,#fff7ed,#ffedd5)",
        padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" })}>
        <div>
          <div className={cssClass({ fontSize: 11, color: "#92400e", fontWeight: 600, marginBottom: 2 })}>Total Declared</div>
          <div className={cssClass({ fontSize: 20, fontWeight: 800, color: "#f18200" })}>{fmt(total)}</div>
        </div>
        <div className={cssClass({ display: "flex", gap: 16, fontSize: 12 })}>
          <div className={cssClass({ textAlign: "center" })}>
            <div className={cssClass({ fontSize: 10, color: "#92400e", fontWeight: 600 })}>TCS</div>
            <div className={cssClass({ fontWeight: 700, color: "#1e293b" })}>{fmt(tcs)}</div>
          </div>
          <div className={cssClass({ textAlign: "center" })}>
            <div className={cssClass({ fontSize: 10, color: "#92400e", fontWeight: 600 })}>TDS</div>
            <div className={cssClass({ fontWeight: 700, color: "#1e293b" })}>{fmt(tds)}</div>
          </div>
        </div>
      </div>

      <div className={cssClass({ display: "flex", flexDirection: "column", gap: 12 })}>
        {TCS_TDS_ITEMS.map(({ key, label, desc }) => {
          const filled = (Number(values[key]) || 0) > 0;
          return (
            <div key={key} className={cssClass({
              border: `1.5px solid ${filled ? "#fed7aa" : "#e2e8f0"}`,
              borderRadius: 10, padding: "14px 16px",
              background: filled ? "#fffbf5" : "#fafafa"
            })}>
              <div className={cssClass({ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 3 })}>{label}</div>
              <div className={cssClass({ fontSize: 11, color: "#94a3b8", marginBottom: 12 })}>{desc}</div>
              <div>
                <div className={cssClass({ fontSize: 11, color: "#64748b", marginBottom: 5, fontWeight: 600 })}>Declared Amount (₹)</div>
                <div className={cssClass({ display: "flex", border: "1px solid #e2e8f0", borderRadius: 7, overflow: "hidden",
                  background: "#fff", boxShadow: filled ? "0 0 0 2px rgba(241,130,0,0.15)" : "none" })}>
                  <span className={cssClass({ padding: "9px 12px", background: "#f8fafc", borderRight: "1px solid #e2e8f0",
                    fontSize: 13, color: "#64748b", fontWeight: 600 })}>₹</span>
                  <input type="number" value={values[key] || ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))}
                    placeholder="Enter amount" className={cssClass(
                      { flex: 1, padding: "9px 12px", border: "none", fontSize: 13,
                        textAlign: "right", outline: "none", color: "#1e293b" })} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

export default React.memo(ModalTcsTds);

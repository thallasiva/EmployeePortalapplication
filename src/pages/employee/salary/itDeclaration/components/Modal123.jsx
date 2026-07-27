import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { SEC123_ITEMS } from "../constants";
import { fmt } from "../utils/formatters";
import Modal from "./Modal";
import AmtRow from "./AmtRow";

function Modal123({ values, setValues, onClose }) {
  const total = SEC123_ITEMS.reduce((s, item) => s + (Number(values[item.label]) || 0), 0);
  const effective = Math.min(total, 150000);
  const pct = Math.min((effective / 150000) * 100, 100);

  return (
    <Modal
      title="Tax-Saving Investments (80C / 80CCD)"
      onClose={onClose}
      onSave={onClose}
      onClear={() => setValues({})}
    >
      {}
      <div className={cssClass({ borderRadius: 10, overflow: "hidden", border: "1px solid #fed7aa", marginBottom: 16 })}>
        <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 16px", background: "linear-gradient(135deg,#fff7ed,#ffedd5)" })}>
          <div>
            <div className={cssClass({ fontSize: 11, color: "#92400e", fontWeight: 600, marginBottom: 2 })}>Total Declared</div>
            <div className={cssClass({ fontSize: 20, fontWeight: 800, color: "#f18200" })}>{fmt(effective)}</div>
          </div>
          <div className={cssClass({ textAlign: "right" })}>
            <div className={cssClass({ fontSize: 11, color: "#92400e", fontWeight: 600, marginBottom: 2 })}>Limit</div>
            <div className={cssClass({ fontSize: 13, fontWeight: 700, color: "#c2410c" })}>₹1,50,000</div>
          </div>
        </div>
        {}
        <div className={cssClass({ height: 5, background: "#fed7aa" })}>
          <div className={cssClass({ height: "100%", width: `${pct}%`,
            background: pct >= 100 ? "#16a34a" : "#f18200",
            transition: "width 0.3s" })} />
        </div>
      </div>
      {}
      <div className={cssClass({ fontSize: 11, color: "#64748b", background: "#f8fafc", borderRadius: 6,
        padding: "7px 12px", marginBottom: 14, border: "1px solid #e2e8f0" })}>
        All items share the combined limit of ₹1,50,000 under Section 80C / 80CCD.
      </div>
      {SEC123_ITEMS.map((item) => (
        <AmtRow
          key={item.label}
          section={item.section}
          label={item.label}
          maxLimit={item.max}
          value={values[item.label] || 0}
          onChange={(v) => setValues((prev) => ({ ...prev, [item.label]: v }))}
        />
      ))}
    </Modal>
  );
}

export default React.memo(Modal123);

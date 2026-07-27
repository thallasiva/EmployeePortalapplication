import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { CH8_ITEMS } from "../constants";
import { fmt } from "../utils/formatters";
import Modal from "./Modal";
import AmtRow from "./AmtRow";

function ModalCh8({ values, setValues, onClose }) {
  const total = CH8_ITEMS.reduce((s, item) => s + (Number(values[item.label]) || 0), 0);

  return (
    <Modal
      title="Other Deductions (80D / 80E / 80G)"
      onClose={onClose}
      onSave={onClose}
      onClear={() => setValues({})}
    >
      {}
      <div className={cssClass({ borderRadius: 10, border: "1px solid #fed7aa", marginBottom: 14,
        background: "linear-gradient(135deg,#fff7ed,#ffedd5)", padding: "12px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center" })}>
        <div>
          <div className={cssClass({ fontSize: 11, color: "#92400e", fontWeight: 600, marginBottom: 2 })}>Total Declared</div>
          <div className={cssClass({ fontSize: 20, fontWeight: 800, color: "#f18200" })}>{fmt(total)}</div>
        </div>
        <div className={cssClass({ fontSize: 11, color: "#92400e", textAlign: "right" })}>
          Multiple sections<br />
          <span className={cssClass({ fontWeight: 700 })}>No combined limit</span>
        </div>
      </div>
      {}
      <div className={cssClass({ display: "flex", alignItems: "flex-start", gap: 8,
        fontSize: 11, color: "#92400e", background: "#fffbeb",
        border: "1px solid #fde68a", borderRadius: 7, padding: "8px 12px", marginBottom: 14 })}>
        <span className={cssClass({ fontSize: 14, lineHeight: 1 })}>ⓘ</span>
        Amount declared under 153(2)(a) / 153(2)(b) will be auto-considered under Other Income.
      </div>
      {CH8_ITEMS.map((item) => (
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

export default React.memo(ModalCh8);

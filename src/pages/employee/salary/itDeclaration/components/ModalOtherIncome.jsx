import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import Modal from "./Modal";

function ModalOtherIncome({ incomes, setIncomes, onClose }) {
  const list = incomes.length ? incomes : [{ particulars: "", amount: 0 }];
  const addIncome = () => setIncomes((prev) => [...prev, { particulars: "", amount: 0 }]);
  const remove = (i) => setIncomes((prev) => prev.filter((_, idx) => idx !== i));
  const update = (i, k, v) =>
    setIncomes((prev) => prev.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));
  const total = list.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const inp = {
    padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 4,
    fontSize: 13, outline: "none", fontFamily: "inherit", background: "#fff"
  };

  return (
    <Modal
      title="Other Sources of Income"
      onClose={onClose}
      onSave={onClose}
      onClear={() => setIncomes([{ particulars: "", amount: 0 }])}
    >
      {}
      <div className={cssClass({ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: 0 })}>
        <div className={cssClass({ padding: "10px 16px", borderRight: "1px solid #e5e7eb", minWidth: 130 })}>
          <div className={cssClass({ fontSize: 11, color: "#94a3b8" })}>Total declared in ₹</div>
          <div className={cssClass({ fontSize: 14, fontWeight: 700, color: "#1e293b", marginTop: 2 })}>
            {total > 0 ? total.toLocaleString("en-IN") : "-"}
          </div>
        </div>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", fontSize: 12, color: "#374151" })}>
          <span className={cssClass({ color: "#3b82f6", fontSize: 15, lineHeight: 1 })}>ⓘ</span>
          Amount declared under 153(2)(a)/153(2)(b) would be auto considered under Other Income
        </div>
      </div>

      {}
      {list.map((inc, i) => (
        <div key={i}>
          {}
          <div className={cssClass({ background: "#f3f4f6", padding: "8px 16px", fontSize: 13, fontWeight: 600,
            color: "#374151", borderBottom: "1px solid #e5e7eb", borderTop: "1px solid #e5e7eb",
            display: "flex", alignItems: "center", justifyContent: "space-between" })}>
            Other Income {i + 1}
            {list.length > 1 && (
              <button type="button" onClick={() => remove(i)} className={cssClass(
                { background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 0 })}>
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {}
          <div className={cssClass({ padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 })}>
            <div>
              <div className={cssClass({ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 })}>Particulars</div>
              <input type="text" value={inc.particulars || ""}
                onChange={(e) => update(i, "particulars", e.target.value)}
                placeholder="Enter income type" className={cssClass(
                  { ...inp, width: "100%", boxSizing: "border-box" })} />
            </div>
            <div>
              <div className={cssClass({ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 })}>Declared Amount</div>
              <div className={cssClass({ display: "flex", border: "1px solid #d1d5db", borderRadius: 4, overflow: "hidden" })}>
                <span className={cssClass({ padding: "7px 10px", background: "#f9fafb", borderRight: "1px solid #d1d5db",
                  fontSize: 13, color: "#64748b" })}>₹</span>
                <input type="number" value={inc.amount || ""}
                  onChange={(e) => update(i, "amount", Number(e.target.value) || 0)}
                  placeholder="Enter amount" className={cssClass(
                    { flex: 1, padding: "7px 10px", border: "none", outline: "none", fontSize: 13 })} />
              </div>
            </div>
          </div>
        </div>
      ))}

      {}
      <div className={cssClass({ padding: "8px 16px 4px" })}>
        <button type="button" onClick={addIncome} className={cssClass(
          { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#f18200",
            background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 })}>
          <Plus size={13} /> Add Income
        </button>
      </div>
    </Modal>
  );
}

export default React.memo(ModalOtherIncome);

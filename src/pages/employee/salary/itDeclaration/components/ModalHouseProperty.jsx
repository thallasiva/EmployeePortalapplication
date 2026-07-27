import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { fmtDec } from "../utils/formatters";
import Modal from "./Modal";
import HouseForm from "./HouseForm";

function ModalHouseProperty({ houseData, setHouseData, selfOccupied, setSelfOccupied, onClose }) {
  const [activeTab, setActiveTab] = useState(0);

  const addHouse = () => {
    setHouseData((prev) => {
      const n = [...prev, {}];
      setActiveTab(n.length - 1);
      return n;
    });
  };
  const removeHouse = (i) => {
    setHouseData((prev) => {
      const n = prev.filter((_, idx) => idx !== i);
      setActiveTab((t) => Math.min(t, n.length - 1));
      return n;
    });
  };
  const updateHouse = (i, h) => setHouseData((prev) => prev.map((x, idx) => (idx === i ? h : x)));

  const selfOccupiedInt = Math.min(Number(selfOccupied.interest || 0), 200000);
  const letOutLoss = Math.min(
    -houseData.reduce((s, h) => {
      const net =
        Number(h.annualValue || 0) -
        Number(h.municipalTax || 0) -
        Number(h.unrealizedRent || 0);
      const stdDed = Math.round(Math.max(net, 0) * 0.3);
      return s + net - stdDed - Number(h.homeLoanInterest || 0);
    }, 0),
    200000
  );
  const totalExemption = selfOccupiedInt + Math.max(letOutLoss, 0);

  const inputStyle = {
    width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0",
    borderRadius: 6, fontSize: 12, outline: "none", background: "#fff",
    boxSizing: "border-box"
  };

  return (
    <Modal
      title="House Property Income / Loss (Sec. 24)"
      onClose={onClose}
      onSave={onClose}
      onClear={() => { setHouseData([{}]); setSelfOccupied({}); setActiveTab(0); }}
    >
      {}
      <div className={cssClass({
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 14px", borderRadius: 8, marginBottom: 6,
        background: "linear-gradient(135deg,#fff7ed,#ffedd5)",
        border: "1px solid #fed7aa"
      })}>
        <span className={cssClass({ fontSize: 12, fontWeight: 600, color: "#c2410c" })}>c. Total Exemption in ₹</span>
        <strong className={cssClass({ fontSize: 15, color: "#f18200" })}>{fmtDec(totalExemption)}</strong>
      </div>
      {}
      <div className={cssClass({
        fontSize: 11, color: "#64748b", background: "#f8fafc", borderRadius: 6,
        padding: "7px 12px", marginBottom: 18, lineHeight: 1.6,
        border: "1px solid #e2e8f0"
      })}>
        <strong>Note:</strong> If (a + b) is less than −₹2,00,000 then −₹2,00,000 will be exempted, else the actual (a + b) will be exempted.
      </div>

      {}
      <div className={cssClass({ marginBottom: 20 })}>
        <div className={cssClass({
          display: "flex", alignItems: "center",
          padding: "8px 12px", borderRadius: 7,
          background: "#f1f5f9", marginBottom: 12,
          borderLeft: "3px solid #94a3b8"
        })}>
          <span className={cssClass({ fontSize: 12, fontWeight: 700, color: "#334155" })}>
            a. Income from Self-Occupied Property
          </span>
        </div>

        <div className={cssClass({ padding: "0 2px" })}>
          <div className={cssClass({ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            padding: "0 0 12px", borderBottom: "1px solid #f1f5f9", gap: 12, marginBottom: 12 })}>
            <div className={cssClass({ flex: 1 })}>
              <div className={cssClass({ fontSize: 12, color: "#475569", marginBottom: 5 })}>
                Interest on Housing Loan (Self Occupied) in ₹
              </div>
              <div className={cssClass({ fontSize: 11, color: "#f18200", fontWeight: 600 })}>
                Eligible Amount in ₹: 2,00,000.00
              </div>
            </div>
            <input type="number" value={selfOccupied.interest || ""}
              onChange={(e) => setSelfOccupied((p) => ({ ...p, interest: Number(e.target.value) || 0 }))}
              placeholder="₹ 0" className={cssClass(
                { width: 130, padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6,
                  fontSize: 12, textAlign: "right", outline: "none", background: "#fff", flexShrink: 0 })} />
          </div>
          <div className={cssClass({ display: "flex", gap: 10 })}>
            <div className={cssClass({ flex: 1 })}>
              <div className={cssClass({ fontSize: 11, color: "#94a3b8", marginBottom: 4 })}>Lender's Name</div>
              <input type="text" value={selfOccupied.lenderName || ""}
                onChange={(e) => setSelfOccupied((p) => ({ ...p, lenderName: e.target.value }))}
                placeholder="Enter lender name" className={cssClass(inputStyle)} />
            </div>
            <div className={cssClass({ flex: 1 })}>
              <div className={cssClass({ fontSize: 11, color: "#94a3b8", marginBottom: 4 })}>Lender's PAN</div>
              <input type="text" value={selfOccupied.lenderPAN || ""}
                onChange={(e) => setSelfOccupied((p) => ({ ...p, lenderPAN: e.target.value }))}
                placeholder="Enter PAN" className={cssClass(inputStyle)} />
            </div>
          </div>
        </div>
      </div>

      {}
      <div>
        <div className={cssClass({
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 12px", borderRadius: 7,
          background: "#fff7ed", marginBottom: 12,
          borderLeft: "3px solid #f18200"
        })}>
          <span className={cssClass({ fontSize: 12, fontWeight: 700, color: "#c2410c" })}>
            b. Income from Let-out Property
          </span>
          <button type="button" onClick={addHouse} className={cssClass(
            { display: "flex", alignItems: "center", gap: 4, fontSize: 11,
              color: "#f18200", background: "none", border: "none", cursor: "pointer",
              fontWeight: 600, padding: 0 })}>
            <Plus size={13} /> Add new property
          </button>
        </div>

        {}
        {houseData.length > 0 && (
          <div className={cssClass({ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" })}>
            {houseData.map((_, i) => (
              <div key={i} className={cssClass({ display: "flex", alignItems: "center" })}>
                <button type="button" onClick={() => setActiveTab(i)} className={cssClass(
                  {
                    padding: "5px 14px", fontSize: 12,
                    borderRadius: houseData.length > 1 ? "6px 0 0 6px" : 6,
                    cursor: "pointer", fontWeight: activeTab === i ? 700 : 400,
                    background: activeTab === i ? "#f18200" : "#f8fafc",
                    color: activeTab === i ? "#fff" : "#64748b",
                    border: activeTab === i ? "1px solid #f18200" : "1px solid #e2e8f0",
                    borderRight: houseData.length > 1 ? "none" : undefined
                  })}>
                  Property {i + 1}
                </button>
                {houseData.length > 1 && (
                  <button type="button" onClick={() => removeHouse(i)} className={cssClass(
                    {
                      padding: "5px 7px", borderRadius: "0 6px 6px 0",
                      cursor: "pointer",
                      background: activeTab === i ? "#ea580c" : "#f8fafc",
                      color: activeTab === i ? "#fff" : "#94a3b8",
                      border: activeTab === i ? "1px solid #f18200" : "1px solid #e2e8f0",
                      lineHeight: 1, display: "flex", alignItems: "center"
                    })}>
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {}
        {houseData[activeTab] !== undefined && (
          <div className={cssClass({ border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", background: "#fafafa" })}>
            <HouseForm
              house={houseData[activeTab]}
              idx={activeTab}
              onChange={(nh) => updateHouse(activeTab, nh)}
              onRemove={() => removeHouse(activeTab)}
              canRemove={houseData.length > 1}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

export default React.memo(ModalHouseProperty);

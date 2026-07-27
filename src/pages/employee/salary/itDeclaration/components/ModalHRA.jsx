import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { LANDLORD_RELATIONS } from "../constants";
import { getFYMonths, countMonths, blankHouse } from "../utils/hraHelpers";
import Modal from "./Modal";

function ModalHRA({ hraData, setHraData, annualHraReceived, onClose }) {
  const fyMonths = getFYMonths();
  const houses = hraData.houses && hraData.houses.length ? hraData.houses : [blankHouse(fyMonths)];
  const [tab, setTab] = useState(0);

  const setHouses = (h) => setHraData((prev) => ({ ...prev, houses: h }));
  const upd = (i, k, v) => setHouses(houses.map((h, idx) => (idx === i ? { ...h, [k]: v } : h)));

  const totalAnnual = houses.reduce(
    (s, h) => s + (Number(h.monthlyRent) || 0) * countMonths(h.from, h.to),
    0
  );

  const h = houses[tab] || blankHouse(fyMonths);
  const annualRent = (Number(h.monthlyRent) || 0) * countMonths(h.from, h.to);

  const inp = {
    width: "100%", boxSizing: "border-box", padding: "7px 10px",
    border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13,
    outline: "none", fontFamily: "inherit", background: "#fff"
  };
  const lbl = { fontSize: 12, color: "#374151", marginBottom: 4, display: "block" };
  const req = <span className={cssClass({ color: "red" })}>*</span>;

  return (
    <Modal
      title="HRA Exemption (Sec. 10(13A))"
      onClose={onClose}
      onSave={onClose}
      onClear={() => setHraData({ houses: [blankHouse(fyMonths)] })}
    >
      {}
      <div className={cssClass({ borderRadius: 10, border: "1px solid #fed7aa", marginBottom: 16,
        background: "linear-gradient(135deg,#fff7ed,#ffedd5)",
        padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" })}>
        <div>
          <div className={cssClass({ fontSize: 11, color: "#92400e", fontWeight: 600, marginBottom: 2 })}>Total Annual HRA Declared</div>
          <div className={cssClass({ fontSize: 20, fontWeight: 800, color: "#f18200" })}>
            {totalAnnual > 0 ? `₹${totalAnnual.toLocaleString("en-IN")}` : "—"}
          </div>
        </div>
        <div className={cssClass({ fontSize: 11, color: "#92400e", textAlign: "right" })}>
          {houses.length} house{houses.length > 1 ? "s" : ""}<br />
          <span className={cssClass({ fontWeight: 700 })}>this financial year</span>
        </div>
      </div>

      {}
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" })}>
        {houses.map((_, i) => (
          <button key={i} type="button" onClick={() => setTab(i)} className={cssClass(
            { padding: "6px 16px", fontSize: 12, borderRadius: 20, cursor: "pointer",
              fontWeight: tab === i ? 700 : 500, border: "none",
              background: tab === i ? "#f18200" : "#f1f5f9",
              color: tab === i ? "#fff" : "#64748b",
              boxShadow: tab === i ? "0 2px 8px rgba(241,130,0,0.3)" : "none"
            })}>
            House {i + 1}
          </button>
        ))}
        <button type="button" onClick={() => { setHouses([...houses, blankHouse(fyMonths)]); setTab(houses.length); }} className={cssClass(
          { marginLeft: "auto", fontSize: 12, color: "#f18200", border: "1px dashed #f18200",
            background: "none", cursor: "pointer", fontWeight: 600, padding: "5px 12px", borderRadius: 20 })}>
          + Add house
        </button>
      </div>

      {}
      <div className={cssClass({ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", marginBottom: 14 })}>
        <div className={cssClass({ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 12 })}>Rent Period & Amount</div>
        <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 })}>
          <div>
            <label className={cssClass(lbl)}>From {req}</label>
            <select value={h.from} onChange={(e) => upd(tab, "from", e.target.value)} className={cssClass(inp)}>
              {fyMonths.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={cssClass(lbl)}>To {req}</label>
            <select value={h.to} onChange={(e) => upd(tab, "to", e.target.value)} className={cssClass(inp)}>
              {fyMonths.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "flex-end" })}>
          <div>
            <label className={cssClass(lbl)}>Monthly Rent Amount {req}</label>
            <div className={cssClass({ display: "flex", border: "1px solid #d1d5db", borderRadius: 6, overflow: "hidden" })}>
              <span className={cssClass({ padding: "7px 10px", background: "#f9fafb", borderRight: "1px solid #d1d5db",
                fontSize: 12, color: "#64748b" })}>₹</span>
              <input type="number" placeholder="Enter amount"
                value={h.monthlyRent || ""}
                onChange={(e) => upd(tab, "monthlyRent", Number(e.target.value) || 0)}
                className={cssClass({ flex: 1, padding: "7px 10px", border: "none", outline: "none", fontSize: 13 })} />
            </div>
          </div>
          <div className={cssClass({ padding: "8px 12px", background: "#fff7ed", border: "1px solid #fed7aa",
            borderRadius: 8, textAlign: "center" })}>
            <div className={cssClass({ fontSize: 10, color: "#92400e", fontWeight: 600, marginBottom: 2 })}>Annual Rent</div>
            <div className={cssClass({ fontSize: 15, fontWeight: 800, color: "#f18200" })}>
              ₹{annualRent.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {}
      <div className={cssClass({ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", marginBottom: 14 })}>
        <div className={cssClass({ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 12 })}>Rental Address</div>
        <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 })}>
          <div>
            <label className={cssClass(lbl)}>House Name / Number</label>
            <input placeholder="Enter name" value={h.houseName || ""} onChange={(e) => upd(tab, "houseName", e.target.value)} className={cssClass(inp)} />
          </div>
          <div>
            <label className={cssClass(lbl)}>Street / Area / Locality</label>
            <input placeholder="Enter details" value={h.street || ""} onChange={(e) => upd(tab, "street", e.target.value)} className={cssClass(inp)} />
          </div>
          <div>
            <label className={cssClass(lbl)}>Town / City</label>
            <input placeholder="Enter details" value={h.city || ""} onChange={(e) => upd(tab, "city", e.target.value)} className={cssClass(inp)} />
          </div>
          <div>
            <label className={cssClass(lbl)}>Pincode {req}</label>
            <input placeholder="Enter pincode" value={h.pincode || ""} onChange={(e) => upd(tab, "pincode", e.target.value)} className={cssClass(inp)} />
          </div>
        </div>
      </div>

      {}
      <div className={cssClass({ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", marginBottom: 14 })}>
        <div className={cssClass({ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 10 })}>Landlord Details</div>
        <div className={cssClass({ marginBottom: 12 })}>
          <label className={cssClass({ fontSize: 12, color: "#475569", display: "block", marginBottom: 8 })}>
            Does your landlord have a PAN?
          </label>
          <div className={cssClass({ display: "flex", gap: 10 })}>
            {[["Yes", true], ["No", false]].map(([lbl2, val]) => (
              <label key={lbl2} className={cssClass({
                display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12,
                padding: "7px 18px", borderRadius: 6,
                border: `1.5px solid ${h.landlordHasPan === val ? "#f18200" : "#e2e8f0"}`,
                background: h.landlordHasPan === val ? "#fff7ed" : "#fff",
                color: h.landlordHasPan === val ? "#c2410c" : "#64748b",
                fontWeight: h.landlordHasPan === val ? 700 : 400
              })}>
                <input type="radio" name={`llpan_${tab}`}
                  checked={h.landlordHasPan === val}
                  onChange={() => upd(tab, "landlordHasPan", val)}
                  className={cssClass({ accentColor: "#f18200" })} />
                {lbl2}
              </label>
            ))}
          </div>
        </div>

        {h.landlordHasPan && (
          <>
            <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 })}>
              <div>
                <label className={cssClass(lbl)}>Landlord's Name {req}</label>
                <input placeholder="Enter name" value={h.landlordName || ""}
                  onChange={(e) => upd(tab, "landlordName", e.target.value)} className={cssClass(inp)} />
              </div>
              <div>
                <label className={cssClass(lbl)}>Landlord's PAN {req}</label>
                <input placeholder="e.g. AXPRA1222M" value={h.landlordPan || ""}
                  onChange={(e) => upd(tab, "landlordPan", e.target.value.toUpperCase())} className={cssClass(inp)} />
              </div>
            </div>
            <div className={cssClass({ marginBottom: 12 })}>
              <label className={cssClass(lbl)}>Relationship with landlord</label>
              <select value={h.landlordRelationship || ""} onChange={(e) => upd(tab, "landlordRelationship", e.target.value)} className={cssClass(inp)}>
                <option value="">Select relationship</option>
                {LANDLORD_RELATIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className={cssClass({ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 10 })}>Landlord's Address</div>
            <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 })}>
              <div>
                <label className={cssClass(lbl)}>House Name / Number</label>
                <input placeholder="Enter name" value={h.landlordHouseName || ""} onChange={(e) => upd(tab, "landlordHouseName", e.target.value)} className={cssClass(inp)} />
              </div>
              <div>
                <label className={cssClass(lbl)}>Street / Area / Locality</label>
                <input placeholder="Enter details" value={h.landlordStreet || ""} onChange={(e) => upd(tab, "landlordStreet", e.target.value)} className={cssClass(inp)} />
              </div>
              <div>
                <label className={cssClass(lbl)}>Town / City</label>
                <input placeholder="Enter details" value={h.landlordCity || ""} onChange={(e) => upd(tab, "landlordCity", e.target.value)} className={cssClass(inp)} />
              </div>
              <div>
                <label className={cssClass(lbl)}>Pincode</label>
                <input placeholder="Enter pincode" value={h.landlordPincode || ""} onChange={(e) => upd(tab, "landlordPincode", e.target.value)} className={cssClass(inp)} />
              </div>
            </div>
          </>
        )}
      </div>

      {houses.length > 1 && (
        <button type="button"
          onClick={() => {
            const h2 = houses.filter((_, i) => i !== tab);
            setHouses(h2);
            setTab(Math.max(0, tab - 1));
          }}
          className={cssClass(
            { fontSize: 12, color: "#dc2626", border: "1px solid #fecaca",
              background: "#fff1f2", borderRadius: 6, cursor: "pointer", padding: "6px 14px",
              display: "flex", alignItems: "center", gap: 4 })}>
          <Trash2 size={12} /> Remove House {tab + 1}
        </button>
      )}
    </Modal>
  );
}

export default React.memo(ModalHRA);

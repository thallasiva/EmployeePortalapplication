import React, { useState } from "react";
import { MapPin, Check } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { SHIFTS, B, EMPTY_FORM } from "../constants";
import Btn from "./Btn";

const HolidayModal = React.memo(({ initial, locations, defaultShift, onClose, onSave }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM, shift: defaultShift, ...(initial || {}) });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.holiday_name.trim() || !form.holiday_date) { alert("Name and date required"); return; }
    setSaving(true);
    try { await onSave(form); }
    catch (err) { alert(err.message); setSaving(false); }
  };

  const shiftInfo = SHIFTS.find((s) => s.key === form.shift);

  return (
    <div className={cssClass({ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center" })}>
      <div className={cssClass({ background: "#fff", borderRadius: 16, padding: 28, width: 480, boxShadow: "0 12px 48px #0003" })}>
        <div className={cssClass({ fontSize: 17, fontWeight: 800, color: "#111827", marginBottom: 20 })}>
          {initial?.holiday_id ? "Edit Holiday" : "Add Holiday"}
        </div>
        <form onSubmit={handleSubmit} className={cssClass({ display: "flex", flexDirection: "column", gap: 14 })}>
          {/* name */}
          <div>
            <label className={cssClass({ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280",
              marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" })}>
              Holiday Name *
            </label>
            <input value={form.holiday_name} onChange={(e) => set("holiday_name", e.target.value)}
              placeholder="e.g. Diwali, Christmas…"
              className={cssClass({ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
                fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" })} />
          </div>
          {/* date */}
          <div>
            <label className={cssClass({ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280",
              marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" })}>Date *</label>
            <input type="date" value={form.holiday_date?.slice(0, 10) || ""}
              onChange={(e) => set("holiday_date", e.target.value)}
              className={cssClass({ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
                fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" })} />
          </div>
          {/* shift */}
          <div>
            <label className={cssClass({ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280",
              marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" })}>Shift</label>
            <div className={cssClass({ display: "flex", gap: 8 })}>
              {SHIFTS.map((s) => (
                <button key={s.key} type="button" onClick={() => set("shift", s.key)}
                  className={cssClass({ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "9px 0", borderRadius: 8,
                    border: `1.5px solid ${form.shift === s.key ? s.color : "#e5e7eb"}`,
                    background: form.shift === s.key ? s.bg : "#fafafa",
                    color: form.shift === s.key ? s.color : "#9ca3af",
                    fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .15s" })}>
                  {s.icon}{s.label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
          {/* location */}
          <div>
            <label className={cssClass({ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280",
              marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" })}>
              Location <span className={cssClass({ fontWeight: 400, textTransform: "none" })}>(blank = all)</span>
            </label>
            <div className={cssClass({ position: "relative" })}>
              <MapPin size={14} className={cssClass({ position: "absolute", left: 10, top: "50%",
                transform: "translateY(-50%)", color: "#9ca3af" })} />
              <input list="loc-list" value={form.location || ""}
                onChange={(e) => set("location", e.target.value)} placeholder="All locations"
                className={cssClass({ width: "100%", padding: "9px 12px 9px 30px", borderRadius: 8,
                  border: "1px solid #e5e7eb", fontSize: 13, outline: "none",
                  boxSizing: "border-box", fontFamily: "inherit" })} />
              <datalist id="loc-list">
                {locations.map((l) => <option key={l} value={l} />)}
              </datalist>
            </div>
          </div>
          {/* restricted */}
          <label className={cssClass({ display: "flex", alignItems: "center", gap: 8,
            fontSize: 13, color: "#374151", cursor: "pointer" })}>
            <input type="checkbox" checked={!!form.is_restricted}
              onChange={(e) => set("is_restricted", e.target.checked)}
              className={cssClass({ accentColor: B, width: 14, height: 14 })} />
            Restricted Holiday
            <span className={cssClass({ color: "#9ca3af", fontSize: 12 })}>(employee opts in)</span>
          </label>
          {/* shift preview */}
          <div className={cssClass({ padding: "10px 14px", borderRadius: 8,
            background: shiftInfo.bg, border: `1px solid ${shiftInfo.border}`,
            display: "flex", alignItems: "center", gap: 8 })}>
            <span className={cssClass({ color: shiftInfo.color })}>{shiftInfo.icon}</span>
            <span className={cssClass({ fontSize: 12, color: shiftInfo.color, fontWeight: 600 })}>
              <strong>{shiftInfo.label}</strong>
              {form.location ? ` · ${form.location}` : " · All locations"}
            </span>
          </div>
          <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 })}>
            <Btn type="button" variant="cancel" onClick={onClose}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>
              <Check size={14} />{saving ? "Saving…" : "Save Holiday"}
            </Btn>
          </div>
        </form>
      </div>
    </div>
  );
});

HolidayModal.displayName = "HolidayModal";
export default HolidayModal;

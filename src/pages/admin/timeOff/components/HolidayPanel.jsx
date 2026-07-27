import React from "react";
import { Plus } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { SHIFTS } from "../constants";
import Btn from "./Btn";
import ShiftHolidayTable from "./ShiftHolidayTable";

const HolidayPanel = React.memo(({ shift, year, locationFilter, allHolidays, loading, onShiftChange, onAddHoliday, onEdit, onDelete }) => {
  const currentShift = SHIFTS.find((s) => s.key === shift);

  return (
    <div className={cssClass({ background: "#fff", border: "1px solid #e9eaec", borderRadius: 14,
      boxShadow: "0 1px 6px #0000000a", overflow: "hidden" })}>
      {/* shift tabs */}
      <div className={cssClass({ display: "flex", borderBottom: "2px solid #e9eaec", background: "#fafafa" })}>
        {SHIFTS.map((s) => {
          const count = allHolidays.filter((h) => h.shift === s.key && (!locationFilter || h.location === locationFilter)).length;
          const active = shift === s.key;
          return (
            <button key={s.key} onClick={() => onShiftChange(s.key)}
              className={cssClass({ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                gap: 7, padding: "14px 10px", fontSize: 13,
                fontWeight: active ? 800 : 500,
                color: active ? s.color : "#9ca3af",
                background: active ? s.bg : "transparent",
                border: "none", cursor: "pointer",
                borderBottom: active ? `2px solid ${s.color}` : "2px solid transparent",
                marginBottom: -2, transition: "all .15s" })}>
              <span className={cssClass({ color: active ? s.color : "#c4c4c4" })}>{s.icon}</span>
              {s.label}
              <span className={cssClass({ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                background: active ? s.color : "#e5e7eb", color: active ? "#fff" : "#9ca3af", marginLeft: 2 })}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* shift info bar */}
      <div className={cssClass({ padding: "12px 20px", display: "flex", alignItems: "center", gap: 10,
        background: currentShift.bg, borderBottom: `1px solid ${currentShift.border}` })}>
        <span className={cssClass({ color: currentShift.color })}>{currentShift.icon}</span>
        <span className={cssClass({ fontSize: 12, fontWeight: 700, color: currentShift.color })}>
          {currentShift.label} Calendar
        </span>
        <span className={cssClass({ fontSize: 12, color: "#9ca3af" })}>
          — visible to all {currentShift.label.toLowerCase()} employees
          {locationFilter ? ` in ${locationFilter}` : ""}
        </span>
        <div className={cssClass({ marginLeft: "auto" })}>
          <Btn size="sm" onClick={onAddHoliday}>
            <Plus size={12} />Add
          </Btn>
        </div>
      </div>

      {/* table area */}
      <div className={cssClass({ padding: "18px 20px" })}>
        {loading ? (
          <div className={cssClass({ textAlign: "center", padding: 48, color: "#9ca3af" })}>Loading…</div>
        ) : (
          <ShiftHolidayTable
            shift={currentShift}
            year={year}
            locationFilter={locationFilter}
            allHolidays={allHolidays}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  );
});

HolidayPanel.displayName = "HolidayPanel";
export default HolidayPanel;

import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { SHIFTS } from "../constants";

const CSVPreviewTable = React.memo(({ preview }) => {
  const shiftCount = (s) => preview.filter((r) => r.shift === s).length;

  return (
    <div className={cssClass({ marginBottom: 18 })}>
      <div className={cssClass({ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 })}>
        Preview — {preview.length} holidays will be imported:
      </div>

      {/* shift count pills */}
      <div className={cssClass({ display: "flex", gap: 8, marginBottom: 12 })}>
        {SHIFTS.map((s) => (
          <div key={s.key} className={cssClass({ flex: 1, padding: "8px 12px", borderRadius: 8,
            background: s.bg, border: `1px solid ${s.border}`, textAlign: "center" })}>
            <div className={cssClass({ fontSize: 18, fontWeight: 900, color: s.color })}>{shiftCount(s.key)}</div>
            <div className={cssClass({ fontSize: 10, color: s.color, fontWeight: 700 })}>{s.label.split(" ")[0]}</div>
          </div>
        ))}
      </div>

      {/* preview table */}
      <div className={cssClass({ border: "1px solid #e9eaec", borderRadius: 8, overflow: "hidden", fontSize: 12 })}>
        <table className={cssClass({ width: "100%", borderCollapse: "collapse" })}>
          <thead>
            <tr className={cssClass({ background: "#fafafa" })}>
              {["Name", "Date", "Shift", "Location", "Restricted"].map((h) => (
                <th key={h} className={cssClass({ padding: "7px 10px", textAlign: "left", fontWeight: 700,
                  fontSize: 10, color: "#9ca3af", borderBottom: "1px solid #e9eaec",
                  textTransform: "uppercase", letterSpacing: ".05em" })}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.slice(0, 10).map((r, i) => {
              const s = SHIFTS.find((x) => x.key === r.shift) || SHIFTS[0];
              return (
                <tr key={i}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                  <td className={cssClass({ padding: "7px 10px", fontWeight: 600, color: "#111827" })}>{r.holiday_name}</td>
                  <td className={cssClass({ padding: "7px 10px", color: "#374151" })}>{r.holiday_date}</td>
                  <td className={cssClass({ padding: "7px 10px" })}>
                    <span className={cssClass({ display: "inline-flex", alignItems: "center", gap: 4,
                      fontSize: 10, fontWeight: 700, color: s.color, background: s.bg,
                      border: `1px solid ${s.border}`, borderRadius: 999, padding: "1px 7px" })}>
                      {s.icon}{s.key}
                    </span>
                  </td>
                  <td className={cssClass({ padding: "7px 10px", color: "#9ca3af" })}>{r.location || "All"}</td>
                  <td className={cssClass({ padding: "7px 10px" })}>
                    <span className={cssClass({ fontSize: 10, color: r.is_restricted ? "#1d4ed8" : "#15803d" })}>
                      {r.is_restricted ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {preview.length > 10 && (
              <tr>
                <td colSpan={5} className={cssClass({ padding: "6px 10px", color: "#9ca3af", fontSize: 11, textAlign: "center" })}>
                  … and {preview.length - 10} more rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

CSVPreviewTable.displayName = "CSVPreviewTable";
export default CSVPreviewTable;

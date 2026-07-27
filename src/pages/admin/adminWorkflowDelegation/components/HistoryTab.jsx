import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { fmtDate } from "../utils/formatters";
import { SectionHead } from "./SharedUI";

const TYPE_COLORS = {
  assign: { bg: "#dcfce7", color: "#16a34a" },
  transfer: { bg: "#dbeafe", color: "#2563eb" },
  bulk_transfer: { bg: "#ede9fe", color: "#7c3aed" },
  delegation: { bg: "#fef3c7", color: "#d97706" },
};

const HistoryTab = React.memo(function HistoryTab({ history }) {
  return (
    <div>
      <SectionHead>Reporting Change Audit History</SectionHead>
      {history.length === 0 ? (
        <div className={cssClass({
          textAlign: "center", padding: 32, color: "#9ca3af",
          background: "#f9fafb", borderRadius: 12,
        })}>
          No history yet. Changes will appear here as they happen.
        </div>
      ) : (
        <div className={cssClass({ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" })}>
          <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
            <thead>
              <tr className={cssClass({ background: "#f9fafb" })}>
                {["Date", "Employee", "Old Manager", "New Manager", "Type", "Reason", "Changed By"].map((h) => (
                  <th key={h} className={cssClass({
                    padding: "10px 14px", textAlign: "left", fontWeight: 600,
                    color: "#6b7280", fontSize: 11, textTransform: "uppercase", whiteSpace: "nowrap",
                  })}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => {
                const tc = TYPE_COLORS[h.change_type] || { bg: "#f3f4f6", color: "#6b7280" };
                return (
                  <tr key={h.id} className={cssClass({ borderTop: i > 0 ? "1px solid #f3f4f6" : "none" })}>
                    <td className={cssClass({ padding: "10px 14px", color: "#6b7280", whiteSpace: "nowrap" })}>
                      {fmtDate(h.created_at)}
                    </td>
                    <td className={cssClass({ padding: "10px 14px", fontWeight: 600, color: "#111827" })}>
                      {h.employee_name || "—"}
                    </td>
                    <td className={cssClass({ padding: "10px 14px", color: "#374151" })}>{h.old_manager_name || "—"}</td>
                    <td className={cssClass({ padding: "10px 14px", color: "#374151" })}>{h.new_manager_name || "—"}</td>
                    <td className={cssClass({ padding: "10px 14px" })}>
                      <span className={cssClass({ ...tc, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" })}>
                        {h.change_type?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className={cssClass({
                      padding: "10px 14px", color: "#6b7280",
                      maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    })}>
                      {h.reason || "—"}
                    </td>
                    <td className={cssClass({ padding: "10px 14px", color: "#374151" })}>{h.changed_by_name || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

export default HistoryTab;

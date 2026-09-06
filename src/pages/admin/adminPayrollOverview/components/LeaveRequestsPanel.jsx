import React from "react";
import { CalendarClock } from "lucide-react";
import Card from "./Card";
import { cssClass } from "../../../../utils/classStyles";

// rows = [{ employee_name, leave_type_name, days, status }]
export default function LeaveRequestsPanel({ rows = [], onViewAll }) {
  return (
    <Card title="Recent Leave Requests (Pending)" icon={<CalendarClock size={16} color="#f18200" />} pad={0}
      right={<button onClick={onViewAll} className={cssClass({ fontSize: 12, fontWeight: 700, color: "#2563eb", background: "none", border: "none", cursor: "pointer" })}>View All</button>}
    >
      {rows.length === 0 ? (
        <div className={cssClass({ padding: 28, textAlign: "center", color: "#98a2b3", fontSize: 12.5 })}>No pending leave requests.</div>
      ) : (
        <table className={cssClass({ width: "100%", borderCollapse: "collapse" })}>
          <thead><tr>
            {["Employee", "Leave Type", "Days", "Status"].map((h) => (
              <th key={h} className={cssClass({ textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "#98a2b3", textTransform: "uppercase", letterSpacing: ".05em", padding: "9px 14px", borderBottom: "1px solid #f2f4f7" })}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className={cssClass({ fontSize: 12, fontWeight: 600, color: "#111827", padding: "9px 14px", borderBottom: "1px solid #f7f8fa" })}>{r.employee_name}</td>
                <td className={cssClass({ fontSize: 12, color: "#475467", padding: "9px 14px", borderBottom: "1px solid #f7f8fa" })}>{r.leave_type_name || "—"}</td>
                <td className={cssClass({ fontSize: 12, color: "#475467", padding: "9px 14px", borderBottom: "1px solid #f7f8fa" })}>{r.days}</td>
                <td className={cssClass({ padding: "9px 14px", borderBottom: "1px solid #f7f8fa" })}>
                  <span className={cssClass({ fontSize: 11, fontWeight: 700, color: "#d97706", background: "#fffbeb", padding: "2px 9px", borderRadius: 999 })}>{r.status || "Pending"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

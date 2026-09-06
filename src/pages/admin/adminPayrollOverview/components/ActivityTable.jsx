import React from "react";
import { History } from "lucide-react";
import Card from "./Card";
import { cssClass } from "../../../../utils/classStyles";

const badge = (status) => {
  const map = { Completed: ["#16a34a", "#f0fdf4"], Processing: ["#d97706", "#fffbeb"], Pending: ["#d97706", "#fffbeb"], Draft: ["#6b7280", "#f3f4f6"], Failed: ["#dc2626", "#fef2f2"] };
  const [c, bg] = map[status] || ["#6b7280", "#f3f4f6"];
  return <span className={cssClass({ fontSize: 11, fontWeight: 700, color: c, background: bg, padding: "2px 9px", borderRadius: 999 })}>{status || "—"}</span>;
};

// rows = [{ when, action, user, status }]
export default function ActivityTable({ rows = [] }) {
  return (
    <Card title="Recent Payroll Activity" icon={<History size={16} color="#6366f1" />} pad={0}>
      {rows.length === 0 ? (
        <div className={cssClass({ padding: 28, textAlign: "center", color: "#98a2b3", fontSize: 12.5 })}>No payroll activity yet.</div>
      ) : (
        <table className={cssClass({ width: "100%", borderCollapse: "collapse" })}>
          <thead><tr>
            {["Date & Time", "Action", "User", "Status"].map((h) => (
              <th key={h} className={cssClass({ textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "#98a2b3", textTransform: "uppercase", letterSpacing: ".05em", padding: "9px 14px", borderBottom: "1px solid #f2f4f7" })}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className={cssClass({ fontSize: 12, color: "#475467", padding: "9px 14px", borderBottom: "1px solid #f7f8fa" })}>{r.when}</td>
                <td className={cssClass({ fontSize: 12, fontWeight: 600, color: "#111827", padding: "9px 14px", borderBottom: "1px solid #f7f8fa" })}>{r.action}</td>
                <td className={cssClass({ fontSize: 12, color: "#475467", padding: "9px 14px", borderBottom: "1px solid #f7f8fa" })}>{r.user}</td>
                <td className={cssClass({ padding: "9px 14px", borderBottom: "1px solid #f7f8fa" })}>{badge(r.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

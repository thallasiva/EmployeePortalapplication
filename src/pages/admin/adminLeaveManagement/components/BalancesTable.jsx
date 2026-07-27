import { memo } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { B } from "../constants/leaveConstants";
import { fmt } from "../utils/leaveUtils";

const BalancesTable = memo(({ filtered, leaveTypes, totals, setEditing }) => (
  <div className={cssClass({ overflowX: "auto", border: "1px solid #e9eaec", borderRadius: 12 })}>
    <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 12 })}>
      <thead>
        <tr className={cssClass({ background: `linear-gradient(90deg,${B},#fb923c)` })}>
          <th className={cssClass({ padding: "10px 14px", textAlign: "left", color: "#fff", fontWeight: 700,
            position: "sticky", left: 0, background: B, zIndex: 3, whiteSpace: "nowrap" })}>
            Employee
          </th>
          <th className={cssClass({ padding: "10px 10px", color: "#fff", fontWeight: 700, textAlign: "left" })}>Dept</th>
          {leaveTypes.map((lt) => (
            <th key={lt.leave_type_id} className={cssClass({ padding: "10px 8px", color: "#fff", fontWeight: 700,
              textAlign: "center", minWidth: 90, whiteSpace: "nowrap" })}>
              <div>{lt.short_code || lt.leave_type_name}</div>
              <div className={cssClass({ fontSize: 10, opacity: .8 })}>{lt.annual_quota}d/yr</div>
            </th>
          ))}
          <th className={cssClass({ padding: "10px 8px", color: "#fff", fontWeight: 700, textAlign: "center", minWidth: 70 })}>Total<br />Availed</th>
          <th className={cssClass({ padding: "10px 8px", color: "#fff", fontWeight: 700, textAlign: "center", minWidth: 70 })}>Total<br />Balance</th>
        </tr>
        <tr className={cssClass({ background: "#fff8f0" })}>
          <th className={cssClass({ padding: "4px 14px", position: "sticky", left: 0, background: "#fff8f0", zIndex: 3 })} />
          <th />
          {leaveTypes.map((lt) => (
            <th key={lt.leave_type_id} className={cssClass({ padding: "4px 8px", textAlign: "center" })}>
              <div className={cssClass({ display: "flex", justifyContent: "center", gap: 4, fontSize: 10, color: "#9ca3af", fontWeight: 600 })}>
                <span>Gr</span><span>/</span>
                <span className={cssClass({ color: "#dc2626" })}>Av</span><span>/</span>
                <span className={cssClass({ color: "#16a34a" })}>Bal</span>
              </div>
            </th>
          ))}
          <th /><th />
        </tr>
      </thead>

      <tbody>
        {filtered.map((emp, idx) => {
          const totalAv  = emp.balances.reduce((s, b) => s + b.availed, 0);
          const totalBal = emp.balances.reduce((s, b) => s + b.balance, 0);
          return (
            <tr key={emp.employee_id}
              onMouseEnter={(e) => e.currentTarget.style.background = "#fff8f0"}
              onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafafa"}
              className={cssClass({ background: idx % 2 === 0 ? "#fff" : "#fafafa" })}>
              <td className={cssClass({ padding: "9px 14px", position: "sticky", left: 0, background: "inherit", zIndex: 1 })}>
                <div className={cssClass({ fontWeight: 600, color: "#111827", fontSize: 12 })}>{emp.employee_name}</div>
                <div className={cssClass({ fontSize: 10, color: "#9ca3af" })}>{emp.emp_code}</div>
              </td>
              <td className={cssClass({ padding: "9px 10px", color: "#6b7280" })}>{emp.department_name || "—"}</td>
              {emp.balances.map((b) => (
                <td key={b.leave_type_id}
                  onClick={() => setEditing({ emp, bal: b })}
                  className={cssClass({ padding: "9px 8px", textAlign: "center", cursor: "pointer" })}>
                  <span className={cssClass({ color: "#374151" })}>{fmt(b.granted)}</span>
                  {" / "}
                  <span className={cssClass({ color: "#dc2626" })}>{fmt(b.availed)}</span>
                  {" / "}
                  <span className={cssClass({ color: "#16a34a", fontWeight: 700 })}>{fmt(b.balance)}</span>
                  {!b.initialized && (
                    <span className={cssClass({ marginLeft: 2, fontSize: 9, color: "#d1d5db" })}>⊕</span>
                  )}
                </td>
              ))}
              <td className={cssClass({ padding: "9px 8px", textAlign: "center", color: "#dc2626", fontWeight: 700 })}>{fmt(totalAv)}</td>
              <td className={cssClass({ padding: "9px 8px", textAlign: "center", color: "#16a34a", fontWeight: 700 })}>{fmt(totalBal)}</td>
            </tr>
          );
        })}

        {/* Totals row */}
        <tr className={cssClass({ background: "#f9fafb", fontWeight: 700 })}>
          <td className={cssClass({ padding: "9px 14px", position: "sticky", left: 0, background: "#f9fafb", color: "#374151", fontSize: 12 })}>
            TOTAL ({filtered.length})
          </td>
          <td />
          {leaveTypes.map((lt) => (
            <td key={lt.leave_type_id} className={cssClass({ padding: "9px 8px", textAlign: "center", fontSize: 12 })}>
              {fmt(totals[lt.leave_type_id]?.granted)}
              {" / "}
              <span className={cssClass({ color: "#dc2626" })}>{fmt(totals[lt.leave_type_id]?.availed)}</span>
              {" / "}
              <span className={cssClass({ color: "#16a34a" })}>{fmt(totals[lt.leave_type_id]?.balance)}</span>
            </td>
          ))}
          <td className={cssClass({ textAlign: "center", color: "#dc2626" })}>
            {fmt(Object.values(totals).reduce((s, t) => s + t.availed, 0))}
          </td>
          <td className={cssClass({ textAlign: "center", color: "#16a34a" })}>
            {fmt(Object.values(totals).reduce((s, t) => s + t.balance, 0))}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
));

BalancesTable.displayName = "BalancesTable";
export default BalancesTable;

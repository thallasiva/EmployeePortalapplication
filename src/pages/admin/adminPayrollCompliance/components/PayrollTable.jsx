import React from "react";
import { cssClass } from "../../../../utils/classStyles";

function PayrollTable({ cols, rows, emptyMsg = "No data" }) {
  if (!rows.length) {
    return (
      <div className={cssClass({ textAlign: "center", padding: 60, color: "#aaa", fontSize: 14 })}>
        {emptyMsg}
      </div>
    );
  }
  return (
    <div className={cssClass({ overflowX: "auto" })}>
      <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
        <thead>
          <tr className={cssClass({ background: "#fafafa" })}>
            {cols.map((c) => (
              <th
                key={c.key}
                className={cssClass({
                  padding: "10px 12px",
                  textAlign: c.right ? "right" : "left",
                  borderBottom: "2px solid #eee",
                  color: "#555",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                })}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={cssClass({ background: i % 2 === 0 ? "#fff" : "#fafafa" })}>
              {cols.map((c) => (
                <td
                  key={c.key}
                  className={cssClass({
                    padding: "9px 12px",
                    borderBottom: "1px solid #f0f0f0",
                    textAlign: c.right ? "right" : "left",
                    color: "#333",
                    whiteSpace: "nowrap",
                  })}
                >
                  {c.render ? c.render(r) : r[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default React.memo(PayrollTable);

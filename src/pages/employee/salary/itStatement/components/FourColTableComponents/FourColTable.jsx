import React from "react";
import { cssClass } from "../../../../../../utils/classStyles";
import { TH } from "../../constants";
import { tbl } from "./shared";
const FourColTable = React.memo(function FourColTable({
  rows
}) {
  return <table className={cssClass({
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12
  })}>
      <thead>
        <tr className={cssClass({
        background: "#e8f4fa"
      })}>
          <th className={cssClass({
          ...TH,
          textAlign: "left",
          minWidth: 180
        })}>Items</th>
          <th className={cssClass({
          ...TH,
          textAlign: "right",
          minWidth: 120
        })}>Raw Tax</th>
          <th className={cssClass({
          ...TH,
          textAlign: "right",
          minWidth: 100
        })}>Surcharge</th>
          <th className={cssClass({
          ...TH,
          textAlign: "right",
          minWidth: 140
        })}>Health &amp; Edu Cess</th>
          <th className={cssClass({
          ...TH,
          textAlign: "right",
          minWidth: 120
        })}>Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => <tr key={i} className={cssClass({
        background: r.bold ? "#e8f4fa" : "#fff",
        borderBottom: "1px solid #f1f5f9"
      })}>
            <td className={cssClass({
          padding: "7px 12px",
          fontSize: 12,
          color: "#475569",
          fontWeight: r.bold ? 700 : 400
        })}>{r.label}</td>
            <td className={cssClass({
          padding: "7px 12px",
          textAlign: "right",
          fontSize: 12,
          fontWeight: r.bold ? 700 : 400,
          color: "#334155"
        })}>{tbl(r.raw)}</td>
            <td className={cssClass({
          padding: "7px 12px",
          textAlign: "right",
          fontSize: 12,
          fontWeight: r.bold ? 700 : 400,
          color: "#334155"
        })}>{tbl(r.surcharge)}</td>
            <td className={cssClass({
          padding: "7px 12px",
          textAlign: "right",
          fontSize: 12,
          fontWeight: r.bold ? 700 : 400,
          color: "#334155"
        })}>{tbl(r.cess)}</td>
            <td className={cssClass({
          padding: "7px 12px",
          textAlign: "right",
          fontSize: 12,
          fontWeight: r.bold ? 700 : 400,
          color: r.bold ? "#e87500" : "#334155"
        })}>{tbl(r.total)}</td>
          </tr>)}
      </tbody>
    </table>;
});
export { FourColTable };

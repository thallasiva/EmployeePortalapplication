import React from "react";
import { cssClass } from "../../../../../../utils/classStyles";
import { TSS, TN } from "../../constants";
import { ColHead, SecHdr } from ".././TablePrimitives";
import { ChevronDown } from "lucide-react";
import { tbl, INCOME_ROWS } from "./shared";
const SectionA = React.memo(function SectionA({
  open,
  onToggle,
  fiscalMonths,
  monthData,
  T
}) {
  return <>
      <SecHdr label="A. Income" amount={T.gross} expanded={open} onToggle={onToggle} />
      {open && <div className={cssClass({
      overflowX: "auto"
    })}>
          <table className={cssClass({
        width: "100%",
        borderCollapse: "collapse"
      })}>
            <ColHead fiscalMonths={fiscalMonths} />
            <tbody>
              <tr className={cssClass({
            background: "#f8fafc"
          })}>
                <td colSpan={fiscalMonths.length + 2} className={cssClass({
              padding: "6px 14px",
              fontSize: 11,
              fontWeight: 700,
              color: "#64748b",
              borderBottom: "1px solid #e2e8f0"
            })}><ChevronDown size={12} style={{
                display: "inline",
                verticalAlign: "-2px"
              }} /> Monthly Income</td>
              </tr>
              {INCOME_ROWS.map(({
            key,
            label
          }) => <tr key={key}>
                  <td className={cssClass(TSS(0, false))}>{label}</td>
                  <td className={cssClass({
              ...TSS(160, false),
              textAlign: "right"
            })}>{tbl(T[key])}</td>
                  {monthData.map((m, i) => <td key={i} className={cssClass({
              ...TN(false),
              color: m[key] > 0 ? "#334155" : "#94a3b8"
            })}>{tbl(m[key])}</td>)}
                </tr>)}
              <tr className={cssClass({
            background: "#e8f4fa"
          })}>
                <td className={cssClass({
              ...TSS(0, true),
              background: "#e8f4fa"
            })}>Sub Total</td>
                <td className={cssClass({
              ...TSS(160, true),
              background: "#e8f4fa",
              textAlign: "right"
            })}>{tbl(T.gross)}</td>
                {monthData.map((m, i) => <td key={i} className={cssClass({
              ...TN(true),
              color: m.gross > 0 ? "#1e293b" : "#94a3b8"
            })}>{tbl(m.gross)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>}
    </>;
});
export { SectionA };

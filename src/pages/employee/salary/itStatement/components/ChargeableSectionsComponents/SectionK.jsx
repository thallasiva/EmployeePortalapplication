import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cssClass } from "../../../../../../utils/classStyles";
import { SecHdr } from ".././TablePrimitives";
import { tbl } from "./shared";
const SectionK = React.memo(function SectionK({
  open,
  onToggle,
  openKi,
  onToggleKi,
  openKh,
  onToggleKh
}) {
  return <>
      <SecHdr label="K. Income From Other Sources (Including House Properties)" amount={0} expanded={open} onToggle={onToggle} />
      {open && <div className={cssClass({
      background: "#fff",
      borderBottom: "1px solid #e2e8f0"
    })}>
          <div onClick={onToggleKi} className={cssClass({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 14px",
        borderBottom: "1px solid #f1f5f9",
        cursor: "pointer"
      })}>
            <div className={cssClass({
          display: "flex",
          alignItems: "center",
          gap: 6
        })}>
              {openKi ? <ChevronDown size={12} color="#64748b" /> : <ChevronRight size={12} color="#64748b" />}
              <span className={cssClass({
            fontSize: 12,
            color: "#475569"
          })}>Other Incomes</span>
            </div>
            <span className={cssClass({
          fontSize: 12,
          color: "#94a3b8"
        })}>{tbl(0)}</span>
          </div>
          <div onClick={onToggleKh} className={cssClass({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 14px",
        borderBottom: "1px solid #f1f5f9",
        cursor: "pointer"
      })}>
            <div className={cssClass({
          display: "flex",
          alignItems: "center",
          gap: 6
        })}>
              {openKh ? <ChevronDown size={12} color="#64748b" /> : <ChevronRight size={12} color="#64748b" />}
              <span className={cssClass({
            fontSize: 12,
            color: "#475569"
          })}>Income/Loss from house properties</span>
            </div>
            <span className={cssClass({
          fontSize: 12,
          color: "#94a3b8"
        })}>{tbl(0)}</span>
          </div>
        </div>}
    </>;
});
export { SectionK };

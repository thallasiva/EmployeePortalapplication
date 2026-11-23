import React, { useEffect, useState, useMemo } from "react";
import { TrendingUp, Download } from "lucide-react";
import { getMySalaryStructure, listSalaryStructures } from "../../../../api/payroll.api";
import { buildSalaryBreakdown } from "../../../../utils/salaryBreakdown";
import { getCurrentUser } from "../../../../api/auth.api";
import { cssClass } from "../../../../utils/classStyles";
import { fmtAmt, formatDateLabel, formatPayoutMonth, getDurationLabel } from "./shared";
import { RevisionLineChart } from "./RevisionLineChart";
function SalaryRevision() {
  const [loading, setLoading] = useState(true);
  const [structure, setStructure] = useState(null);
  const [allStructures, setAll] = useState([]);
  useEffect(() => {
    Promise.all([getMySalaryStructure().catch(() => null), getCurrentUser().catch(() => null)]).then(async ([s, u]) => {
      setStructure(s);
      if (u?.employee_id) {
        const all = await listSalaryStructures({
          employee_id: u.employee_id,
          limit: 50
        }).catch(() => []);
        setAll(Array.isArray(all) ? all.sort((a, b) => new Date(b.effective_date || b.effective_from) - new Date(a.effective_date || a.effective_from)) : []);
      }
    }).finally(() => setLoading(false));
  }, []);
  const breakdown = useMemo(() => {
    const basic = Number(structure?.basic || 0);
    return basic > 0 ? buildSalaryBreakdown({
      basic
    }) : null;
  }, [structure]);
  const effectiveDate = structure?.effective_from || structure?.effective_date || null;
  const revisionRows = useMemo(() => {
    if (!allStructures.length && structure) {
      const ctc = breakdown ? (breakdown.totalEarnings + breakdown.pf) * 12 : 0;
      return [{
        effectiveDate,
        newCTC: ctc,
        prevCTC: 0,
        payoutMonth: effectiveDate,
        duration: 0,
        diffAmt: ctc,
        diffPct: null
      }];
    }
    return allStructures.map((s, i) => {
      const b = buildSalaryBreakdown(s);
      const newCTC = b ? b.ctc * 12 : 0;
      const prevS = allStructures[i + 1];
      const prevB = prevS ? buildSalaryBreakdown(prevS) : null;
      const prevCTC = prevB ? (prevB.totalEarnings + prevB.pf) * 12 : 0;
      const effDate = s.effective_from || s.effective_date;
      const prevEffDate = prevS?.effective_from || prevS?.effective_date;
      const durationMs = prevEffDate ? new Date(effDate) - new Date(prevEffDate) : 0;
      const diffAmt = newCTC - prevCTC;
      const diffPct = prevCTC > 0 ? Math.round(diffAmt / prevCTC * 100) : null;
      return {
        effectiveDate: effDate,
        newCTC,
        prevCTC,
        payoutMonth: effDate,
        duration: durationMs,
        diffAmt,
        diffPct
      };
    });
  }, [allStructures, structure, breakdown, effectiveDate]);
  const lastRevision = revisionRows[0];
  const durationSince = lastRevision?.effectiveDate ? getDurationLabel(Date.now() - new Date(lastRevision.effectiveDate).getTime()) : "—";
  if (loading) {
    return <div className={cssClass({
      padding: 40,
      textAlign: "center",
      color: "#94a3b8"
    })}>Loading…</div>;
  }
  if (!structure) {
    return <div className={cssClass({
      padding: 60,
      textAlign: "center"
    })}>
        <TrendingUp size={52} strokeWidth={1} className={cssClass({
        color: "#cbd5e1",
        marginBottom: 12
      })} />
        <p className={cssClass({
        color: "#94a3b8",
        fontSize: 14
      })}>No salary structure found. Please contact HR.</p>
      </div>;
  }
  return <div className={cssClass({
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: 24
  })}>
      {}
      <div className={cssClass({
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14,
      marginBottom: 20,
      maxWidth: 640
    })}>
        <div className={cssClass({
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "16px 18px"
      })}>
          <div className={cssClass({
          fontSize: 11,
          color: "#94a3b8",
          marginBottom: 4
        })}>Duration since last revision</div>
          <div className={cssClass({
          fontSize: 18,
          fontWeight: 800,
          color: "#1e293b"
        })}>{durationSince}</div>
        </div>
        <div className={cssClass({
        background: "#fffde7",
        border: "1px solid #f0e680",
        borderRadius: 10,
        padding: "16px 18px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10
      })}>
          <div>
            <div className={cssClass({
            fontSize: 10,
            color: "#9e9e5a"
          })}>Last Revision Period</div>
            <div className={cssClass({
            fontSize: 14,
            fontWeight: 700,
            color: "#1a1a1a",
            marginTop: 2
          })}>
              {lastRevision?.effectiveDate ? new Date(lastRevision.effectiveDate).toLocaleDateString("en-CA") : "—"}
            </div>
          </div>
          <div>
            <div className={cssClass({
            fontSize: 10,
            color: "#9e9e5a"
          })}>Last Revision Percentage</div>
            <div className={cssClass({
            fontSize: 14,
            fontWeight: 700,
            color: "#16a34a",
            marginTop: 2
          })}>
              {lastRevision?.diffPct != null ? `+${lastRevision.diffPct}%` : "—"}
            </div>
          </div>
        </div>
      </div>
      {}
      <div className={cssClass({
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: "16px 20px",
      marginBottom: 20
    })}>
        <div className={cssClass({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14
      })}>
          <span className={cssClass({
          fontSize: 14,
          fontWeight: 700,
          color: "#1e293b"
        })}>CTC Revision Timeline</span>
          <button className={cssClass({
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          background: "#e87500",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer"
        })}>
            <Download size={13} /> Download
          </button>
        </div>
        <RevisionLineChart rows={[...revisionRows].reverse()} />
      </div>
      {}
      <div className={cssClass({
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      overflow: "hidden"
    })}>
        <div className={cssClass({
        padding: "14px 18px",
        borderBottom: "1px solid #f1f5f9",
        background: "#fafbfc"
      })}>
          <span className={cssClass({
          fontSize: 14,
          fontWeight: 700,
          color: "#1e293b"
        })}>CTC Revision Details</span>
        </div>
        <div className={cssClass({
        overflowX: "auto"
      })}>
          <table className={cssClass({
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 12
        })}>
            <thead>
              <tr className={cssClass({
              background: "#f8fafc"
            })}>
                {["Last Revision Date", "Payout Month", "Revised Monthly CTC in ₹", "Previous Monthly CTC in ₹", "Duration between revision", "Amount in ₹", "Percentage"].map(h => <th key={h} className={cssClass({
                padding: "10px 14px",
                textAlign: "left",
                color: "#64748b",
                fontWeight: 600,
                borderBottom: "1px solid #e8edf2",
                whiteSpace: "nowrap"
              })}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {revisionRows.map((row, i) => <tr key={i} className={cssClass({
              borderBottom: "1px solid #f1f5f9"
            })}>
                  <td className={cssClass({
                padding: "11px 14px",
                color: "#334155"
              })}>{formatDateLabel(row.effectiveDate)}</td>
                  <td className={cssClass({
                padding: "11px 14px",
                color: "#334155"
              })}>{formatPayoutMonth(row.payoutMonth)}</td>
                  <td className={cssClass({
                padding: "11px 14px",
                fontWeight: 600,
                color: "#1e293b"
              })}>{fmtAmt(row.newCTC / 12)}</td>
                  <td className={cssClass({
                padding: "11px 14px",
                color: "#64748b"
              })}>{row.prevCTC > 0 ? fmtAmt(row.prevCTC / 12) : "0.00"}</td>
                  <td className={cssClass({
                padding: "11px 14px",
                color: "#64748b"
              })}>{row.duration > 0 ? getDurationLabel(row.duration) : "—"}</td>
                  <td className={cssClass({
                padding: "11px 14px",
                color: row.diffAmt > 0 ? "#16a34a" : "#64748b"
              })}>{row.diffAmt > 0 ? fmtAmt(row.diffAmt / 12) : "0.00"}</td>
                  <td className={cssClass({
                padding: "11px 14px"
              })}>
                    {row.diffPct != null ? <span className={cssClass({
                  color: "#16a34a",
                  fontWeight: 700
                })}>+{row.diffPct}%</span> : <span className={cssClass({
                  color: "#94a3b8"
                })}>—</span>}
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>;
}
export { SalaryRevision };

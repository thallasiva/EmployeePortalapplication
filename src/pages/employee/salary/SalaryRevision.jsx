import React, { useEffect, useState, useMemo } from "react";
import { TrendingUp, Download } from "lucide-react";
import { getMySalaryStructure, listSalaryStructures } from "../../../api/payroll.api";
import { buildSalaryBreakdown } from "../../../utils/salaryBreakdown";
import { getCurrentUser } from "../../../api/auth.api";import { cssClass, joinClasses } from "../../../utils/classStyles";

const fmt = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const fmtAmt = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function parseDateStr(d) {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt) ? null : dt;
}

function formatDateLabel(d) {
  if (!d) return "—";
  const dt = parseDateStr(d);
  if (!dt) return d;
  return dt.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatPayoutMonth(d) {
  if (!d) return "—";
  const dt = parseDateStr(d);
  if (!dt) return d;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[dt.getMonth()]}, ${dt.getFullYear()}`;
}

function getDurationLabel(ms) {
  if (ms <= 0) return "—";
  const days = Math.floor(ms / 86400000);
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  const remDays = days % 30;
  const parts = [`${months} month${months !== 1 ? "s" : ""}`];
  if (remDays > 0) parts.push(`${remDays} day${remDays !== 1 ? "s" : ""}`);
  return parts.join(" ");
}


function RevisionLineChart({ rows }) {
  if (!rows || rows.length < 1) return null;

  const W = 800,H = 200,PAD = { top: 20, right: 30, bottom: 40, left: 60 };
  const inner = { w: W - PAD.left - PAD.right, h: H - PAD.top - PAD.bottom };

  const values = rows.map((r) => Number(r.newCTC) || 0);
  const min = Math.min(...values) * 0.95;
  const max = Math.max(...values) * 1.05;

  const toX = (i) => PAD.left + (rows.length === 1 ? inner.w / 2 : i / (rows.length - 1) * inner.w);
  const toY = (v) => PAD.top + inner.h - (v - min) / (max - min || 1) * inner.h;

  const points = rows.map((r, i) => `${toX(i)},${toY(Number(r.newCTC) || 0)}`).join(" ");
  const fillPoints = [`${toX(0)},${PAD.top + inner.h}`, ...rows.map((r, i) => `${toX(i)},${toY(Number(r.newCTC) || 0)}`), `${toX(rows.length - 1)},${PAD.top + inner.h}`].join(" ");

  const fmtL = (n) => {
    const v = Math.round(Number(n) || 0);
    return v >= 100000 ? `${(v / 100000).toFixed(2)}L` : `${(v / 1000).toFixed(0)}k`;
  };


  const yTicks = 4;
  const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) => min + i / yTicks * (max - min));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" className={cssClass({ fontFamily: "sans-serif" })}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {}
      {yTickVals.map((v, i) =>
      <g key={i}>
          <line x1={PAD.left} y1={toY(v)} x2={PAD.left + inner.w} y2={toY(v)} stroke="#f1f5f9" strokeWidth={1} />
          <text x={PAD.left - 6} y={toY(v) + 4} textAnchor="end" fontSize={9} fill="#94a3b8">{fmtL(v)}</text>
        </g>
      )}

      {}
      <polygon points={fillPoints} fill="url(#lineGrad)" />

      {}
      <polyline points={points} fill="none" stroke="#f97316" strokeWidth={2.5} strokeLinejoin="round" />

      {}
      {rows.map((r, i) => {
        const x = toX(i);
        const y = toY(Number(r.newCTC) || 0);
        const dt = parseDateStr(r.effectiveDate);
        const label = dt ? dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—";
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={5} fill="#f97316" stroke="#fff" strokeWidth={2} />
            <text x={x} y={PAD.top + inner.h + 18} textAnchor="middle" fontSize={9} fill="#94a3b8">{label}</text>
          </g>);

      })}
    </svg>);

}


export default function SalaryRevision() {
  const [loading, setLoading] = useState(true);
  const [structure, setStructure] = useState(null);
  const [allStructures, setAll] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    Promise.all([
    getMySalaryStructure().catch(() => null),
    getCurrentUser().catch(() => null)]
    ).then(async ([s, u]) => {
      setStructure(s);
      setUser(u);

      if (u?.employee_id) {
        const all = await listSalaryStructures({ employee_id: u.employee_id, limit: 50 }).catch(() => []);
        setAll(Array.isArray(all) ? all.sort((a, b) => new Date(b.effective_date || b.effective_from) - new Date(a.effective_date || a.effective_from)) : []);
      }
    }).finally(() => setLoading(false));
  }, []);

  const breakdown = useMemo(() => {
    const basic = Number(structure?.basic || 0);
    return basic > 0 ? buildSalaryBreakdown({ basic }) : null;
  }, [structure]);

  const currentCTC = breakdown ? (breakdown.totalEarnings + breakdown.pf) * 12 : 0;
  const effectiveDate = structure?.effective_from || structure?.effective_date || null;


  const revisionRows = useMemo(() => {
    if (!allStructures.length && structure) {

      const ctc = breakdown ? (breakdown.totalEarnings + breakdown.pf) * 12 : 0;
      return [{ effectiveDate, newCTC: ctc, prevCTC: 0, payoutMonth: effectiveDate, duration: 0, diffAmt: ctc, diffPct: null }];
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
      return { effectiveDate: effDate, newCTC, prevCTC, payoutMonth: effDate, duration: durationMs, diffAmt, diffPct };
    });
  }, [allStructures, structure, breakdown, effectiveDate]);


  const lastRevision = revisionRows[0];
  const durationSince = lastRevision?.effectiveDate ?
  getDurationLabel(Date.now() - new Date(lastRevision.effectiveDate).getTime()) :
  "—";

  if (loading) {
    return <div className={cssClass({ padding: 40, textAlign: "center", color: "#94a3b8" })}>Loading…</div>;
  }

  if (!structure) {
    return (
      <div className={cssClass({ padding: 60, textAlign: "center" })}>
        <TrendingUp size={52} strokeWidth={1} className={cssClass({ color: "#cbd5e1", marginBottom: 12 })} />
        <p className={cssClass({ color: "#94a3b8", fontSize: 14 })}>No salary structure found. Please contact HR.</p>
      </div>);

  }

  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f5f7fb", padding: 24 })}>

      {}
      <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20, maxWidth: 640 })}>
        <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 18px" })}>
          <div className={cssClass({ fontSize: 11, color: "#94a3b8", marginBottom: 4 })}>Duration since last revision</div>
          <div className={cssClass({ fontSize: 18, fontWeight: 800, color: "#1e293b" })}>{durationSince}</div>
        </div>
        <div className={cssClass({ background: "#fffde7", border: "1px solid #f0e680", borderRadius: 10, padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 })}>
          <div>
            <div className={cssClass({ fontSize: 10, color: "#9e9e5a" })}>Last Revision Period</div>
            <div className={cssClass({ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginTop: 2 })}>
              {lastRevision?.effectiveDate ? new Date(lastRevision.effectiveDate).toLocaleDateString("en-CA") : "—"}
            </div>
          </div>
          <div>
            <div className={cssClass({ fontSize: 10, color: "#9e9e5a" })}>Last Revision Percentage</div>
            <div className={cssClass({ fontSize: 14, fontWeight: 700, color: "#16a34a", marginTop: 2 })}>
              {lastRevision?.diffPct != null ? `+${lastRevision.diffPct}%` : "—"}
            </div>
          </div>
        </div>
      </div>

      {}
      <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", marginBottom: 20 })}>
        <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 })}>
          <span className={cssClass({ fontSize: 14, fontWeight: 700, color: "#1e293b" })}>CTC Revision Timeline</span>
          <button className={cssClass({ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#f18200", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" })}>
            <Download size={13} /> Download
          </button>
        </div>
        <RevisionLineChart rows={[...revisionRows].reverse()} />
      </div>

      {}
      <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" })}>
        <div className={cssClass({ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc" })}>
          <span className={cssClass({ fontSize: 14, fontWeight: 700, color: "#1e293b" })}>CTC Revision Details</span>
        </div>
        <div className={cssClass({ overflowX: "auto" })}>
          <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 12 })}>
            <thead>
              <tr className={cssClass({ background: "#f8fafc" })}>
                {["Last Revision Date", "Payout Month", "Revised Monthly CTC in ₹", "Previous Monthly CTC in ₹", "Duration between revision", "Amount in ₹", "Percentage"].map((h) =>
                <th key={h} className={cssClass({ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, borderBottom: "1px solid #e8edf2", whiteSpace: "nowrap" })}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {revisionRows.map((row, i) =>
              <tr key={i} className={cssClass({ borderBottom: "1px solid #f1f5f9" })}>
                  <td className={cssClass({ padding: "11px 14px", color: "#334155" })}>{formatDateLabel(row.effectiveDate)}</td>
                  <td className={cssClass({ padding: "11px 14px", color: "#334155" })}>{formatPayoutMonth(row.payoutMonth)}</td>
                  <td className={cssClass({ padding: "11px 14px", fontWeight: 600, color: "#1e293b" })}>{fmtAmt(row.newCTC / 12)}</td>
                  <td className={cssClass({ padding: "11px 14px", color: "#64748b" })}>{row.prevCTC > 0 ? fmtAmt(row.prevCTC / 12) : "0.00"}</td>
                  <td className={cssClass({ padding: "11px 14px", color: "#64748b" })}>{row.duration > 0 ? getDurationLabel(row.duration) : "—"}</td>
                  <td className={cssClass({ padding: "11px 14px", color: row.diffAmt > 0 ? "#16a34a" : "#64748b" })}>{row.diffAmt > 0 ? fmtAmt(row.diffAmt / 12) : "0.00"}</td>
                  <td className={cssClass({ padding: "11px 14px" })}>
                    {row.diffPct != null ?
                  <span className={cssClass({ color: "#16a34a", fontWeight: 700 })}>+{row.diffPct}%</span> :

                  <span className={cssClass({ color: "#94a3b8" })}>—</span>
                  }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}

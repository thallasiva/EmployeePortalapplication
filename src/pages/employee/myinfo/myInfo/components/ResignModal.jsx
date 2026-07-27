import React, { useState } from "react";
import { LogOut, Clock, AlertTriangle, X } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { RESIGN_REASONS } from "../constants";
import { fmtDate, noticeDays, minDate } from "../utils";

const ResignModal = React.memo(function ResignModal({ onClose, onSubmit, saving }) {
  const [reason,   setReason]   = useState("");
  const [lwd,      setLwd]      = useState("");
  const [comments, setComments] = useState("");
  const [step,     setStep]     = useState(1);

  const notice     = noticeDays(lwd);
  const canProceed = reason && lwd;

  return (
    <div className={cssClass({ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 })}>
      <div className={cssClass({ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 500, boxShadow: "0 24px 80px rgba(0,0,0,0.18)", overflow: "hidden" })}>
        {/* Header */}
        <div className={cssClass({ background: "linear-gradient(135deg,#dc2626,#b91c1c)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" })}>
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 12 })}>
            <div className={cssClass({ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" })}>
              <LogOut size={20} color="#fff" />
            </div>
            <div>
              <p className={cssClass({ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" })}>Initiate Resignation</p>
              <p className={cssClass({ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.75)" })}>
                {step === 1 ? "Fill in your resignation details" : "Confirm your resignation"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={cssClass({ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.8)" })}>
            <X size={20} />
          </button>
        </div>

        {/* Step tabs */}
        <div className={cssClass({ display: "flex", borderBottom: "1px solid #f1f5f9" })}>
          {["Resignation Details", "Confirmation"].map((s, i) => (
            <div key={s} className={cssClass({ flex: 1, padding: "10px 0", textAlign: "center", fontSize: 12, fontWeight: step === i + 1 ? 700 : 500, color: step === i + 1 ? "#dc2626" : "#94a3b8", borderBottom: step === i + 1 ? "2px solid #dc2626" : "2px solid transparent" })}>
              <span className={cssClass({ width: 20, height: 20, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", marginRight: 6, fontSize: 11, background: step === i + 1 ? "#dc2626" : "#f1f5f9", color: step === i + 1 ? "#fff" : "#94a3b8" })}>{i + 1}</span>
              {s}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className={cssClass({ padding: 24 })}>
            <div className={cssClass({ marginBottom: 16 })}>
              <label className={cssClass({ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
                Reason for Resignation <span className={cssClass({ color: "#ef4444" })}>*</span>
              </label>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className={cssClass({ width: "100%", height: 40, padding: "0 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff", color: reason ? "#1e293b" : "#94a3b8" })}>
                <option value="">Select reason…</option>
                {RESIGN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className={cssClass({ marginBottom: 16 })}>
              <label className={cssClass({ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
                Last Working Day <span className={cssClass({ color: "#ef4444" })}>*</span>
              </label>
              <input type="date" value={lwd} min={minDate()} onChange={(e) => setLwd(e.target.value)} className={cssClass({ width: "100%", height: 40, padding: "0 12px", boxSizing: "border-box", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none" })} />
            </div>
            {lwd && (
              <div className={cssClass({ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" })}>
                <Clock size={15} color="#f18200" className={cssClass({ marginTop: 1, flexShrink: 0 })} />
                <div>
                  <p className={cssClass({ margin: 0, fontSize: 12, fontWeight: 700, color: "#c2410c" })}>Notice Period: {notice} day{notice !== 1 ? "s" : ""}</p>
                  <p className={cssClass({ margin: "2px 0 0", fontSize: 11, color: "#92400e" })}>Serving from today until {fmtDate(lwd)}</p>
                </div>
              </div>
            )}
            <div className={cssClass({ marginBottom: 20 })}>
              <label className={cssClass({ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
                Additional Comments <span className={cssClass({ fontSize: 11, color: "#94a3b8", fontWeight: 400 })}>(optional)</span>
              </label>
              <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3} placeholder="Share any additional context or message for HR…" className={cssClass({ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", color: "#1e293b" })} />
            </div>
            <div className={cssClass({ display: "flex", gap: 10 })}>
              <button onClick={() => canProceed && setStep(2)} disabled={!canProceed} className={cssClass({ flex: 1, padding: "11px 0", borderRadius: 8, fontWeight: 700, fontSize: 13, border: "none", cursor: canProceed ? "pointer" : "not-allowed", background: canProceed ? "#dc2626" : "#f1f5f9", color: canProceed ? "#fff" : "#94a3b8" })}>
                Next: Review →
              </button>
              <button onClick={onClose} className={cssClass({ padding: "11px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" })}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className={cssClass({ padding: 24 })}>
            <div className={cssClass({ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "14px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" })}>
              <AlertTriangle size={18} color="#dc2626" className={cssClass({ marginTop: 1, flexShrink: 0 })} />
              <div>
                <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 700, color: "#dc2626" })}>This action cannot be easily undone</p>
                <p className={cssClass({ margin: "3px 0 0", fontSize: 12, color: "#7f1d1d" })}>Your resignation will be sent to HR for review. You may withdraw it while it's pending.</p>
              </div>
            </div>
            <div className={cssClass({ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 18px", marginBottom: 20 })}>
              <p className={cssClass({ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 12px" })}>Resignation Summary</p>
              {[
                ["Reason", reason],
                ["Last Working Day", fmtDate(lwd)],
                ["Notice Period", `${notice} day${notice !== 1 ? "s" : ""}`],
                ...(comments ? [["Comments", comments]] : []),
              ].map(([k, v]) => (
                <div key={k} className={cssClass({ display: "flex", gap: 12, marginBottom: 8 })}>
                  <span className={cssClass({ fontSize: 12, color: "#94a3b8", width: 130, flexShrink: 0 })}>{k}</span>
                  <span className={cssClass({ fontSize: 12, fontWeight: 600, color: "#1e293b" })}>{v}</span>
                </div>
              ))}
            </div>
            <div className={cssClass({ display: "flex", gap: 10 })}>
              <button onClick={() => onSubmit({ reason, last_working_day: lwd, comments })} disabled={saving} className={cssClass({ flex: 1, padding: "11px 0", borderRadius: 8, fontWeight: 700, fontSize: 13, border: "none", cursor: saving ? "not-allowed" : "pointer", background: "#dc2626", color: "#fff" })}>
                {saving ? "Submitting…" : "Confirm Resignation"}
              </button>
              <button onClick={() => setStep(1)} disabled={saving} className={cssClass({ padding: "11px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" })}>
                ← Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ResignModal;

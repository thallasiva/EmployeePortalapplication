import React, { useState, useRef } from "react";
import { AlertTriangle, CheckCircle2, Paperclip, X as XIcon } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND, NOTICE } from "../constants";
import { fmtDate, addDays, diffDays, todayStr } from "../utils";
import FieldWrap, { fieldStyle, textareaStyle } from "./FieldWrap";
import SectionHead from "./SectionHead";
import NoticeSidebar from "./NoticeSidebar";

const ApplyForm = React.memo(function ApplyForm({ profile, onSubmit, saving, onCancel, apiError }) {
  const fileRef = useRef();
  const today   = todayStr();

  const [form, setForm] = useState({
    start_date: today, end_date: "", reason: "",
    alternate_email: "", alternate_mobile: "", remarks: "",
  });
  const [file,     setFile]     = useState(null);
  const [touched,  setTouched]  = useState({});
  const [dragOver, setDragOver] = useState(false);

  const touch = (k) => setTouched((t) => ({ ...t, [k]: true }));
  const set   = (k, v) => { setForm((f) => ({ ...f, [k]: v })); touch(k); };

  const startD     = form.start_date || today;
  const tentative  = addDays(startD, NOTICE);
  const noticeDays = form.end_date ? Math.max(0, diffDays(startD, form.end_date)) : null;
  const shortfall  = form.end_date ? Math.max(0, NOTICE - (noticeDays ?? 0)) : null;

  const RULES = {
    start_date:       (v) => !v ? "Start date is required" : null,
    end_date:         (v) => !v ? "End date is required" : diffDays(startD, v) < 1 ? "End date must be after start date" : null,
    reason:           (v) => !v?.trim() ? "Please enter your reason for resignation" : null,
    alternate_email:  (v) => !v ? "Alternate email is required" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter a valid email" : null,
    alternate_mobile: (v) => !v ? "Alternate mobile is required" : !/^[0-9]{10,15}$/.test(v.replace(/\s/g, "")) ? "Enter a valid mobile number" : null,
  };

  const errors  = Object.fromEntries(Object.entries(RULES).map(([k, fn]) => [k, fn(form[k])]));
  const isValid = Object.values(errors).every((e) => !e);

  const handleSubmit = () => {
    setTouched(Object.fromEntries(Object.keys(RULES).map((k) => [k, true])));
    if (!isValid || saving) return;
    onSubmit(form, file);
  };

  const handleFileDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  return (
    <div className={cssClass({ maxWidth: 900, margin: "0 auto" })}>
      {/* Title */}
      <div className={cssClass({ marginBottom: 24 })}>
        <h2 className={cssClass({ fontSize: 20, fontWeight: 800, color: "#1e293b", margin: "0 0 4px" })}>Apply for Resignation</h2>
        <p className={cssClass({ fontSize: 13, color: "#94a3b8", margin: 0 })}>
          Company notice period policy is <strong className={cssClass({ color: "#374151" })}>{NOTICE} days</strong>. Your tentative LWD is auto-calculated from the start date.
        </p>
      </div>

      {apiError && (
        <div className={cssClass({ marginBottom: 16, padding: "12px 16px", background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626", display: "flex", gap: 8, alignItems: "center" })}>
          <AlertTriangle size={15} />{apiError}
        </div>
      )}

      <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 260px", gap: 20, alignItems: "start" })}>
        {/* Left form */}
        <div className={cssClass({ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", overflow: "hidden" })}>

          {/* Notice period dates */}
          <div className={cssClass({ padding: "22px 24px", borderBottom: "1px solid #f1f5f9" })}>
            <SectionHead>Notice Period Dates</SectionHead>
            <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 })}>
              <FieldWrap label="Start Date" required error={touched.start_date && errors.start_date}>
                <input type="date" value={form.start_date || today} onChange={(e) => set("start_date", e.target.value)} onBlur={() => touch("start_date")} className={cssClass(fieldStyle(touched.start_date && errors.start_date))} />
              </FieldWrap>
              <FieldWrap label="End Date (Last Working Day)" required error={touched.end_date && errors.end_date}>
                <input type="date" value={form.end_date} min={addDays(form.start_date || today, 1)} onChange={(e) => set("end_date", e.target.value)} onBlur={() => touch("end_date")} className={cssClass(fieldStyle(touched.end_date && errors.end_date))} />
              </FieldWrap>
            </div>

            {noticeDays !== null && (
              <div className={cssClass({ marginTop: 12, display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 10, background: shortfall === 0 ? "#f0fdf4" : "#fff7ed", border: `1.5px solid ${shortfall === 0 ? "#bbf7d0" : "#fed7aa"}` })}>
                <div className={cssClass({ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 14px", borderRadius: 8, background: shortfall === 0 ? "#dcfce7" : "#ffedd5", minWidth: 60 })}>
                  <span className={cssClass({ fontSize: 22, fontWeight: 900, lineHeight: 1, color: shortfall === 0 ? "#16a34a" : BRAND })}>{noticeDays}</span>
                  <span className={cssClass({ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" })}>days</span>
                </div>
                <div>
                  <p className={cssClass({ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: shortfall === 0 ? "#15803d" : "#92400e" })}>
                    {shortfall === 0 ? "Full notice period served" : `${shortfall} day${shortfall !== 1 ? "s" : ""} short of ${NOTICE}-day policy`}
                  </p>
                  <p className={cssClass({ margin: 0, fontSize: 11, color: "#94a3b8" })}>{fmtDate(form.start_date || today)} → {fmtDate(form.end_date)}</p>
                </div>
                {shortfall === 0
                  ? <CheckCircle2 size={18} color="#16a34a" className={cssClass({ marginLeft: "auto" })} />
                  : <AlertTriangle size={18} color="#d97706" className={cssClass({ marginLeft: "auto" })} />}
              </div>
            )}
          </div>

          {/* Reason */}
          <div className={cssClass({ padding: "22px 24px", borderBottom: "1px solid #f1f5f9" })}>
            <SectionHead>Reason for Resignation</SectionHead>
            <FieldWrap label="Reason" required error={touched.reason && errors.reason} hint="Please describe your reason clearly">
              <textarea value={form.reason} placeholder="e.g. Better career opportunity, personal reasons, higher studies…" onChange={(e) => set("reason", e.target.value)} onBlur={() => touch("reason")} rows={4} className={cssClass(textareaStyle(touched.reason && errors.reason))} />
            </FieldWrap>
          </div>

          {/* Contact */}
          <div className={cssClass({ padding: "22px 24px", borderBottom: "1px solid #f1f5f9" })}>
            <SectionHead>Contact Details</SectionHead>
            <div className={cssClass({ marginBottom: 14 })}>
              <FieldWrap label="Reporting Manager">
                <div className={cssClass({ position: "relative" })}>
                  <input type="text" readOnly value={profile?.reporting_to_name || profile?.manager_name || "Not assigned"} className={cssClass({ ...fieldStyle(false), background: "#f8fafc", color: profile?.reporting_to_name || profile?.manager_name ? "#1e293b" : "#94a3b8", paddingRight: 100, cursor: "default" })} />
                  <span className={cssClass({ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 10, fontWeight: 700, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 999, padding: "2px 8px", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 3 })}>
                    <CheckCircle2 size={10} /> Auto-filled
                  </span>
                </div>
              </FieldWrap>
            </div>
            <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 })}>
              <FieldWrap label="Alternate Email" required error={touched.alternate_email && errors.alternate_email}>
                <input type="email" value={form.alternate_email} placeholder="you@personal.com" onChange={(e) => set("alternate_email", e.target.value)} onBlur={() => touch("alternate_email")} className={cssClass(fieldStyle(touched.alternate_email && errors.alternate_email))} />
              </FieldWrap>
              <FieldWrap label="Alternate Mobile" required error={touched.alternate_mobile && errors.alternate_mobile}>
                <input type="tel" value={form.alternate_mobile} placeholder="10-digit number" onChange={(e) => set("alternate_mobile", e.target.value)} onBlur={() => touch("alternate_mobile")} className={cssClass(fieldStyle(touched.alternate_mobile && errors.alternate_mobile))} />
              </FieldWrap>
            </div>
          </div>

          {/* Additional */}
          <div className={cssClass({ padding: "22px 24px" })}>
            <SectionHead>Additional Details</SectionHead>
            <div className={cssClass({ marginBottom: 16 })}>
              <FieldWrap label="Remarks (Optional)">
                <textarea value={form.remarks} placeholder="Any additional notes for HR or your manager…" onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} rows={3} className={cssClass(textareaStyle(false))} />
              </FieldWrap>
            </div>
            <FieldWrap label="Supporting Document (Optional)" hint="PDF, DOC, DOCX, JPG, PNG — max 10 MB">
              {file ? (
                <div className={cssClass({ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8, background: "#f8fafc" })}>
                  <div className={cssClass({ width: 32, height: 32, borderRadius: 6, background: `${BRAND}15`, display: "flex", alignItems: "center", justifyContent: "center" })}>
                    <Paperclip size={14} color={BRAND} />
                  </div>
                  <div className={cssClass({ flex: 1, minWidth: 0 })}>
                    <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{file.name}</p>
                    <p className={cssClass({ margin: 0, fontSize: 11, color: "#94a3b8" })}>{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button onClick={() => setFile(null)} className={cssClass({ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, borderRadius: 4, display: "flex", alignItems: "center" })}>
                    <XIcon size={14} />
                  </button>
                </div>
              ) : (
                <div onDrop={handleFileDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onClick={() => fileRef.current?.click()} className={cssClass({ border: `1.5px dashed ${dragOver ? BRAND : "#e2e8f0"}`, borderRadius: 8, padding: "18px 16px", textAlign: "center", cursor: "pointer", background: dragOver ? "#fff7ed" : "#fafafa", transition: "all 0.15s" })}>
                  <Paperclip size={18} color={dragOver ? BRAND : "#94a3b8"} className={cssClass({ marginBottom: 6 })} />
                  <p className={cssClass({ margin: "0 0 2px", fontSize: 13, color: "#64748b", fontWeight: 600 })}>Click to upload or drag &amp; drop</p>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = ""; }} className={cssClass({ display: "none" })} />
                </div>
              )}
            </FieldWrap>
          </div>

          {/* Footer */}
          <div className={cssClass({ padding: "16px 24px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 12, alignItems: "center", background: "#fafafa" })}>
            <button onClick={handleSubmit} disabled={saving} className={cssClass({ padding: "10px 28px", borderRadius: 8, fontWeight: 700, fontSize: 14, border: "none", cursor: saving ? "not-allowed" : "pointer", background: BRAND, color: "#fff", boxShadow: "0 2px 8px rgba(241,130,0,0.35)", opacity: saving ? 0.7 : 1 })}>
              {saving ? "Submitting…" : "Submit Resignation"}
            </button>
            <button onClick={onCancel} disabled={saving} className={cssClass({ padding: "10px 20px", borderRadius: 8, fontWeight: 600, fontSize: 14, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" })}>
              Cancel
            </button>
          </div>
        </div>

        <NoticeSidebar startDate={form.start_date} endDate={form.end_date} tentative={tentative} noticeDays={noticeDays} shortfall={shortfall} today={today} />
      </div>
    </div>
  );
});

export default ApplyForm;

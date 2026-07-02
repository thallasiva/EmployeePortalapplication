import { useState, useEffect, useCallback, useRef } from "react";
import {
  LogOut, Clock, XCircle, RotateCcw, AlertTriangle,
  Paperclip, X as XIcon, CheckCircle2, CalendarDays, Info } from
"lucide-react";
import apiClient from "../../../api/client";

/* ── constants ───────────────────────────────────────────────────────── */import { cssClass, joinClasses } from "../../../utils/classStyles";
const BRAND = "#f18200";
const NOTICE = 90;

/* ── date helpers ────────────────────────────────────────────────────── */
const fmtDate = (d) => {
  if (!d) return "—";
  try {return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });}
  catch {return d;}
};
const fmtDT = (d) => {
  if (!d) return "—";
  try {return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });}
  catch {return d;}
};
function addDays(s, n) {
  const d = new Date(s);d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}
function diffDays(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}
const todayStr = () => new Date().toISOString().split("T")[0];

/* ── status config ───────────────────────────────────────────────────── */
const STATUS_CFG = {
  pending: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Awaiting Manager" },
  rm_approved: { color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", label: "Manager Approved" },
  rm_rejected: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Manager Rejected" },
  accepted: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Accepted" },
  rejected: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Rejected" },
  withdrawn: { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", label: "Withdrawn" }
};

/* ═══════════════════════════════════════════════════════════════════════
   SHARED UI ATOMS
═══════════════════════════════════════════════════════════════════════ */

const Req = () => <span className={cssClass({ color: "#ef4444", marginLeft: 2 })}>*</span>;

function FieldWrap({ label, required, error, children, hint }) {
  return (
    <div>
      <label className={cssClass({ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 })}>
        {label}{required && <Req />}
      </label>
      {children}
      {hint && !error &&
      <p className={cssClass({ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" })}>{hint}</p>
      }
      {error &&
      <p className={cssClass({ margin: "4px 0 0", fontSize: 11, color: "#ef4444", display: "flex", alignItems: "center", gap: 3 })}>
          <AlertTriangle size={11} /> {error}
        </p>
      }
    </div>);

}

const fieldStyle = (hasErr) => ({
  width: "100%", boxSizing: "border-box", height: 40, padding: "0 12px",
  border: `1.5px solid ${hasErr ? "#fca5a5" : "#e2e8f0"}`,
  borderRadius: 8, fontSize: 13, outline: "none",
  background: hasErr ? "#fff5f5" : "#fff",
  color: "#1e293b", fontFamily: "inherit",
  transition: "border-color 0.15s"
});

const textareaStyle = (hasErr) => ({
  ...fieldStyle(hasErr), height: "auto", paddingTop: 10, paddingBottom: 10, resize: "vertical"
});

/* ── InfoChip ─────────────────────────────────────────────────────── */
function Chip({ label, value, sub, color, icon: Icon }) {
  return (
    <div className={cssClass({
      background: "#fff", border: `1.5px solid ${color}22`,
      borderRadius: 10, padding: "12px 14px", position: "relative",
      borderLeft: `3px solid ${color}`
    })}>
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 })}>
        {Icon && <Icon size={12} color={color} />}
        <span className={cssClass({ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" })}>
          {label}
        </span>
      </div>
      <p className={cssClass({ margin: 0, fontSize: 16, fontWeight: 800, color: "#1e293b" })}>{value}</p>
      {sub && <p className={cssClass({ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" })}>{sub}</p>}
    </div>);

}

/* ── Leaving illustration ─────────────────────────────────────────── */
function LeavingIllustration() {
  return (
    <svg viewBox="0 0 280 200" width="200" height="145" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="155" width="220" height="6" rx="3" fill="#e2e8f0" />
      <rect x="60" y="70" width="80" height="85" rx="4" fill="#cbd5e1" />
      <rect x="64" y="74" width="72" height="77" rx="3" fill="#f1f5f9" />
      <rect x="64" y="74" width="40" height="77" rx="2" fill="#e2e8f0" />
      <circle cx="100" cy="112" r="3" fill="#94a3b8" />
      <rect x="68" y="30" width="72" height="35" rx="4" fill="#bfdbfe" />
      <line x1="104" y1="30" x2="104" y2="65" stroke="#93c5fd" strokeWidth="1.5" />
      <line x1="68" y1="47" x2="140" y2="47" stroke="#93c5fd" strokeWidth="1.5" />
      <circle cx="185" cy="88" r="14" fill={BRAND} />
      <circle cx="185" cy="75" r="9" fill="#fcd34d" />
      <rect x="170" y="108" width="30" height="22" rx="3" fill="#f97316" />
      <line x1="170" y1="116" x2="200" y2="116" stroke="#fff" strokeWidth="1.5" />
      <line x1="185" y1="108" x2="185" y2="130" stroke="#fff" strokeWidth="1.5" />
      <line x1="171" y1="100" x2="160" y2="115" stroke="#fcd34d" strokeWidth="5" strokeLinecap="round" />
      <line x1="199" y1="100" x2="210" y2="115" stroke="#fcd34d" strokeWidth="5" strokeLinecap="round" />
      <circle cx="105" cy="95" r="7" fill="#60a5fa" />
      <rect x="99" y="102" width="12" height="16" rx="3" fill="#93c5fd" />
      <line x1="99" y1="106" x2="92" y2="99" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />
      <circle cx="128" cy="97" r="7" fill="#34d399" />
      <rect x="122" y="104" width="12" height="16" rx="3" fill="#6ee7b7" />
      <line x1="134" y1="104" x2="141" y2="97" stroke="#6ee7b7" strokeWidth="3" strokeLinecap="round" />
      <line x1="178" y1="130" x2="174" y2="155" stroke="#f97316" strokeWidth="5" strokeLinecap="round" />
      <line x1="192" y1="130" x2="196" y2="155" stroke="#f97316" strokeWidth="5" strokeLinecap="round" />
    </svg>);

}

/* ═══════════════════════════════════════════════════════════════════════
   TIMELINE
═══════════════════════════════════════════════════════════════════════ */
function Timeline({ resignation, profile }) {
  const mkInitials = (name) => (name || "").split(" ").map((w) => w[0] || "").join("").slice(0, 2).toUpperCase() || "—";

  const empName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") : "You";

  const events = [
  // 1. Employee submission
  { name: empName, initials: mkInitials(empName), color: BRAND,
    time: resignation.created_at, action: "Submitted Application", remarks: null },
  // 2. Manager review
  ...(resignation.manager_reviewed_at ? [{
    name: resignation.manager_reviewed_by_name || "Reporting Manager",
    initials: mkInitials(resignation.manager_reviewed_by_name || "Reporting Manager"),
    color: resignation.status === "rm_rejected" ? "#dc2626" : "#3b82f6",
    time: resignation.manager_reviewed_at,
    action: resignation.status === "rm_rejected" ? "Manager Rejected" : "Manager Approved — Sent to HR",
    remarks: resignation.manager_remarks
  }] : []),
  // 3. HR final decision
  ...(resignation.reviewed_at ? [{
    name: resignation.reviewed_by_name || "HR",
    initials: mkInitials(resignation.reviewed_by_name || "HR"),
    color: resignation.status === "accepted" ? "#16a34a" : "#dc2626",
    time: resignation.reviewed_at,
    action: resignation.status === "accepted" ? "HR Accepted" : "HR Rejected",
    remarks: resignation.admin_remarks
  }] : []),
  // 4. Withdrawn
  ...(resignation.status === "withdrawn" ? [{
    name: empName, initials: mkInitials(empName), color: "#64748b",
    time: resignation.updated_at, action: "Withdrew Application", remarks: null
  }] : [])].
  sort((a, b) => new Date(b.time) - new Date(a.time));

  return (
    <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 })}>
      <p className={cssClass({ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: "#94a3b8",
        textTransform: "uppercase", letterSpacing: "0.08em" })}>Timeline</p>
      <div className={cssClass({ position: "relative" })}>
        {events.map((ev, i) =>
        <div key={i} className={cssClass({ display: "flex", gap: 12, position: "relative",
          paddingBottom: i < events.length - 1 ? 20 : 0 })}>
            {i < events.length - 1 &&
          <div className={cssClass({ position: "absolute", left: 17, top: 34, bottom: 0,
            width: 2, background: "#f1f5f9" })} />
          }
            <div className={cssClass({ width: 34, height: 34, borderRadius: "50%", background: ev.color,
            color: "#fff", fontWeight: 800, fontSize: 11, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 0 3px ${ev.color}22` })}>
              {ev.initials}
            </div>
            <div className={cssClass({ paddingTop: 2, flex: 1 })}>
              <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" })}>{ev.name}</p>
              <p className={cssClass({ margin: "2px 0", fontSize: 10, color: "#94a3b8" })}>{fmtDT(ev.time)}</p>
              <span className={cssClass({ fontSize: 11, fontWeight: 600, color: "#64748b",
              background: "#f8fafc", border: "1px solid #e2e8f0",
              borderRadius: 6, padding: "2px 8px" })}>{ev.action}</span>
              {ev.remarks &&
            <p className={cssClass({ margin: "6px 0 0", fontSize: 12, color: "#374151",
              background: "#f8fafc", borderRadius: 6, padding: "6px 10px",
              border: "1px solid #e2e8f0", lineHeight: 1.5 })}>
                  "{ev.remarks}"
                </p>
            }
            </div>
          </div>
        )}
      </div>
    </div>);

}

/* ═══════════════════════════════════════════════════════════════════════
   APPLY FORM
═══════════════════════════════════════════════════════════════════════ */
function ApplyForm({ profile, onSubmit, saving, onCancel, apiError }) {
  const fileRef = useRef();
  const today = todayStr();

  const [form, setForm] = useState({
    start_date: today, end_date: "", reason: "",
    alternate_email: "", alternate_mobile: "", remarks: ""
  });
  const [file, setFile] = useState(null);
  const [touched, setTouched] = useState({});
  const [dragOver, setDragOver] = useState(false);

  const touch = (k) => setTouched((t) => ({ ...t, [k]: true }));
  const set = (k, v) => {setForm((f) => ({ ...f, [k]: v }));touch(k);};

  /* ── derived ── */
  const startD = form.start_date || today;
  const tentative = addDays(startD, NOTICE);
  const noticeDays = form.end_date ? Math.max(0, diffDays(startD, form.end_date)) : null;
  const shortfall = form.end_date ? Math.max(0, NOTICE - (noticeDays ?? 0)) : null;

  /* ── validation ── */
  const RULES = {
    start_date: (v) => !v ? "Start date is required" : null,
    end_date: (v) => !v ? "End date is required" :
    diffDays(startD, v) < 1 ? "End date must be after start date" : null,
    reason: (v) => !v?.trim() ? "Please enter your reason for resignation" : null,
    alternate_email: (v) => !v ? "Alternate email is required" :
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter a valid email" : null,
    alternate_mobile: (v) => !v ? "Alternate mobile is required" :
    !/^[0-9]{10,15}$/.test(v.replace(/\s/g, "")) ? "Enter a valid mobile number" : null
  };

  const errors = Object.fromEntries(
    Object.entries(RULES).map(([k, fn]) => [k, fn(form[k])])
  );
  const isValid = Object.values(errors).every((e) => !e);

  const handleSubmit = () => {
    setTouched(Object.fromEntries(Object.keys(RULES).map((k) => [k, true])));
    if (!isValid || saving) return;
    // Pass plain form object + file separately so caller can choose JSON vs multipart
    onSubmit(form, file);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  return (
    <div className={cssClass({ maxWidth: 900, margin: "0 auto" })}>
      {/* Header */}
      <div className={cssClass({ marginBottom: 24 })}>
        <h2 className={cssClass({ fontSize: 20, fontWeight: 800, color: "#1e293b", margin: "0 0 4px" })}>
          Apply for Resignation
        </h2>
        <p className={cssClass({ fontSize: 13, color: "#94a3b8", margin: 0 })}>
          Company notice period policy is <strong className={cssClass({ color: "#374151" })}>{NOTICE} days</strong>.
          Your tentative LWD is auto-calculated from the start date.
        </p>
      </div>

      {/* API error banner */}
      {apiError &&
      <div className={cssClass({ marginBottom: 16, padding: "12px 16px", background: "#fef2f2",
        border: "1.5px solid #fecaca", borderRadius: 10, fontSize: 13,
        color: "#dc2626", display: "flex", gap: 8, alignItems: "center" })}>
          <AlertTriangle size={15} />
          {apiError}
        </div>
      }

      <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 260px", gap: 20, alignItems: "start" })}>

        {/* ── LEFT: Form card ── */}
        <div className={cssClass({ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)", overflow: "hidden" })}>

          {/* Section: Dates */}
          <div className={cssClass({ padding: "22px 24px", borderBottom: "1px solid #f1f5f9" })}>
            <SectionHead>Notice Period Dates</SectionHead>
            <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 })}>
              <FieldWrap label="Start Date" required error={touched.start_date && errors.start_date}>
                <input type="date" value={form.start_date || today}
                onChange={(e) => set("start_date", e.target.value)}
                onBlur={() => touch("start_date")} className={cssClass(
                  fieldStyle(touched.start_date && errors.start_date))} />
              </FieldWrap>
              <FieldWrap label="End Date (Last Working Day)" required
              error={touched.end_date && errors.end_date}>
                <input type="date" value={form.end_date}
                min={addDays(form.start_date || today, 1)}
                onChange={(e) => set("end_date", e.target.value)}
                onBlur={() => touch("end_date")} className={cssClass(
                  fieldStyle(touched.end_date && errors.end_date))} />
              </FieldWrap>
            </div>

            {/* Days summary — only when both dates picked */}
            {noticeDays !== null &&
            <div className={cssClass({ marginTop: 12, display: "flex", alignItems: "center", gap: 12,
              padding: "10px 16px", borderRadius: 10,
              background: shortfall === 0 ? "#f0fdf4" : "#fff7ed",
              border: `1.5px solid ${shortfall === 0 ? "#bbf7d0" : "#fed7aa"}` })}>
                <div className={cssClass({ display: "flex", flexDirection: "column", alignItems: "center",
                padding: "4px 14px", borderRadius: 8,
                background: shortfall === 0 ? "#dcfce7" : "#ffedd5",
                minWidth: 60 })}>
                  <span className={cssClass({ fontSize: 22, fontWeight: 900, lineHeight: 1,
                  color: shortfall === 0 ? "#16a34a" : BRAND })}>
                    {noticeDays}
                  </span>
                  <span className={cssClass({ fontSize: 10, fontWeight: 700, color: "#94a3b8",
                  textTransform: "uppercase", letterSpacing: "0.05em" })}>
                    days
                  </span>
                </div>
                <div>
                  <p className={cssClass({ margin: "0 0 2px", fontSize: 13, fontWeight: 700,
                  color: shortfall === 0 ? "#15803d" : "#92400e" })}>
                    {shortfall === 0 ?
                  "Full notice period served" :
                  `${shortfall} day${shortfall !== 1 ? "s" : ""} short of ${NOTICE}-day policy`}
                  </p>
                  <p className={cssClass({ margin: 0, fontSize: 11, color: "#94a3b8" })}>
                    {fmtDate(form.start_date || today)} → {fmtDate(form.end_date)}
                  </p>
                </div>
                {shortfall === 0 ?
              <CheckCircle2 size={18} color="#16a34a" className={cssClass({ marginLeft: "auto" })} /> :
              <AlertTriangle size={18} color="#d97706" className={cssClass({ marginLeft: "auto" })} />
              }
              </div>
            }
          </div>

          {/* Section: Reason */}
          <div className={cssClass({ padding: "22px 24px", borderBottom: "1px solid #f1f5f9" })}>
            <SectionHead>Reason for Resignation</SectionHead>
            <FieldWrap label="Reason" required
            error={touched.reason && errors.reason}
            hint="Please describe your reason clearly">
              <textarea
                value={form.reason}
                placeholder="e.g. Better career opportunity, personal reasons, higher studies…"
                onChange={(e) => set("reason", e.target.value)}
                onBlur={() => touch("reason")}
                rows={4} className={cssClass(
                  textareaStyle(touched.reason && errors.reason))} />
              
            </FieldWrap>
          </div>

          {/* Section: Contact & Manager */}
          <div className={cssClass({ padding: "22px 24px", borderBottom: "1px solid #f1f5f9" })}>
            <SectionHead>Contact Details</SectionHead>

            {/* Reporting Manager — auto-populated read-only field */}
            <div className={cssClass({ marginBottom: 14 })}>
              <FieldWrap label="Reporting Manager">
                <div className={cssClass({ position: "relative" })}>
                  <input
                    type="text"
                    readOnly
                    value={profile?.reporting_to_name || profile?.manager_name || "Not assigned"} className={cssClass(
                      {
                        ...fieldStyle(false),
                        background: "#f8fafc",
                        color: profile?.reporting_to_name || profile?.manager_name ? "#1e293b" : "#94a3b8",
                        paddingRight: 100,
                        cursor: "default"
                      })} />
                  
                  <span className={cssClass({
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    fontSize: 10, fontWeight: 700, color: "#16a34a",
                    background: "#f0fdf4", border: "1px solid #bbf7d0",
                    borderRadius: 999, padding: "2px 8px", letterSpacing: "0.04em",
                    display: "flex", alignItems: "center", gap: 3
                  })}>
                    <CheckCircle2 size={10} /> Auto-filled
                  </span>
                </div>
              </FieldWrap>
            </div>

            <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 })}>
              <FieldWrap label="Alternate Email" required error={touched.alternate_email && errors.alternate_email}>
                <input type="email" value={form.alternate_email}
                placeholder="you@personal.com"
                onChange={(e) => set("alternate_email", e.target.value)}
                onBlur={() => touch("alternate_email")} className={cssClass(
                  fieldStyle(touched.alternate_email && errors.alternate_email))} />
              </FieldWrap>
              <FieldWrap label="Alternate Mobile" required error={touched.alternate_mobile && errors.alternate_mobile}>
                <input type="tel" value={form.alternate_mobile}
                placeholder="10-digit number"
                onChange={(e) => set("alternate_mobile", e.target.value)}
                onBlur={() => touch("alternate_mobile")} className={cssClass(
                  fieldStyle(touched.alternate_mobile && errors.alternate_mobile))} />
              </FieldWrap>
            </div>
          </div>

          {/* Section: Remarks + Attachment */}
          <div className={cssClass({ padding: "22px 24px" })}>
            <SectionHead>Additional Details</SectionHead>

            <div className={cssClass({ marginBottom: 16 })}>
              <FieldWrap label="Remarks (Optional)">
                <textarea value={form.remarks}
                placeholder="Any additional notes for HR or your manager…"
                onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                rows={3} className={cssClass(
                  textareaStyle(false))} />
              </FieldWrap>
            </div>

            <FieldWrap label="Supporting Document (Optional)"
            hint="PDF, DOC, DOCX, JPG, PNG — max 10 MB">
              {file ?
              <div className={cssClass({ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                border: "1.5px solid #e2e8f0", borderRadius: 8, background: "#f8fafc" })}>
                  <div className={cssClass({ width: 32, height: 32, borderRadius: 6, background: `${BRAND}15`,
                  display: "flex", alignItems: "center", justifyContent: "center" })}>
                    <Paperclip size={14} color={BRAND} />
                  </div>
                  <div className={cssClass({ flex: 1, minWidth: 0 })}>
                    <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                      {file.name}
                    </p>
                    <p className={cssClass({ margin: 0, fontSize: 11, color: "#94a3b8" })}>
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button onClick={() => setFile(null)} className={cssClass(
                  { background: "none", border: "none", cursor: "pointer",
                    color: "#94a3b8", padding: 4, borderRadius: 4,
                    display: "flex", alignItems: "center" })}>
                    <XIcon size={14} />
                  </button>
                </div> :

              <div
                onDrop={handleFileDrop}
                onDragOver={(e) => {e.preventDefault();setDragOver(true);}}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()} className={cssClass(
                  { border: `1.5px dashed ${dragOver ? BRAND : "#e2e8f0"}`,
                    borderRadius: 8, padding: "18px 16px", textAlign: "center",
                    cursor: "pointer", background: dragOver ? "#fff7ed" : "#fafafa",
                    transition: "all 0.15s" })}>
                  <Paperclip size={18} color={dragOver ? BRAND : "#94a3b8"} className={cssClass(
                  { marginBottom: 6 })} />
                  <p className={cssClass({ margin: "0 0 2px", fontSize: 13, color: "#64748b", fontWeight: 600 })}>
                    Click to upload or drag & drop
                  </p>
                  <input ref={fileRef} type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => {const f = e.target.files?.[0];if (f) setFile(f);e.target.value = "";}} className={cssClass({ display: "none" })} />
                </div>
              }
            </FieldWrap>
          </div>

          {/* Footer: buttons */}
          <div className={cssClass({ padding: "16px 24px", borderTop: "1px solid #f1f5f9",
            display: "flex", gap: 12, alignItems: "center",
            background: "#fafafa" })}>
            <button onClick={handleSubmit} disabled={saving} className={cssClass(
              { padding: "10px 28px", borderRadius: 8, fontWeight: 700, fontSize: 14,
                border: "none", cursor: saving ? "not-allowed" : "pointer",
                background: BRAND, color: "#fff",
                boxShadow: "0 2px 8px rgba(241,130,0,0.35)",
                opacity: saving ? 0.7 : 1 })}>
              {saving ? "Submitting…" : "Submit Resignation"}
            </button>
            <button onClick={onCancel} disabled={saving} className={cssClass(
              { padding: "10px 20px", borderRadius: 8, fontWeight: 600, fontSize: 14,
                border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" })}>
              Cancel
            </button>
          </div>
        </div>

        {/* ── RIGHT: Notice Summary card ── */}
        <div className={cssClass({ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 12 })}>
          {/* Notice period summary */}
          <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14,
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)", overflow: "hidden" })}>
            <div className={cssClass({ padding: "14px 18px", borderBottom: "1px solid #f1f5f9",
              background: "linear-gradient(135deg, #fff7ed 0%, #fff 100%)",
              display: "flex", alignItems: "center", gap: 8 })}>
              <CalendarDays size={15} color={BRAND} />
              <span className={cssClass({ fontSize: 12, fontWeight: 700, color: "#374151" })}>Notice Period Summary</span>
            </div>
            <div className={cssClass({ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 })}>
              <Chip label="Start Date" value={fmtDate(form.start_date || today)} color="#64748b" icon={CalendarDays} />
              <Chip label="End Date" value={form.end_date ? fmtDate(form.end_date) : "Not set"} color={BRAND} icon={CalendarDays} />
              <Chip label="Tentative LWD" value={fmtDate(tentative)} sub={`Start + ${NOTICE} days`} color="#3b82f6" icon={CalendarDays} />

              {noticeDays !== null &&
              <>
                  <div className={cssClass({ height: 1, background: "#f1f5f9" })} />
                  <Chip
                  label="Total Days (Start → End)"
                  value={`${noticeDays} day${noticeDays !== 1 ? "s" : ""}`}
                  color={noticeDays >= NOTICE ? "#16a34a" : "#d97706"}
                  icon={Info} />
                
                  <Chip
                  label="Shortfall"
                  value={shortfall === 0 ? "None ✓" : `${shortfall} day${shortfall !== 1 ? "s" : ""}`}
                  sub={shortfall === 0 ? "Full notice served" : `${shortfall} short of ${NOTICE} days`}
                  color={shortfall === 0 ? "#16a34a" : "#dc2626"}
                  icon={shortfall === 0 ? CheckCircle2 : AlertTriangle} />
                
                </>
              }
            </div>
          </div>

          {/* Policy note */}
          <div className={cssClass({ padding: "12px 14px", background: "#f0f9ff",
            border: "1px solid #bae6fd", borderRadius: 10,
            display: "flex", gap: 8, alignItems: "flex-start" })}>
            <Info size={14} color="#0284c7" className={cssClass({ flexShrink: 0, marginTop: 1 })} />
            <p className={cssClass({ margin: 0, fontSize: 11, color: "#0369a1", lineHeight: 1.5 })}>
              Shortfall days may result in salary recovery or loss of pay
              as per company policy.
            </p>
          </div>
        </div>
      </div>
    </div>);

}

function SectionHead({ children }) {
  return (
    <p className={cssClass({ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: BRAND,
      textTransform: "uppercase", letterSpacing: "0.07em",
      display: "flex", alignItems: "center", gap: 6 })}>
      <span className={cssClass({ display: "inline-block", width: 3, height: 12,
        background: BRAND, borderRadius: 2 })} />
      {children}
    </p>);

}

/* ═══════════════════════════════════════════════════════════════════════
   RESIGN CARD (Pending / History)
═══════════════════════════════════════════════════════════════════════ */
function DetailRow({ label, value }) {
  return (
    <div>
      <p className={cssClass({ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: BRAND,
        textTransform: "uppercase", letterSpacing: "0.05em" })}>{label}</p>
      <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" })}>{value || "—"}</p>
    </div>);

}

function ResignCard({ data, profile, onWithdraw, withdrawing, isHistory }) {
  const cfg = STATUS_CFG[data.status] || STATUS_CFG.pending;
  const empName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") : "—";
  const noticeDays = data.start_date && data.end_date ?
  Math.max(0, diffDays(data.start_date, data.end_date)) : null;
  const attachUrl = data.attachment_path ?
  `${apiClient.defaults.baseURL}/resignations/my/${data.resignation_id}/attachment` : null;

  return (
    <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 250px", gap: 16, alignItems: "start" })}>

      {/* Main card */}
      <div className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14,
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)", overflow: "hidden" })}>

        {/* Top bar */}
        <div className={cssClass({ padding: "14px 20px", background: "#fafafa",
          borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" })}>
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 10 })}>
            <div className={cssClass({ width: 36, height: 36, borderRadius: "50%", background: BRAND,
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 13, flexShrink: 0 })}>
              {(empName || "U").split(" ").map((w) => w[0] || "").join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className={cssClass({ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" })}>{empName}</p>
              <p className={cssClass({ margin: 0, fontSize: 11, color: "#94a3b8" })}>
                Applied on {fmtDate(data.created_at)}
              </p>
            </div>
          </div>
          <span className={cssClass({ marginLeft: "auto", fontSize: 12, fontWeight: 700, padding: "5px 14px",
            borderRadius: 999, background: cfg.bg, color: cfg.color,
            border: `1px solid ${cfg.border}` })}>
            {cfg.label}
          </span>
        </div>

        {/* Info boxes */}
        <div className={cssClass({ padding: "16px 20px", display: "grid",
          gridTemplateColumns: "repeat(4,1fr)", gap: 10,
          borderBottom: "1px solid #f1f5f9" })}>
          <Chip label="Start Date" value={fmtDate(data.start_date)} color="#64748b" />
          <Chip label="End Date (LWD)" value={fmtDate(data.end_date)} color={BRAND} />
          <Chip label="Tentative LWD" value={fmtDate(data.tentative_lwd)} color="#3b82f6" />
          <Chip
            label="Shortfall"
            value={(data.shortfall_days ?? 0) === 0 ? "None" : `${data.shortfall_days} days`}
            color={(data.shortfall_days ?? 0) > 0 ? "#dc2626" : "#16a34a"} />
          
        </div>

        {/* Details grid */}
        <div className={cssClass({ padding: "16px 20px", display: "grid",
          gridTemplateColumns: "repeat(3,1fr)", gap: "14px 24px",
          borderBottom: attachUrl || !isHistory && data.status === "pending" ? "1px solid #f1f5f9" : undefined })}>
          <DetailRow label="Reason" value={data.reason} />
          <DetailRow label="Notice Given"
          value={noticeDays !== null ? `${noticeDays} days` : "—"} />
          <DetailRow label="Alternate Email" value={data.alternate_email} />
          <DetailRow label="Alternate Mobile" value={data.alternate_mobile} />
          <DetailRow label="Applying To" value={profile?.reporting_to_name || profile?.manager_name} />
          {data.remarks && <DetailRow label="Remarks" value={data.remarks} />}
          {data.admin_remarks &&
          <div className={cssClass({ gridColumn: "1/-1", padding: "10px 14px",
            background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8 })}>
              <p className={cssClass({ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "#16a34a",
              textTransform: "uppercase" })}>HR Remarks</p>
              <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 600, color: "#15803d" })}>
                {data.admin_remarks}
              </p>
            </div>
          }
        </div>

        {/* Attachment */}
        {attachUrl &&
        <div className={cssClass({ padding: "10px 20px",
          borderBottom: !isHistory && data.status === "pending" ? "1px solid #f1f5f9" : undefined,
          display: "flex", alignItems: "center", gap: 8 })}>
            <div className={cssClass({ width: 28, height: 28, borderRadius: 6, background: `${BRAND}15`,
            display: "flex", alignItems: "center", justifyContent: "center" })}>
              <Paperclip size={13} color={BRAND} />
            </div>
            <a href={attachUrl} target="_blank" rel="noreferrer" className={cssClass(
            { fontSize: 13, color: BRAND, fontWeight: 600, textDecoration: "none" })}>
              {data.attachment_name || "Download Attachment"}
            </a>
          </div>
        }

        {/* Withdraw button */}
        {!isHistory && data.status === "pending" &&
        <div className={cssClass({ padding: "12px 20px", display: "flex", justifyContent: "flex-end" })}>
            <button onClick={() => onWithdraw(data.resignation_id)} disabled={withdrawing} className={cssClass(
            { display: "flex", alignItems: "center", gap: 6, padding: "8px 18px",
              borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: withdrawing ? "not-allowed" : "pointer",
              border: "1.5px solid #fecaca", background: "#fef2f2",
              color: "#dc2626", opacity: withdrawing ? 0.6 : 1,
              transition: "all 0.15s" })}>
              <RotateCcw size={13} />
              {withdrawing ? "Withdrawing…" : "Withdraw"}
            </button>
          </div>
        }
      </div>

      {/* Timeline */}
      <Timeline resignation={data} profile={profile} />
    </div>);

}

/* ═══════════════════════════════════════════════════════════════════════
   TABS
═══════════════════════════════════════════════════════════════════════ */
function Tabs({ active, onChange, pendingCount }) {
  const tabs = [
  { key: "apply", label: "Apply" },
  { key: "pending", label: "Pending", badge: pendingCount },
  { key: "history", label: "History" }];

  return (
    <div className={cssClass({ display: "flex", gap: 4, padding: 4, background: "#f1f5f9",
      borderRadius: 12, width: "fit-content", margin: "0 auto 28px" })}>
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button key={t.key} onClick={() => onChange(t.key)} className={cssClass(
            { padding: "7px 22px", borderRadius: 9, fontSize: 13, fontWeight: 600,
              border: "none", cursor: "pointer", position: "relative",
              background: isActive ? "#fff" : "transparent",
              color: isActive ? "#1e293b" : "#64748b",
              boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.15s" })}>
            {t.label}
            {t.badge > 0 &&
            <span className={cssClass({ marginLeft: 6, padding: "1px 7px", borderRadius: 999,
              background: BRAND, color: "#fff", fontSize: 10, fontWeight: 700 })}>
                {t.badge}
              </span>
            }
          </button>);

      })}
    </div>);

}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════ */
export default function Resignation() {
  const [tab, setTab] = useState("apply");
  const [showForm, setShowForm] = useState(false);
  const [resignations, setResignations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [apiError, setApiError] = useState(null);

  const pending = resignations.filter((r) => r.status === "pending");
  const history = resignations.filter((r) => r.status !== "pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([
      apiClient.get("/resignations/my").then((r) => r.data),
      apiClient.get("/employees/me").then((r) => r.data?.data || r.data)]
      );
      setResignations(Array.isArray(rRes) ? rRes : []);
      setProfile(pRes);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {load();}, [load]);

  // auto-switch to pending after submit
  useEffect(() => {
    if (pending.length > 0 && tab === "apply" && !showForm) setTab("pending");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending.length]);

  const handleSubmit = async (fields, file) => {
    setSaving(true);
    setApiError(null);
    try {
      if (file) {
        // File present → send as multipart, but delete Content-Type so axios
        // auto-sets the correct multipart boundary (apiClient default is application/json)
        const fd = new FormData();
        Object.entries(fields).forEach(([k, v]) => {if (v) fd.append(k, String(v));});
        fd.append("file", file);
        await apiClient.post("/resignations/my", fd, {
          transformRequest: [(data, headers) => {
            delete headers["Content-Type"];
            return data;
          }]
        });
      } else {
        // No file → send plain JSON (works perfectly with apiClient default)
        await apiClient.post("/resignations/my", fields);
      }
      await load();
      setShowForm(false);
      setTab("pending");
    } catch (e) {
      setApiError(e?.response?.data?.message || "Failed to submit resignation. Please try again.");
    }
    setSaving(false);
  };

  const handleWithdraw = async (id) => {
    if (!window.confirm("Are you sure you want to withdraw your resignation?")) return;
    setWithdrawing(true);
    try {
      await apiClient.put(`/resignations/my/${id}/withdraw`);
      await load();
      setTab("history");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to withdraw");
    }
    setWithdrawing(false);
  };

  const changeTab = (k) => {setTab(k);setShowForm(false);setApiError(null);};

  /* ── Empty state helper ── */
  const EmptyState = ({ icon: Icon, text }) =>
  <div className={cssClass({ textAlign: "center", padding: "64px 0", color: "#94a3b8" })}>
      <div className={cssClass({ width: 64, height: 64, borderRadius: "50%", background: "#f1f5f9",
      display: "flex", alignItems: "center", justifyContent: "center",
      margin: "0 auto 16px" })}>
        <Icon size={28} color="#cbd5e1" />
      </div>
      <p className={cssClass({ margin: 0, fontSize: 14, color: "#64748b" })}>{text}</p>
    </div>;


  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f5f7fb", padding: "28px 24px", fontFamily: "inherit" })}>

      {/* Page header */}
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 })}>
        <div className={cssClass({ width: 38, height: 38, borderRadius: 10, background: `${BRAND}15`,
          display: "flex", alignItems: "center", justifyContent: "center" })}>
          <LogOut size={18} color={BRAND} />
        </div>
        <div>
          <h1 className={cssClass({ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e293b" })}>Resignation</h1>
          <p className={cssClass({ margin: 0, fontSize: 12, color: "#94a3b8" })}>Manage your exit request</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs active={tab} onChange={changeTab} pendingCount={pending.length} />

      {/* Content */}
      {loading ?
      <div className={cssClass({ textAlign: "center", padding: 60, color: "#94a3b8", fontSize: 14 })}>
          Loading…
        </div> :

      <>
          {/* ── APPLY TAB ── */}
          {tab === "apply" && (
        showForm ?
        <ApplyForm
          profile={profile}
          onSubmit={handleSubmit}
          saving={saving}
          onCancel={() => {setShowForm(false);setApiError(null);}}
          apiError={apiError} /> :


        <div className={cssClass({ display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: 400, gap: 14 })}>
                <LeavingIllustration />
                <p className={cssClass({ fontSize: 20, fontWeight: 800, color: "#1e293b", margin: 0 })}>
                  It's sad to see you go.
                </p>
                <p className={cssClass({ fontSize: 13, color: "#94a3b8", margin: 0, textAlign: "center", maxWidth: 340 })}>
                  If you've made up your mind, you can proceed with your
                  resignation below.
                </p>
                <button onClick={() => setShowForm(true)} className={cssClass(
            { marginTop: 8, padding: "12px 36px", borderRadius: 10,
              background: BRAND, color: "#fff", fontWeight: 700, fontSize: 14,
              border: "none", cursor: "pointer",
              boxShadow: "0 4px 14px rgba(241,130,0,0.4)" })}>
                  Apply for Resignation
                </button>
              </div>)

        }

          {/* ── PENDING TAB ── */}
          {tab === "pending" && (
        pending.length === 0 ?
        <EmptyState icon={Clock} text="No pending resignation requests." /> :

        <div className={cssClass({ display: "flex", flexDirection: "column", gap: 20 })}>
                  {pending.map((r) =>
          <ResignCard key={r.resignation_id} data={r} profile={profile}
          onWithdraw={handleWithdraw} withdrawing={withdrawing} />
          )}
                </div>)

        }

          {/* ── HISTORY TAB ── */}
          {tab === "history" && (
        history.length === 0 ?
        <EmptyState icon={XCircle} text="No resignation history found." /> :

        <div className={cssClass({ display: "flex", flexDirection: "column", gap: 20 })}>
                  {history.map((r) =>
          <ResignCard key={r.resignation_id} data={r} profile={profile} isHistory />
          )}
                </div>)

        }
        </>
      }
    </div>);

}

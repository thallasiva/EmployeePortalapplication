import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  listHolidays, listHolidayLocations,
  createHoliday, updateHoliday, deleteHoliday, importHolidays } from
"../../api/holiday.api";
import {
  Plus, Edit2, Trash2, MapPin, Sun, Moon,
  Sunset, Calendar, AlertCircle, Check, Upload, Download } from
"lucide-react";

/* ═══════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════ */import { cssClass, joinClasses } from "../../utils/classStyles";
const B = "#f18200";
const BD = "#d97000";
const BL = "#fff8f0";

const SHIFTS = [
{ key: "general", label: "General Shift", icon: <Sun size={15} />, color: "#f18200", bg: "#fff8f0", border: "#fed7aa" },
{ key: "mid", label: "Mid Shift", icon: <Sunset size={15} />, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
{ key: "night", label: "Night Shift", icon: <Moon size={15} />, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" }];


const MONTHS = ["January", "February", "March", "April", "May", "June",
"July", "August", "September", "October", "November", "December"];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric"
  });
}
function dayName(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { weekday: "long" });
}
function parseLocalDate(s) {
  if (!s) return null;
  const [y, m, d] = String(s).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/* ═══════════════════════════════════════════════
   SHARED ATOMS
═══════════════════════════════════════════════ */
const Btn = ({ onClick, disabled, children, variant = "primary", size = "md", style: extra = {} }) => {
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };
  const base = {
    primary: { background: B, borderColor: B, color: "#fff" },
    cancel: { background: "#fff", borderColor: "#d1d5db", color: "#374151" },
    danger: { background: "#fff", borderColor: "#fca5a5", color: "#dc2626" },
    ghost: { background: "transparent", borderColor: "transparent", color: "#6b7280" },
    green: { background: "#16a34a", borderColor: "#16a34a", color: "#fff" }
  };
  const hover = {
    primary: { background: BD, borderColor: BD },
    cancel: { background: "#f9fafb" },
    danger: { background: "#fff1f2" },
    ghost: { background: "#f3f4f6" },
    green: { background: "#15803d", borderColor: "#15803d" }
  };
  const s = { ...base[variant], ...extra };
  return (
    <button onClick={onClick} disabled={disabled}
    className={joinClasses(`inline-flex items-center gap-1.5 font-semibold rounded-lg border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizes[size]}`, cssClass(
      s))}
    onMouseEnter={(e) => {if (!disabled) Object.assign(e.currentTarget.style, { ...s, ...hover[variant] });}}
    onMouseLeave={(e) => {Object.assign(e.currentTarget.style, s);}}>
      {children}
    </button>);

};

const Toast = ({ msg, type = "success" }) => msg ?
<div className={cssClass({
  position: "fixed", top: 20, right: 20, zIndex: 9999,
  background: type === "success" ? "#16a34a" : "#dc2626",
  color: "#fff", borderRadius: 10, padding: "10px 18px",
  fontSize: 13, fontWeight: 600, boxShadow: "0 4px 16px #0003",
  display: "flex", alignItems: "center", gap: 8
})}>
    {type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
    {msg}
  </div> :
null;

/* ═══════════════════════════════════════════════
   CSV BULK UPLOAD MODAL
   CSV columns: holiday_name, holiday_date (YYYY-MM-DD),
                shift (general/mid/night), location (optional),
                is_restricted (0/1 or true/false)
═══════════════════════════════════════════════ */
function CSVUploadModal({ onClose, onImported }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null); // parsed rows
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {setError("CSV must have a header row and at least one data row.");return;}
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, ""));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cells = lines[i].split(",");
      const obj = {};
      header.forEach((k, ci) => {obj[k] = (cells[ci] || "").trim().replace(/^"|"$/g, "");});
      if (!obj.holiday_name || !obj.holiday_date) continue;
      // Normalise shift
      const rawShift = (obj.shift || "").toLowerCase();
      obj.shift = ["general", "mid", "night"].includes(rawShift) ? rawShift : "general";
      // Normalise is_restricted
      obj.is_restricted = ["1", "true", "yes"].includes((obj.is_restricted || "").toLowerCase());
      rows.push(obj);
    }
    if (rows.length === 0) {setError("No valid rows found. Check column names.");return;}
    setError("");
    setPreview(rows);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => parseCSV(ev.target.result);
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview?.length) return;
    setLoading(true);
    try {
      const result = await importHolidays(preview);
      onImported(result.imported || preview.length);
    } catch (e) {setError(e.message);setLoading(false);}
  };

  const downloadTemplate = () => {
    const yr = new Date().getFullYear();
    const rows = [
    ["holiday_name", "holiday_date", "shift", "location", "is_restricted"],
    ["Republic Day", `${yr}-01-26`, "general", "", 0],
    ["Pongal", `${yr}-01-14`, "general", "Chennai", 1],
    ["Holi", `${yr}-03-25`, "general", "", 0],
    ["Good Friday", `${yr}-04-03`, "general", "", 0],
    ["Tamil New Year", `${yr}-04-14`, "general", "Chennai", 1],
    ["Independence Day", `${yr}-08-15`, "general", "", 0],
    ["Gandhi Jayanti", `${yr}-10-02`, "general", "", 0],
    ["Diwali", `${yr}-10-20`, "general", "", 0],
    ["Christmas", `${yr}-12-25`, "general", "", 0],
    ["Telangana Formation", `${yr}-06-02`, "general", "Hyderabad", 0],
    ["Karnataka Rajyotsava", `${yr}-11-01`, "general", "Bangalore", 0],
    ["Republic Day", `${yr}-01-26`, "mid", "", 0],
    ["Independence Day", `${yr}-08-15`, "mid", "", 0],
    ["Diwali", `${yr}-10-20`, "mid", "", 0],
    ["Christmas", `${yr}-12-25`, "mid", "", 0],
    // Night shift: entry date = day BEFORE the public holiday
    ["Republic Day", `${yr}-01-25`, "night", "", 0],
    ["Independence Day", `${yr}-08-14`, "night", "", 0],
    ["Diwali", `${yr}-10-19`, "night", "", 0],
    ["Christmas", `${yr}-12-24`, "night", "", 0]];

    const csv = rows.map((r) => r.join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `holiday_import_template_${yr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shiftCount = (s) => preview?.filter((r) => r.shift === s).length || 0;

  return (
    <div className={cssClass({ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center" })}>
      <div className={cssClass({ background: "#fff", borderRadius: 16, padding: 28, width: 580,
        maxHeight: "85vh", overflow: "auto", boxShadow: "0 12px 48px #0003" })}>
        <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 })}>
          <div className={cssClass({ fontSize: 17, fontWeight: 800, color: "#111827" })}>
            Bulk Upload Holidays via CSV
          </div>
          <Btn variant="cancel" size="sm" onClick={onClose}>✕</Btn>
        </div>

        {/* Template download banner */}
        <div className={cssClass({
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#fff8f0", border: "1px solid #fed7aa", borderRadius: 10,
          padding: "10px 14px", marginBottom: 18
        })}>
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
            <span className={cssClass({ fontSize: 18 })}>📥</span>
            <div>
              <div className={cssClass({ fontSize: 12, fontWeight: 700, color: "#92400e" })}>Not sure about the format?</div>
              <div className={cssClass({ fontSize: 11, color: "#b45309" })}>Download the template and fill it in</div>
            </div>
          </div>
          <button
            type="button"
            onClick={downloadTemplate} className={cssClass(
              {
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: B, color: "#fff", border: "none", cursor: "pointer",
                whiteSpace: "nowrap"
              })}>
            
            ⬇ Download Template
          </button>
        </div>

        {/* CSV column reference */}
        <div className={cssClass({ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8,
          padding: "10px 14px", marginBottom: 16 })}>
          <div className={cssClass({ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 6,
            textTransform: "uppercase", letterSpacing: ".05em" })}>CSV Columns</div>
          <div className={cssClass({ display: "flex", gap: 6, flexWrap: "wrap" })}>
            {[
            { col: "holiday_name", note: "required" },
            { col: "holiday_date", note: "YYYY-MM-DD, required" },
            { col: "shift", note: "general / mid / night" },
            { col: "location", note: "optional" },
            { col: "is_restricted", note: "0 or 1" }].
            map((c) =>
            <span key={c.col} className={cssClass({ fontSize: 11, background: "#fff", border: "1px solid #e5e7eb",
              borderRadius: 5, padding: "2px 8px", color: "#374151" })}>
                <strong>{c.col}</strong> <span className={cssClass({ color: "#9ca3af" })}>({c.note})</span>
              </span>
            )}
          </div>
        </div>

        {/* File input */}
        <div
          onClick={() => fileRef.current.click()} className={cssClass(
            { border: `2px dashed ${preview ? B : "#d1d5db"}`,
              borderRadius: 10, padding: "28px 20px", textAlign: "center", cursor: "pointer",
              background: preview ? BL : "#fafafa", marginBottom: 16, transition: "all .2s" })}>
          <Upload size={28} className={cssClass({ color: preview ? B : "#9ca3af", margin: "0 auto 10px", display: "block" })} />
          <div className={cssClass({ fontSize: 13, fontWeight: 600, color: preview ? B : "#374151" })}>
            {preview ? `✓ ${preview.length} rows loaded` : "Click to select CSV file"}
          </div>
          <div className={cssClass({ fontSize: 11, color: "#9ca3af", marginTop: 4 })}>Supports .csv files</div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className={cssClass({ display: "none" })} />
        </div>

        {error &&
        <div className={cssClass({ background: "#fff1f2", border: "1px solid #fca5a5", borderRadius: 8,
          padding: "10px 14px", fontSize: 12, color: "#dc2626", marginBottom: 14 })}>
            {error}
          </div>
        }

        {/* Preview breakdown by shift */}
        {preview &&
        <div className={cssClass({ marginBottom: 18 })}>
            <div className={cssClass({ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 })}>
              Preview — {preview.length} holidays will be imported:
            </div>
            <div className={cssClass({ display: "flex", gap: 8, marginBottom: 12 })}>
              {SHIFTS.map((s) =>
            <div key={s.key} className={cssClass({ flex: 1, padding: "8px 12px", borderRadius: 8,
              background: s.bg, border: `1px solid ${s.border}`, textAlign: "center" })}>
                  <div className={cssClass({ fontSize: 18, fontWeight: 900, color: s.color })}>{shiftCount(s.key)}</div>
                  <div className={cssClass({ fontSize: 10, color: s.color, fontWeight: 700 })}>{s.label.split(" ")[0]}</div>
                </div>
            )}
            </div>
            {/* Table preview (first 10) */}
            <div className={cssClass({ border: "1px solid #e9eaec", borderRadius: 8, overflow: "hidden", fontSize: 12 })}>
              <table className={cssClass({ width: "100%", borderCollapse: "collapse" })}>
                <thead>
                  <tr className={cssClass({ background: "#fafafa" })}>
                    {["Name", "Date", "Shift", "Location", "Restricted"].map((h) =>
                  <th key={h} className={cssClass({ padding: "7px 10px", textAlign: "left", fontWeight: 700,
                    fontSize: 10, color: "#9ca3af", borderBottom: "1px solid #e9eaec",
                    textTransform: "uppercase", letterSpacing: ".05em" })}>{h}</th>
                  )}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 10).map((r, i) => {
                  const s = SHIFTS.find((x) => x.key === r.shift) || SHIFTS[0];
                  return (
                    <tr key={i} onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                        <td className={cssClass({ padding: "7px 10px", fontWeight: 600, color: "#111827" })}>{r.holiday_name}</td>
                        <td className={cssClass({ padding: "7px 10px", color: "#374151" })}>{r.holiday_date}</td>
                        <td className={cssClass({ padding: "7px 10px" })}>
                          <span className={cssClass({ display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: 10, fontWeight: 700, color: s.color, background: s.bg,
                          border: `1px solid ${s.border}`, borderRadius: 999, padding: "1px 7px" })}>
                            {s.icon}{s.key}
                          </span>
                        </td>
                        <td className={cssClass({ padding: "7px 10px", color: "#9ca3af" })}>{r.location || "All"}</td>
                        <td className={cssClass({ padding: "7px 10px" })}>
                          <span className={cssClass({ fontSize: 10, color: r.is_restricted ? "#1d4ed8" : "#15803d" })}>
                            {r.is_restricted ? "Yes" : "No"}
                          </span>
                        </td>
                      </tr>);

                })}
                  {preview.length > 10 &&
                <tr><td colSpan={5} className={cssClass({ padding: "6px 10px", color: "#9ca3af", fontSize: 11, textAlign: "center" })}>
                      … and {preview.length - 10} more rows
                    </td></tr>
                }
                </tbody>
              </table>
            </div>
          </div>
        }

        <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 10 })}>
          <Btn variant="cancel" onClick={onClose}>Cancel</Btn>
          {preview &&
          <Btn variant="green" disabled={loading} onClick={handleImport}>
              <Upload size={14} />{loading ? "Importing…" : `Import ${preview.length} Holidays`}
            </Btn>
          }
        </div>
      </div>
    </div>);

}

/* ═══════════════════════════════════════════════
   HOLIDAY FORM MODAL (Add / Edit)
═══════════════════════════════════════════════ */
const EMPTY_FORM = {
  holiday_name: "", holiday_date: "",
  shift: "general", location: "", is_restricted: false
};

function HolidayModal({ initial, locations, defaultShift, onClose, onSave }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, shift: defaultShift, ...(initial || {}) });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.holiday_name.trim() || !form.holiday_date) {alert("Name and date required");return;}
    setSaving(true);
    try {await onSave(form);}
    catch (err) {alert(err.message);setSaving(false);}
  };

  const shiftInfo = SHIFTS.find((s) => s.key === form.shift);

  return (
    <div className={cssClass({ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center" })}>
      <div className={cssClass({ background: "#fff", borderRadius: 16, padding: 28, width: 480, boxShadow: "0 12px 48px #0003" })}>
        <div className={cssClass({ fontSize: 17, fontWeight: 800, color: "#111827", marginBottom: 20 })}>
          {initial?.holiday_id ? "Edit Holiday" : "Add Holiday"}
        </div>
        <form onSubmit={handleSubmit} className={cssClass({ display: "flex", flexDirection: "column", gap: 14 })}>
          <div>
            <label className={cssClass({ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280",
              marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" })}>
              Holiday Name *
            </label>
            <input value={form.holiday_name} onChange={(e) => set("holiday_name", e.target.value)}
            placeholder="e.g. Diwali, Christmas…" className={cssClass(
              { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
                fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" })} />
          </div>
          <div>
            <label className={cssClass({ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280",
              marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" })}>Date *</label>
            <input type="date" value={form.holiday_date?.slice(0, 10) || ""}
            onChange={(e) => set("holiday_date", e.target.value)} className={cssClass(
              { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
                fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" })} />
          </div>
          {/* Shift picker */}
          <div>
            <label className={cssClass({ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280",
              marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" })}>Shift</label>
            <div className={cssClass({ display: "flex", gap: 8 })}>
              {SHIFTS.map((s) =>
              <button key={s.key} type="button" onClick={() => set("shift", s.key)} className={cssClass(
                {
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "9px 0", borderRadius: 8,
                  border: `1.5px solid ${form.shift === s.key ? s.color : "#e5e7eb"}`,
                  background: form.shift === s.key ? s.bg : "#fafafa",
                  color: form.shift === s.key ? s.color : "#9ca3af",
                  fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .15s"
                })}>{s.icon}{s.label.split(" ")[0]}</button>
              )}
            </div>
          </div>
          {/* Location */}
          <div>
            <label className={cssClass({ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280",
              marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" })}>
              Location <span className={cssClass({ fontWeight: 400, textTransform: "none" })}>(blank = all)</span>
            </label>
            <div className={cssClass({ position: "relative" })}>
              <MapPin size={14} className={cssClass({ position: "absolute", left: 10, top: "50%",
                transform: "translateY(-50%)", color: "#9ca3af" })} />
              <input list="loc-list" value={form.location || ""}
              onChange={(e) => set("location", e.target.value)} placeholder="All locations" className={cssClass(
                { width: "100%", padding: "9px 12px 9px 30px", borderRadius: 8,
                  border: "1px solid #e5e7eb", fontSize: 13, outline: "none",
                  boxSizing: "border-box", fontFamily: "inherit" })} />
              <datalist id="loc-list">
                {locations.map((l) => <option key={l} value={l} />)}
              </datalist>
            </div>
          </div>
          <label className={cssClass({ display: "flex", alignItems: "center", gap: 8,
            fontSize: 13, color: "#374151", cursor: "pointer" })}>
            <input type="checkbox" checked={!!form.is_restricted}
            onChange={(e) => set("is_restricted", e.target.checked)} className={cssClass(
              { accentColor: B, width: 14, height: 14 })} />
            Restricted Holiday
            <span className={cssClass({ color: "#9ca3af", fontSize: 12 })}>(employee opts in)</span>
          </label>
          {/* Preview banner */}
          <div className={cssClass({ padding: "10px 14px", borderRadius: 8,
            background: shiftInfo.bg, border: `1px solid ${shiftInfo.border}`,
            display: "flex", alignItems: "center", gap: 8 })}>
            <span className={cssClass({ color: shiftInfo.color })}>{shiftInfo.icon}</span>
            <span className={cssClass({ fontSize: 12, color: shiftInfo.color, fontWeight: 600 })}>
              <strong>{shiftInfo.label}</strong>
              {form.location ? ` · ${form.location}` : " · All locations"}
            </span>
          </div>
          <div className={cssClass({ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 })}>
            <Btn type="button" variant="cancel" onClick={onClose}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>
              <Check size={14} />{saving ? "Saving…" : "Save Holiday"}
            </Btn>
          </div>
        </form>
      </div>
    </div>);

}

/* ═══════════════════════════════════════════════
   SHIFT HOLIDAY TABLE
═══════════════════════════════════════════════ */
function ShiftHolidayTable({ shift, year, locationFilter, allHolidays, onEdit, onDelete }) {
  const today = new Date();today.setHours(0, 0, 0, 0);
  const filtered = useMemo(() =>
  allHolidays.filter((h) =>
  h.shift === shift.key && (
  !locationFilter || h.location === locationFilter)
  ).sort((a, b) => parseLocalDate(a.holiday_date) - parseLocalDate(b.holiday_date)),
  [allHolidays, shift.key, locationFilter]);

  const upcoming = filtered.filter((h) => parseLocalDate(h.holiday_date) >= today);
  const past = filtered.filter((h) => parseLocalDate(h.holiday_date) < today);
  const [tab, setTab] = useState("upcoming");
  const rows = tab === "upcoming" ? upcoming : past;

  const TH = ({ children }) =>
  <th className={cssClass({ padding: "10px 14px", fontWeight: 700, fontSize: 11, color: "#9ca3af",
    textTransform: "uppercase", letterSpacing: ".06em", textAlign: "left",
    borderBottom: "1px solid #e9eaec", background: "#fafafa", whiteSpace: "nowrap" })}>
      {children}
    </th>;


  return (
    <div>
      <div className={cssClass({ display: "flex", gap: 0, borderBottom: `2px solid #e9eaec`, marginBottom: 18 })}>
        {[{ key: "upcoming", label: `Upcoming (${upcoming.length})` }, { key: "history", label: `History (${past.length})` }].map((t) =>
        <button key={t.key} onClick={() => setTab(t.key)} className={cssClass({
          padding: "8px 16px", fontSize: 12, fontWeight: tab === t.key ? 700 : 500,
          color: tab === t.key ? shift.color : "#9ca3af",
          background: "none", border: "none", cursor: "pointer",
          borderBottom: tab === t.key ? `2px solid ${shift.color}` : "2px solid transparent",
          marginBottom: -2, transition: "color .15s"
        })}>{t.label}</button>
        )}
      </div>
      {rows.length === 0 ?
      <div className={cssClass({ textAlign: "center", padding: "32px 0", color: "#9ca3af" })}>
          <Calendar size={32} className={cssClass({ opacity: .3, margin: "0 auto 10px", display: "block" })} />
          <p className={cssClass({ fontSize: 13 })}>
            No {tab === "upcoming" ? "upcoming" : "past"} holidays for {shift.label} in {year}
            {locationFilter ? ` · ${locationFilter}` : ""}
          </p>
        </div> :

      <div className={cssClass({ border: "1px solid #e9eaec", borderRadius: 12, overflow: "hidden" })}>
          <table className={cssClass({ width: "100%", borderCollapse: "collapse", fontSize: 13 })}>
            <thead><tr>
              <TH>#</TH><TH>Date</TH><TH>Day</TH><TH>Holiday</TH>
              <TH>Location</TH><TH>Type</TH><TH></TH>
            </tr></thead>
            <tbody>
              {rows.map((h, idx) => {
              const isToday = parseLocalDate(h.holiday_date)?.toDateString() === today.toDateString();
              return (
                <tr key={h.holiday_id}

                onMouseEnter={(e) => e.currentTarget.style.background = shift.bg}
                onMouseLeave={(e) => e.currentTarget.style.background = isToday ? BL : idx % 2 === 0 ? "#fff" : "#fafafa"} className={cssClass({ background: isToday ? BL : idx % 2 === 0 ? "#fff" : "#fafafa" })}>
                    <td className={cssClass({ padding: "11px 14px", color: "#9ca3af", fontWeight: 600 })}>{idx + 1}</td>
                    <td className={cssClass({ padding: "11px 14px", whiteSpace: "nowrap", fontWeight: 600, color: "#111827" })}>
                      {fmtDate(h.holiday_date)}
                      {isToday && <span className={cssClass({ marginLeft: 6, fontSize: 10, background: B,
                      color: "#fff", borderRadius: 4, padding: "1px 5px", fontWeight: 700 })}>TODAY</span>}
                    </td>
                    <td className={cssClass({ padding: "11px 14px", color: "#6b7280" })}>{dayName(h.holiday_date)}</td>
                    <td className={cssClass({ padding: "11px 14px", fontWeight: 600, color: "#1a1a1a" })}>{h.holiday_name}</td>
                    <td className={cssClass({ padding: "11px 14px" })}>
                      {h.location ?
                    <span className={cssClass({ display: "flex", alignItems: "center", gap: 4, color: "#374151", fontSize: 12 })}>
                          <MapPin size={11} color={shift.color} />{h.location}
                        </span> :
                    <span className={cssClass({ color: "#9ca3af", fontSize: 12 })}>All</span>}
                    </td>
                    <td className={cssClass({ padding: "11px 14px" })}>
                      <span className={cssClass({
                      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
                      background: h.is_restricted ? "#eff6ff" : "#f0fdf4",
                      color: h.is_restricted ? "#1d4ed8" : "#15803d",
                      border: `1px solid ${h.is_restricted ? "#bfdbfe" : "#bbf7d0"}`
                    })}>{h.is_restricted ? "Restricted" : "Public"}</span>
                    </td>
                    <td className={cssClass({ padding: "11px 14px" })}>
                      <div className={cssClass({ display: "flex", gap: 6 })}>
                        <Btn size="sm" variant="cancel" onClick={() => onEdit(h)}>
                          <Edit2 size={11} />Edit
                        </Btn>
                        <Btn size="sm" variant="danger" onClick={() => onDelete(h)}>
                          <Trash2 size={11} />
                        </Btn>
                      </div>
                    </td>
                  </tr>);

            })}
            </tbody>
          </table>
        </div>
      }
    </div>);

}

/* ═══════════════════════════════════════════════
   HOLIDAY SUMMARY (right panel)
═══════════════════════════════════════════════ */
function HolidaySummary({ allHolidays, year, locationFilter }) {
  const today = new Date();today.setHours(0, 0, 0, 0);
  const base = locationFilter ? allHolidays.filter((h) => h.location === locationFilter) : allHolidays;

  const shiftCounts = SHIFTS.map((s) => ({
    ...s,
    total: base.filter((h) => h.shift === s.key).length,
    upcoming: base.filter((h) => h.shift === s.key && parseLocalDate(h.holiday_date) >= today).length
  }));
  const nextHoliday = [...base].
  filter((h) => parseLocalDate(h.holiday_date) >= today).
  sort((a, b) => parseLocalDate(a.holiday_date) - parseLocalDate(b.holiday_date))[0];
  const thisMonth = base.filter((h) => {
    const d = parseLocalDate(h.holiday_date);
    return d && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  return (
    <div className={cssClass({ background: "#fff", border: "1px solid #e9eaec", borderRadius: 14,
      boxShadow: "0 1px 6px #0000000a", overflow: "hidden" })}>
      <div className={cssClass({ padding: "18px 20px", borderBottom: "1px solid #e9eaec" })}>
        <div className={cssClass({ fontSize: 16, fontWeight: 800, color: "#111827",
          fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" })}>Holiday Summary</div>
        <div className={cssClass({ fontSize: 11, color: "#9ca3af", marginTop: 2 })}>
          01 Jan – 31 Dec {year}{locationFilter ? ` · ${locationFilter}` : ""}
        </div>
      </div>
      {/* Per-shift */}
      <div className={cssClass({ padding: "16px 20px", borderBottom: "1px solid #e9eaec" })}>
        <div className={cssClass({ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase",
          letterSpacing: ".06em", marginBottom: 12 })}>By Shift</div>
        <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10 })}>
          {shiftCounts.map((s) =>
          <div key={s.key} className={cssClass({ display: "flex", alignItems: "center",
            background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "10px 14px" })}>
              <span className={cssClass({ color: s.color, marginRight: 8 })}>{s.icon}</span>
              <div className={cssClass({ flex: 1 })}>
                <div className={cssClass({ fontSize: 12, fontWeight: 700, color: s.color })}>{s.label}</div>
                <div className={cssClass({ fontSize: 11, color: "#9ca3af" })}>{s.upcoming} upcoming</div>
              </div>
              <div className={cssClass({ fontSize: 22, fontWeight: 900, color: s.color })}>{s.total}</div>
            </div>
          )}
        </div>
      </div>
      {/* This month */}
      <div className={cssClass({ padding: "16px 20px", borderBottom: "1px solid #e9eaec" })}>
        <div className={cssClass({ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase",
          letterSpacing: ".06em", marginBottom: 10 })}>This Month ({MONTHS[today.getMonth()]})</div>
        {thisMonth.length === 0 ?
        <p className={cssClass({ fontSize: 12, color: "#9ca3af" })}>No holidays this month.</p> :
        thisMonth.map((h, i) => {
          const s = SHIFTS.find((x) => x.key === h.shift) || SHIFTS[0];
          return (
            <div key={i} className={cssClass({ display: "flex", alignItems: "center", gap: 10, padding: "7px 0",
              borderBottom: i < thisMonth.length - 1 ? "1px solid #f5f5f5" : "none" })}>
              <span className={cssClass({ color: s.color })}>{s.icon}</span>
              <div className={cssClass({ flex: 1 })}>
                <div className={cssClass({ fontSize: 12, fontWeight: 600, color: "#111827" })}>{h.holiday_name}</div>
                <div className={cssClass({ fontSize: 11, color: "#9ca3af" })}>{fmtDate(h.holiday_date)} · {s.label.split(" ")[0]}</div>
              </div>
            </div>);

        })}
      </div>
      {/* Next holiday */}
      <div className={cssClass({ padding: "16px 20px" })}>
        <div className={cssClass({ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase",
          letterSpacing: ".06em", marginBottom: 10 })}>Next Holiday</div>
        {!nextHoliday ? <p className={cssClass({ fontSize: 12, color: "#9ca3af" })}>No upcoming holidays for {year}.</p> :
        (() => {
          const s = SHIFTS.find((x) => x.key === nextHoliday.shift) || SHIFTS[0];
          const d = parseLocalDate(nextHoliday.holiday_date);
          const diff = Math.ceil((d - today) / 86400000);
          return (
            <div className={cssClass({ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10,
              padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" })}>
              <div className={cssClass({ background: s.color, color: "#fff", borderRadius: 8,
                padding: "6px 10px", textAlign: "center", minWidth: 48 })}>
                <div className={cssClass({ fontSize: 20, fontWeight: 900, lineHeight: 1 })}>{d.getDate()}</div>
                <div className={cssClass({ fontSize: 9, textTransform: "uppercase", marginTop: 2 })}>
                  {MONTHS[d.getMonth()]?.slice(0, 3)}
                </div>
              </div>
              <div>
                <div className={cssClass({ fontSize: 14, fontWeight: 700, color: "#111827" })}>{nextHoliday.holiday_name}</div>
                <div className={cssClass({ fontSize: 11, color: "#9ca3af", marginTop: 2 })}>{dayName(nextHoliday.holiday_date)}</div>
                <div className={cssClass({ fontSize: 11, color: s.color, fontWeight: 700, marginTop: 3 })}>
                  {diff === 0 ? "Today!" : diff === 1 ? "Tomorrow" : `In ${diff} days`} · {s.label}
                </div>
              </div>
            </div>);

        })()}
      </div>
    </div>);

}

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
export default function TimeOff() {
  const [shift, setShift] = useState("general");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [locationFilter, setLocFilter] = useState("");
  const [allHolidays, setAll] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editModal, setEditModal] = useState(null); // null | holiday | {}
  const [showEdit, setShowEdit] = useState(false);
  const [showCSV, setShowCSV] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hols, locs] = await Promise.all([
      listHolidays({ year, limit: 500 }).catch(() => []),
      listHolidayLocations().catch(() => [])]
      );
      setAll(Array.isArray(hols) ? hols : []);
      setLocations(Array.isArray(locs) ? locs : []);
    } finally {setLoading(false);}
  }, [year]);

  useEffect(() => {load();}, [load]);

  const handleSave = async (form) => {
    form.holiday_id ?
    await updateHoliday(form.holiday_id, form) :
    await createHoliday(form);
    showToast(form.holiday_id ? "Holiday updated" : "Holiday added");
    setShowEdit(false);setEditModal(null);load();
  };

  const handleDelete = async (h) => {
    if (!window.confirm(`Delete "${h.holiday_name}"?`)) return;
    try {await deleteHoliday(h.holiday_id);showToast("Deleted");load();}
    catch (e) {showToast(e.message, "error");}
  };

  const handleCSVImported = (count) => {
    setShowCSV(false);
    showToast(`${count} holidays imported and distributed by shift`);
    load();
  };

  const allLocations = useMemo(() => {
    const s = new Set([...locations, ...allHolidays.map((h) => h.location).filter(Boolean)]);
    return [...s];
  }, [allHolidays, locations]);

  const currentShift = SHIFTS.find((s) => s.key === shift);

  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f8f9fb", padding: "24px 28px",
      fontFamily: "'Inter','Plus Jakarta Sans',system-ui,sans-serif" })}>
      <Toast {...toast || { msg: null }} />

      <div className={cssClass({ maxWidth: 1280, margin: "0 auto" })}>
        {/* Header */}
        <div className={cssClass({ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12, marginBottom: 22 })}>
          <div>
            <h1 className={cssClass({ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827",
              fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", letterSpacing: "-0.025em" })}>
              Time Off &amp; Holidays
            </h1>
            <p className={cssClass({ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" })}>
              Shift-specific holiday calendars · General · Mid · Night · location-wise filter
            </p>
          </div>
          <div className={cssClass({ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" })}>
            <select value={locationFilter} onChange={(e) => setLocFilter(e.target.value)} className={cssClass(
              { padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
                fontSize: 13, color: "#374151", minWidth: 160 })}>
              <option value="">All Locations</option>
              {allLocations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={cssClass(
              { padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
                fontSize: 13, color: "#374151" })}>
              {YEAR_OPTIONS.map((y) => <option key={y}>{y}</option>)}
            </select>
            <Btn variant="cancel" onClick={() => setShowCSV(true)}>
              <Upload size={14} />Upload CSV
            </Btn>
            <Btn onClick={() => {setEditModal(null);setShowEdit(true);}}>
              <Plus size={15} />Add Holiday
            </Btn>
          </div>
        </div>

        <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 300px", gap: 22, alignItems: "start" })}>
          {/* LEFT */}
          <div className={cssClass({ background: "#fff", border: "1px solid #e9eaec", borderRadius: 14,
            boxShadow: "0 1px 6px #0000000a", overflow: "hidden" })}>

            {/* Shift tabs */}
            <div className={cssClass({ display: "flex", borderBottom: "2px solid #e9eaec", background: "#fafafa" })}>
              {SHIFTS.map((s) => {
                const count = allHolidays.filter((h) => h.shift === s.key && (
                !locationFilter || h.location === locationFilter)).length;
                const active = shift === s.key;
                return (
                  <button key={s.key} onClick={() => setShift(s.key)} className={cssClass({
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 7, padding: "14px 10px", fontSize: 13,
                    fontWeight: active ? 800 : 500,
                    color: active ? s.color : "#9ca3af",
                    background: active ? s.bg : "transparent",
                    border: "none", cursor: "pointer",
                    borderBottom: active ? `2px solid ${s.color}` : "2px solid transparent",
                    marginBottom: -2, transition: "all .15s"
                  })}>
                    <span className={cssClass({ color: active ? s.color : "#c4c4c4" })}>{s.icon}</span>
                    {s.label}
                    <span className={cssClass({ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                      background: active ? s.color : "#e5e7eb", color: active ? "#fff" : "#9ca3af", marginLeft: 2 })}>
                      {count}
                    </span>
                  </button>);

              })}
            </div>

            {/* Shift banner */}
            <div className={cssClass({ padding: "12px 20px", display: "flex", alignItems: "center", gap: 10,
              background: currentShift.bg, borderBottom: `1px solid ${currentShift.border}` })}>
              <span className={cssClass({ color: currentShift.color })}>{currentShift.icon}</span>
              <span className={cssClass({ fontSize: 12, fontWeight: 700, color: currentShift.color })}>
                {currentShift.label} Calendar
              </span>
              <span className={cssClass({ fontSize: 12, color: "#9ca3af" })}>
                — visible to all {currentShift.label.toLowerCase()} employees
                {locationFilter ? ` in ${locationFilter}` : ""}
              </span>
              <div className={cssClass({ marginLeft: "auto" })}>
                <Btn size="sm" onClick={() => {setEditModal(null);setShowEdit(true);}}>
                  <Plus size={12} />Add
                </Btn>
              </div>
            </div>

            {/* Table */}
            <div className={cssClass({ padding: "18px 20px" })}>
              {loading ?
              <div className={cssClass({ textAlign: "center", padding: 48, color: "#9ca3af" })}>Loading…</div> :

              <ShiftHolidayTable
                shift={currentShift} year={year}
                locationFilter={locationFilter} allHolidays={allHolidays}
                onEdit={(h) => {setEditModal(h);setShowEdit(true);}}
                onDelete={handleDelete} />

              }
            </div>
          </div>

          {/* RIGHT */}
          <HolidaySummary allHolidays={allHolidays} year={year} locationFilter={locationFilter} />
        </div>

        {/* Shift legend */}
        <div className={cssClass({ marginTop: 18, padding: "14px 18px", borderRadius: 10,
          background: "#fff8f0", border: "1px solid #fed7aa",
          display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 })}>
          {SHIFTS.map((s) =>
          <div key={s.key} className={cssClass({ display: "flex", gap: 10 })}>
              <span className={cssClass({ color: s.color, marginTop: 1 })}>{s.icon}</span>
              <div>
                <div className={cssClass({ fontSize: 12, fontWeight: 700, color: s.color })}>{s.label}</div>
                <div className={cssClass({ fontSize: 11, color: "#9ca3af" })}>
                  {s.key === "general" && "Standard 9–6 employees — national + state public holidays"}
                  {s.key === "mid" && "Afternoon–evening shift — may skip AM-only public events"}
                  {s.key === "night" && "Overnight shift — holiday carries over to next calendar day"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showEdit &&
      <HolidayModal
        initial={editModal} locations={allLocations} defaultShift={shift}
        onClose={() => {setShowEdit(false);setEditModal(null);}}
        onSave={handleSave} />

      }
      {showCSV &&
      <CSVUploadModal
        onClose={() => setShowCSV(false)}
        onImported={handleCSVImported} />

      }
    </div>);

}

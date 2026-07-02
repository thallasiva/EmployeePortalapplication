import React, { useState } from "react";
import {
  Download, FileSpreadsheet, FileText, Users,
  Calendar, ClipboardList, Receipt, Loader2 } from
"lucide-react";
import apiClient from "../../../api/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────
import { cssClass, joinClasses } from "../../../utils/classStyles";
function pad(n) {return String(n).padStart(2, "0");}

function currentMonthYear() {
  const d = new Date();
  return { month: pad(d.getMonth() + 1), year: String(d.getFullYear()) };
}

const MONTHS = [
{ value: "01", label: "January" }, { value: "02", label: "February" },
{ value: "03", label: "March" }, { value: "04", label: "April" },
{ value: "05", label: "May" }, { value: "06", label: "June" },
{ value: "07", label: "July" }, { value: "08", label: "August" },
{ value: "09", label: "September" }, { value: "10", label: "October" },
{ value: "11", label: "November" }, { value: "12", label: "December" }];


function yearOptions() {
  const y = new Date().getFullYear();
  return [y - 1, y, y + 1].map(String);
}

async function triggerDownload(url, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const full = `${url}${qs ? "?" + qs : ""}`;
  const resp = await apiClient.get(full, { responseType: "blob" });
  const blob = new Blob([resp.data], { type: resp.headers["content-type"] || "application/octet-stream" });
  const cd = resp.headers["content-disposition"] || "";
  const match = cd.match(/filename="?([^"]+)"?/);
  const name = match ? match[1] : "download";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─── MonthYearPicker ──────────────────────────────────────────────────────────

function MonthYearPicker({ month, year, onMonth, onYear }) {
  const selectStyle = {
    padding: "6px 10px", fontSize: 13, border: "1px solid #e2e8f0",
    borderRadius: 7, outline: "none", color: "#334155", background: "#f8fafc"
  };
  return (
    <div className={cssClass({ display: "flex", gap: 8, alignItems: "center", marginTop: 10 })}>
      <select value={month} onChange={(e) => onMonth(e.target.value)} className={cssClass(selectStyle)}>
        {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
      <select value={year} onChange={(e) => onYear(e.target.value)} className={cssClass(selectStyle)}>
        {yearOptions().map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>);

}

// ─── ReportCard ───────────────────────────────────────────────────────────────

function ReportCard({ icon: Icon, iconBg, iconColor, title, description, children, onDownload, loading }) {
  return (
    <div className={cssClass({
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14,
      padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
    })}>
      <div className={cssClass({ display: "flex", alignItems: "flex-start", gap: 14 })}>
        <div className={cssClass({
          width: 44, height: 44, borderRadius: 10, background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
        })}>
          <Icon size={20} className={cssClass({ color: iconColor })} />
        </div>
        <div className={cssClass({ flex: 1, minWidth: 0 })}>
          <p className={cssClass({ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" })}>{title}</p>
          <p className={cssClass({ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" })}>{description}</p>
        </div>
      </div>

      {children}

      <button
        type="button"
        onClick={onDownload}
        disabled={loading}







        onMouseEnter={(e) => {if (!loading) e.currentTarget.style.opacity = "0.85";}}
        onMouseLeave={(e) => {e.currentTarget.style.opacity = "1";}} className={cssClass({ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", background: loading ? "#f1f5f9" : iconBg, color: loading ? "#94a3b8" : iconColor, border: `1px solid ${loading ? "#e2e8f0" : iconColor + "55"}`, transition: "all 0.15s", marginTop: 4 })}>
        
        {loading ?
        <><Loader2 size={15} className={cssClass({ animation: "spin 1s linear infinite" })} /> Generating…</> :
        <><Download size={15} /> Download</>
        }
      </button>
    </div>);

}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function DownloadReports() {
  const def = currentMonthYear();
  const [loading, setLoading] = useState({});

  // Per-report params
  const [lbDate, setLbDate] = useState(new Date().toISOString().slice(0, 10));
  const [lsFrom, setLsFrom] = useState(`${def.year}-01-01`);
  const [lsTo, setLsTo] = useState(`${def.year}-12-31`);
  const [pfMonth, setPfMonth] = useState(def.month);
  const [pfYear, setPfYear] = useState(def.year);
  const [ptMonth, setPtMonth] = useState(def.month);
  const [ptYear, setPtYear] = useState(def.year);
  const [ptState, setPtState] = useState("Telangana");
  const [ecrMonth, setEcrMonth] = useState(def.month);
  const [ecrYear, setEcrYear] = useState(def.year);
  const [ecrCode, setEcrCode] = useState("");

  const dl = async (key, url, params) => {
    setLoading((p) => ({ ...p, [key]: true }));
    try {await triggerDownload(url, params);}
    catch (e) {alert("Download failed: " + (e?.message || "Unknown error"));} finally
    {setLoading((p) => ({ ...p, [key]: false }));}
  };

  const inputStyle = {
    padding: "6px 10px", fontSize: 13, border: "1px solid #e2e8f0",
    borderRadius: 7, outline: "none", color: "#334155", background: "#f8fafc", width: "100%", boxSizing: "border-box"
  };
  const labelStyle = { fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 3 };

  return (
    <div className={cssClass({ padding: "0 0 40px" })}>
      <div className={cssClass({ marginBottom: 24 })}>
        <h2 className={cssClass({ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" })}>Report Downloads</h2>
        <p className={cssClass({ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" })}>
          Generate statutory and HR reports in Excel / text format, matching standard templates.
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 18 })}>

        {/* 1. EMP Data */}
        <ReportCard
          icon={Users} iconBg="#eff6ff" iconColor="#2563eb"
          title="Employee Master Data"
          description="Full employee directory with all HR fields (55 columns)"
          loading={loading.emp}
          onDownload={() => dl("emp", "/reports/download/emp-data")} />
        

        {/* 2. Leave Balance As On A Day */}
        <ReportCard
          icon={Calendar} iconBg="#f0fdf4" iconColor="#16a34a"
          title="Leave Balance As On A Day"
          description="Current leave balances (Comp Off, EL, Paternity, RH, SL) per employee"
          loading={loading.lb}
          onDownload={() => dl("lb", "/reports/download/leave-balance", { date: lbDate })}>
          
          <div>
            <label className={cssClass(labelStyle)}>As On Date</label>
            <input type="date" value={lbDate} onChange={(e) => setLbDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)} className={cssClass(inputStyle)} />
          </div>
        </ReportCard>

        {/* 3. Leave Summary */}
        <ReportCard
          icon={ClipboardList} iconBg="#fdf4ff" iconColor="#9333ea"
          title="Leave Summary Report"
          description="Opening balance, eligibility, availed & closing per employee for a date range"
          loading={loading.ls}
          onDownload={() => dl("ls", "/reports/download/leave-summary", { from: lsFrom, to: lsTo })}>
          
          <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 })}>
            <div>
              <label className={cssClass(labelStyle)}>From Date</label>
              <input type="date" value={lsFrom} onChange={(e) => setLsFrom(e.target.value)} className={cssClass(inputStyle)} />
            </div>
            <div>
              <label className={cssClass(labelStyle)}>To Date</label>
              <input type="date" value={lsTo} onChange={(e) => setLsTo(e.target.value)} className={cssClass(inputStyle)} />
            </div>
          </div>
        </ReportCard>

        {/* 4. PF Monthly Statement */}
        <ReportCard
          icon={FileSpreadsheet} iconBg="#fff7ed" iconColor="#ea580c"
          title="PF Monthly Statement"
          description="Employee & employer PF / EPS / EDLI contributions with UAN and PF numbers"
          loading={loading.pf}
          onDownload={() => dl("pf", "/reports/download/pf-statement", { month: pfMonth, year: pfYear })}>
          
          <MonthYearPicker month={pfMonth} year={pfYear} onMonth={setPfMonth} onYear={setPfYear} />
        </ReportCard>

        {/* 5. Profession Tax */}
        <ReportCard
          icon={Receipt} iconBg="#fff1f2" iconColor="#e11d48"
          title="Profession Tax Statement"
          description="Monthly PT statement with slab-wise summary and employee-wise PT amount"
          loading={loading.pt}
          onDownload={() => dl("pt", "/reports/download/profession-tax", { month: ptMonth, year: ptYear, state: ptState })}>
          
          <MonthYearPicker month={ptMonth} year={ptYear} onMonth={setPtMonth} onYear={setPtYear} />
          <div className={cssClass({ marginTop: 4 })}>
            <label className={cssClass(labelStyle)}>State</label>
            <select value={ptState} onChange={(e) => setPtState(e.target.value)} className={cssClass({ ...inputStyle, width: "auto" })}>
              {["Telangana", "Maharashtra", "Karnataka", "Tamil Nadu", "West Bengal", "Andhra Pradesh"].map((s) =>
              <option key={s} value={s}>{s}</option>
              )}
            </select>
          </div>
        </ReportCard>

        {/* 6. ECR File */}
        <ReportCard
          icon={FileText} iconBg="#f0f9ff" iconColor="#0284c7"
          title="ECR File (EPFO)"
          description="Electronic Challan-cum-Return text file for EPFO portal upload"
          loading={loading.ecr}
          onDownload={() => dl("ecr", "/reports/download/ecr-file", { month: ecrMonth, year: ecrYear, estb_code: ecrCode || undefined })}>
          
          <MonthYearPicker month={ecrMonth} year={ecrYear} onMonth={setEcrMonth} onYear={setEcrYear} />
          <div className={cssClass({ marginTop: 4 })}>
            <label className={cssClass(labelStyle)}>Establishment Code (optional)</label>
            <input type="text" value={ecrCode} onChange={(e) => setEcrCode(e.target.value)}
            placeholder="e.g. 100272303987" className={cssClass(inputStyle)} />
          </div>
        </ReportCard>

      </div>
    </div>);

}

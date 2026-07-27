import React, { useState, useEffect, useCallback } from "react";
import Pagination, { usePagination } from "../../../components/Pagination";
import {
  Search, ChevronRight, ChevronDown,
  Monitor, Smartphone, HardDrive, Download,
  LogOut, UserPlus, AlertCircle, Wifi, Globe, ShieldCheck, Users,
  Network, Server, Wrench,
  Navigation, Headphones, RefreshCw, CheckCircle } from
"lucide-react";
import { createTicket, myTickets, closeTicket, reopenTicket, getTicket } from "../../../api/helpdesk.api";import { cssClass, joinClasses } from "../../../utils/classStyles";

const BRAND = "#f18200";
const BRAND_LIGHT = "#fff7ed";
const BRAND_BORDER = "#fed7aa";

/* ── Categories ─────────────────────────────────────────────────────────── */
const CATEGORIES = [
{
  id: "hardware", label: "Hardware and Software",
  topics: [
  { id: "it_help", Icon: Monitor, label: "Get IT help", desc: "Get assistance for general IT problems and questions." },
  { id: "mobile", Icon: Smartphone, label: "New mobile device", desc: "Need a mobile phone or time for replacement? Let us know." },
  { id: "hw_req", Icon: HardDrive, label: "Request new hardware", desc: "For example, a new mouse or monitor." },
  { id: "sw_req", Icon: Download, label: "Request new software", desc: "If you need a software license, raise a request here." }]

},
{
  id: "logins", label: "Logins and Accounts",
  topics: [
  { id: "exit", Icon: LogOut, label: "Exit Clearance", desc: "Initiate or follow up on an exit clearance process." },
  { id: "new_acc", Icon: UserPlus, label: "Request a new account", desc: "Need access to a system or application? Raise it here." },
  { id: "fix_acc", Icon: AlertCircle, label: "Fix an account problem", desc: "Locked out, wrong permissions, or account errors." },
  { id: "wifi", Icon: Wifi, label: "Get a guest wifi account", desc: "Request a temporary guest wifi login for a visitor." },
  { id: "vpn", Icon: Globe, label: "Set up VPN to the office", desc: "Need VPN access to connect to office systems remotely." },
  { id: "admin_acc", Icon: ShieldCheck, label: "Request admin access", desc: "Request elevated or administrative system access." },
  { id: "onboard", Icon: Users, label: "Onboard new employees", desc: "Set up accounts and access for a new team member." }]

},
{
  id: "servers", label: "Servers and Infrastructure",
  topics: [
  { id: "network", Icon: Network, label: "Report a Network Problem", desc: "Slow internet, connectivity drops, or network outages." },
  { id: "server", Icon: Server, label: "Report a system/server problem", desc: "Server down, service unavailable, or performance issues." },
  { id: "hardware2", Icon: Wrench, label: "Report broken hardware", desc: "A device or peripheral is damaged or not working." }]

}];


/* ── Shared urgency / impact options ────────────────────────────────────── */
const URGENCY_OPTIONS = [
"", "Immediately – it's affecting lots of people",
"High – a workaround exists but isn't ideal",
"Medium – there's a workaround available",
"Low – it can wait a little"];

const IMPACT_OPTIONS = [
"", "Affecting the whole organisation",
"Affecting a team or project",
"Affecting just me"];

const SERVICES_OPTIONS = [
"", "Email", "VPN", "Internet / Wi-Fi", "File Server",
"Database", "Web Server", "DNS", "Active Directory",
"Microsoft 365", "Google Workspace", "Other"];


/* ── Topic-specific field configuration ─────────────────────────────────── */
/*
  Each entry may have:
    summaryLabel  – custom label for the Summary field (default "Summary")
    summaryHint   – placeholder / hint text shown below Summary
    fields        – rendered BEFORE Attachment
    afterFields   – rendered AFTER Attachment
  Field types: richtext | datetime | date | select | searchselect | text
  Each field: { key, label, type, required?, options?, placeholder?, note? }
*/
const TOPIC_CONFIG = {
  /* ── Logins and Accounts ── */
  exit: {
    fields: [
    { key: "end_date", label: "Employee End date", type: "datetime", required: true },
    { key: "desc", label: "Description", type: "richtext" }]

  },
  new_acc: {
    summaryHint: "e.g. Create an account on Jira",
    fields: [
    { key: "system", label: "Select a system", type: "select", required: true,
      options: ["", "Jira", "Confluence", "Slack", "GitHub", "Google Workspace",
      "Microsoft 365", "Salesforce", "SAP", "ServiceNow", "Other"] },
    { key: "desc", label: "Tell us why you need an account", type: "richtext" }]

  },
  fix_acc: { fields: [{ key: "desc", label: "Description", type: "richtext" }] },
  wifi: {
    fields: [
    { key: "desc", label: "Description", type: "richtext" },
    { key: "arrival_date", label: "Guest arrival date", type: "date" }]

  },
  vpn: { fields: [{ key: "desc", label: "Description", type: "richtext" }] },
  admin_acc: { fields: [{ key: "desc", label: "Description", type: "richtext" }] },
  onboard: {
    summaryHint: "e.g. Joseph Wilson starts on September 1",
    fields: [
    { key: "start_date", label: "Employee start date", type: "date",
      note: "If you are not sure of the exact date, put in a tentative one." }]

  },

  /* ── Servers and Infrastructure ── */
  network: {
    fields: [
    { key: "desc", label: "Description", type: "richtext" },
    { key: "affected_services", label: "Affected services", type: "searchselect",
      placeholder: "Search for services", options: SERVICES_OPTIONS }],

    afterFields: [
    { key: "urgency", label: "How urgently does this need to be fixed?", type: "select", options: URGENCY_OPTIONS },
    { key: "impact", label: "How big of an impact is the problem to you or the organization?", type: "select", options: IMPACT_OPTIONS }]

  },
  server: {
    summaryLabel: "Summarize the problem",
    fields: [
    { key: "desc", label: "Describe what happened and how it occurred", type: "richtext", required: true },
    { key: "affected_services", label: "Affected services", type: "searchselect",
      placeholder: "Search for services", options: SERVICES_OPTIONS }],

    afterFields: [
    { key: "urgency", label: "How urgently does this need to be fixed?", type: "select", options: URGENCY_OPTIONS },
    { key: "impact", label: "How big of an impact is the problem to you or the organization?", type: "select", options: IMPACT_OPTIONS }]

  },
  hardware2: {
    summaryLabel: "Summarize the problem",
    fields: [
    { key: "desc", label: "Describe what happened and how it occurred", type: "richtext", required: true },
    { key: "affected_hardware", label: "Affected hardware", type: "text" }],

    afterFields: [
    { key: "urgency", label: "How urgently does this need to be fixed?", type: "select", options: URGENCY_OPTIONS },
    { key: "impact", label: "How big of an impact is the problem to you or the organization?", type: "select", options: IMPACT_OPTIONS }]

  }
};

const DEFAULT_FIELDS = [{ key: "desc", label: "Description", type: "richtext" }];

/* ── Shared rich-text toolbar + textarea ────────────────────────────────── */
function RichTextArea({ label, value, onChange, required }) {
  return (
    <div className={cssClass({ marginBottom: 16 })}>
      {label &&
      <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
          {label} {required && <span className={cssClass({ color: "#ef4444" })}>*</span>}
        </label>
      }
      <div className={cssClass({ border: "1px solid #d1d5db", borderRadius: 6, overflow: "hidden" })}>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 1, padding: "5px 8px",
          borderBottom: "1px solid #e5e7eb", background: "#f9fafb", flexWrap: "wrap" })}>
          {["Normal text ▾", "B", "I", "···", "A▾", "≡", "№", "🔗", "@", "☺", "</>", "+▾"].map((lbl, idx) =>
          <button key={idx} type="button" className={cssClass(
            { padding: "2px 6px", border: "none", background: "none",
              fontSize: idx === 0 ? 11 : 13, color: "#374151", cursor: "default",
              fontWeight: lbl === "B" ? 700 : 400, fontStyle: lbl === "I" ? "italic" : "normal" })}>
              {lbl}
            </button>
          )}
        </div>
        <textarea value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="Describe in detail…"
        rows={4} className={cssClass(
          { width: "100%", padding: "10px 12px", border: "none", fontSize: 13,
            outline: "none", resize: "vertical", fontFamily: "inherit",
            boxSizing: "border-box", lineHeight: 1.5, color: "#374151", display: "block" })} />
      </div>
    </div>);

}

/* ── Status colours ─────────────────────────────────────────────────────── */
const STATUS_STYLE = {
  "Open": { bg: "#eff6ff", color: "#2563eb" },
  "Forwarded": { bg: "#f5f3ff", color: "#7c3aed" },
  "In Progress": { bg: "#fff7ed", color: "#c2410c" },
  "Reopened": { bg: "#fff1f2", color: "#be123c" },
  "Resolved": { bg: "#f0fdf4", color: "#15803d" },
  "Closed": { bg: "#f8fafc", color: "#64748b" },
  "Rejected": { bg: "#fef2f2", color: "#b91c1c" }
};

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/* ── HOME VIEW ─────────────────────────────────────────────────────────── */
function HomeView({ onSelectCategory }) {
  const [search, setSearch] = useState("");
  const filtered = search.trim() ?
  CATEGORIES.filter((c) =>
  c.label.toLowerCase().includes(search.toLowerCase()) ||
  c.topics.some((t) => t.label.toLowerCase().includes(search.toLowerCase()))) :
  CATEGORIES;

  return (
    <div className={cssClass({ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto" })}>
      <div className={cssClass({ background: BRAND, padding: "28px 28px 36px", flexShrink: 0 })}>
        <h1 className={cssClass({ fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 14px" })}>
          Welcome to the HR Help Desk
        </h1>
        <div className={cssClass({ position: "relative", maxWidth: 520 })}>
          <Search size={15} className={cssClass({ position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", color: "#94a3b8" })} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for information" className={cssClass(
            { width: "100%", height: 42, paddingLeft: 36, paddingRight: 12,
              border: "2px solid #93c5fd", borderRadius: 4, fontSize: 14,
              outline: "none", background: "#fff", boxSizing: "border-box" })} />
        </div>
      </div>
      <div className={cssClass({ flex: 1, background: "#fff", padding: "22px 28px" })}>
        <p className={cssClass({ fontSize: 13, color: BRAND, margin: "0 0 20px" })}>
          Welcome! You can raise a request using the options provided.
        </p>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 })}>
          <Navigation size={14} color="#374151" />
          <span className={cssClass({ fontSize: 14, fontWeight: 600, color: "#374151" })}>Contact us about</span>
        </div>
        <div className={cssClass({ display: "flex", flexDirection: "column", gap: 16 })}>
          {filtered.map((cat) =>
          <div key={cat.id} onClick={() => onSelectCategory(cat)}



          onMouseEnter={(e) => {e.currentTarget.style.borderColor = BRAND_BORDER;e.currentTarget.style.boxShadow = "0 2px 8px rgba(241,130,0,0.10)";}}
          onMouseLeave={(e) => {e.currentTarget.style.borderColor = "#e5e7eb";e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";}} className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" })}>
              <div className={cssClass({ flex: 1, minWidth: 0, paddingRight: 12 })}>
                <p className={cssClass({ fontSize: 14, fontWeight: 700, color: BRAND, margin: "0 0 5px" })}>{cat.label}</p>
                <p className={cssClass({ fontSize: 13, color: "#6b7280", margin: 0, lineHeight: 1.5 })}>
                  {cat.topics.map((t) => t.label).join(", ")}
                </p>
              </div>
              <ChevronRight size={18} color="#9ca3af" className={cssClass({ flexShrink: 0 })} />
            </div>
          )}
        </div>
      </div>
    </div>);

}

/* ── CATEGORY VIEW ─────────────────────────────────────────────────────── */
function CategoryView({ category, allCategories, onSelectCategory, onSubmitted }) {
  const [activeTopic, setActiveTopic] = useState(null);

  return (
    <div className={cssClass({ flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
      overflow: "auto", background: "#fff", padding: "20px 28px" })}>
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, fontSize: 12,
        color: BRAND, marginBottom: 14 })}>
        <span
          onClick={() => onSelectCategory(null)} className={cssClass({ cursor: "pointer", textDecoration: "underline" })}>HR Help Desk</span>
        <span className={cssClass({ color: "#9ca3af" })}>/</span>
        <span className={cssClass({ color: "#374151" })}>Support</span>
      </div>
      <h2 className={cssClass({ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 4px" })}>{category.label}</h2>
      <p className={cssClass({ fontSize: 13, color: "#374151", margin: "0 0 20px" })}>
        Welcome! You can raise a request for <span className={cssClass({ color: BRAND })}>HR Support</span> using the options provided.
      </p>

      <div className={cssClass({ marginBottom: 20 })}>
        <label className={cssClass({ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6 })}>Contact us about</label>
        <div className={cssClass({ position: "relative" })}>
          <select value={category.id}
          onChange={(e) => onSelectCategory(allCategories.find((c) => c.id === e.target.value))} className={cssClass(
            { width: "100%", height: 38, paddingLeft: 12, paddingRight: 32,
              border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13,
              background: "#fff", outline: "none", cursor: "pointer", appearance: "none", color: "#374151" })}>
            {allCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <ChevronDown size={14} className={cssClass({ position: "absolute", right: 10, top: "50%",
            transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" })} />
        </div>
      </div>

      <p className={cssClass({ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 12px" })}>
        What can we help you with?
      </p>
      <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10 })}>
        {category.topics.map((topic, i) => {
          const { Icon } = topic;
          return (
            <div key={topic.id} onClick={() => setActiveTopic(topic)}




            onMouseEnter={(e) => {e.currentTarget.style.background = BRAND_LIGHT;e.currentTarget.style.borderColor = BRAND_BORDER;}}
            onMouseLeave={(e) => {e.currentTarget.style.background = i % 2 === 1 ? "#f9fafb" : "#fff";e.currentTarget.style.borderColor = "#e5e7eb";}} className={cssClass({ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", background: i % 2 === 1 ? "#f9fafb" : "#fff", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" })}>
              <div className={cssClass({ width: 36, height: 36, border: "1.5px solid #e5e7eb", borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, background: "#fff" })}>
                <Icon size={18} color={BRAND} strokeWidth={1.75} />
              </div>
              <div className={cssClass({ flex: 1, minWidth: 0 })}>
                <p className={cssClass({ fontSize: 14, fontWeight: 600, color: BRAND, margin: "0 0 3px" })}>{topic.label}</p>
                <p className={cssClass({ fontSize: 13, color: "#6b7280", margin: 0 })}>{topic.desc}</p>
              </div>
              <ChevronRight size={16} color="#9ca3af" className={cssClass({ flexShrink: 0 })} />
            </div>);

        })}
      </div>

      {activeTopic &&
      <RequestModal
        category={category}
        topic={activeTopic}
        onClose={() => setActiveTopic(null)}
        onSubmitted={() => {setActiveTopic(null);onSubmitted();}} />

      }
    </div>);

}

/* ── REQUEST MODAL ─────────────────────────────────────────────────────── */
function RequestModal({ category, topic, onClose, onSubmitted }) {
  const config = TOPIC_CONFIG[topic.id] || {};
  const fieldDefs = config.fields || DEFAULT_FIELDS;
  const afterDefs = config.afterFields || [];
  const summaryLabel = config.summaryLabel || "Summary";
  const summaryHint = config.summaryHint || null;

  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);

  // Initialise all field values (fields + afterFields + datetime _time slots)
  const [vals, setVals] = useState(() => {
    const obj = {};
    [...fieldDefs, ...afterDefs].forEach((f) => {
      obj[f.key] = "";
      if (f.type === "datetime") obj[f.key + "_time"] = "";
    });
    return obj;
  });

  const setVal = (key, value) => setVals((prev) => ({ ...prev, [key]: value }));

  const { Icon } = topic;

  useEffect(() => {
    const handler = (e) => {if (e.key === "Escape") onClose();};
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Build description string from all non-summary extra fields
  const buildDescription = () => {
    const parts = [];
    [...fieldDefs, ...afterDefs].forEach((f) => {
      if (f.key === "desc") {
        if (vals.desc?.trim()) parts.push(vals.desc.trim());
      } else if (f.type === "datetime") {
        const d = vals[f.key];const t = vals[f.key + "_time"];
        if (d || t) parts.push(`${f.label}: ${d}${t ? " " + t : ""}`);
      } else {
        if (vals[f.key]?.trim()) parts.push(`${f.label}: ${vals[f.key]}`);
      }
    });
    return parts.join("\n") || null;
  };

  const handleSubmit = async () => {
    if (!summary.trim()) {setError(summaryLabel + " is required.");return;}
    for (const f of [...fieldDefs, ...afterDefs]) {
      if (f.required) {
        const v = f.type === "richtext" ? vals[f.key] : vals[f.key];
        if (!v?.trim()) {setError(`${f.label} is required.`);return;}
      }
    }
    setSubmitting(true);setError(null);
    try {
      await createTicket({
        category: category.label,
        subject: "[" + topic.label + "] " + summary.trim(),
        description: buildDescription(),
        priority: "Medium"
      });
      onSubmitted();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to submit. Please try again.");
    } finally {setSubmitting(false);}
  };

  /* ── Field renderer ──────────────────────────────────────────────────── */
  const inputBase = {
    width: "100%", height: 38, padding: "0 12px",
    border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13,
    outline: "none", boxSizing: "border-box", color: "#374151", background: "#fff"
  };

  const renderField = (f) => {
    switch (f.type) {
      case "richtext":
        return (
          <RichTextArea key={f.key} label={f.label} required={!!f.required}
          value={vals[f.key]} onChange={(v) => setVal(f.key, v)} />);


      case "text":
        return (
          <div key={f.key} className={cssClass({ marginBottom: 16 })}>
            <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
              {f.label} {f.required && <span className={cssClass({ color: "#ef4444" })}>*</span>}
            </label>
            <input value={vals[f.key]} onChange={(e) => setVal(f.key, e.target.value)}
            placeholder={f.placeholder || ""}

            onFocus={(e) => e.target.style.borderColor = BRAND}
            onBlur={(e) => e.target.style.borderColor = "#d1d5db"} className={cssClass(inputBase)} />
          </div>);


      case "datetime":
        return (
          <div key={f.key} className={cssClass({ marginBottom: 16 })}>
            <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
              {f.label} {f.required && <span className={cssClass({ color: "#ef4444" })}>*</span>}
            </label>
            <div className={cssClass({ display: "flex", gap: 10 })}>
              <input type="date" value={vals[f.key]} onChange={(e) => setVal(f.key, e.target.value)}

              onFocus={(e) => e.target.style.borderColor = BRAND}
              onBlur={(e) => e.target.style.borderColor = "#d1d5db"} className={cssClass({ ...inputBase, flex: 1 })} />
              <input type="time" value={vals[f.key + "_time"]} onChange={(e) => setVal(f.key + "_time", e.target.value)}

              onFocus={(e) => e.target.style.borderColor = BRAND}
              onBlur={(e) => e.target.style.borderColor = "#d1d5db"} className={cssClass({ ...inputBase, flex: 1 })} />
            </div>
          </div>);


      case "date":
        return (
          <div key={f.key} className={cssClass({ marginBottom: 16 })}>
            <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
              {f.label} {f.required && <span className={cssClass({ color: "#ef4444" })}>*</span>}
            </label>
            <input type="date" value={vals[f.key]} onChange={(e) => setVal(f.key, e.target.value)}

            onFocus={(e) => e.target.style.borderColor = BRAND}
            onBlur={(e) => e.target.style.borderColor = "#d1d5db"} className={cssClass({ ...inputBase, maxWidth: 200 })} />
            {f.note && <p className={cssClass({ fontSize: 12, color: BRAND, margin: "4px 0 0" })}>{f.note}</p>}
          </div>);


      case "select":
        return (
          <div key={f.key} className={cssClass({ marginBottom: 16 })}>
            <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
              {f.label} {f.required && <span className={cssClass({ color: "#ef4444" })}>*</span>}
            </label>
            <div className={cssClass({ position: "relative" })}>
              <select value={vals[f.key]} onChange={(e) => setVal(f.key, e.target.value)}

              onFocus={(e) => e.target.style.borderColor = BRAND}
              onBlur={(e) => e.target.style.borderColor = "#d1d5db"} className={cssClass({ ...inputBase, appearance: "none", paddingRight: 32, cursor: "pointer" })}>
                {(f.options || []).map((opt, idx) =>
                <option key={idx} value={opt}>{opt || "— select —"}</option>
                )}
              </select>
              <ChevronDown size={14} className={cssClass({ position: "absolute", right: 10, top: "50%",
                transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" })} />
            </div>
          </div>);


      /* Searchable select — rendered as a select with search placeholder */
      case "searchselect":
        return (
          <div key={f.key} className={cssClass({ marginBottom: 16 })}>
            <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
              {f.label} {f.required && <span className={cssClass({ color: "#ef4444" })}>*</span>}
            </label>
            <div className={cssClass({ position: "relative" })}>
              <select value={vals[f.key]} onChange={(e) => setVal(f.key, e.target.value)}


              onFocus={(e) => e.target.style.borderColor = BRAND}
              onBlur={(e) => e.target.style.borderColor = "#d1d5db"} className={cssClass({ ...inputBase, appearance: "none", paddingRight: 32, cursor: "pointer", color: vals[f.key] ? "#374151" : "#9ca3af" })}>
                <option value="">{f.placeholder || "— select —"}</option>
                {(f.options || []).filter((o) => o).map((opt, idx) =>
                <option key={idx} value={opt}>{opt}</option>
                )}
              </select>
              <ChevronDown size={14} className={cssClass({ position: "absolute", right: 10, top: "50%",
                transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" })} />
            </div>
          </div>);


      default:
        return null;
    }
  };

  return (
    <div onClick={onClose} className={cssClass(
      { position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" })}>
      <div onClick={(e) => e.stopPropagation()} className={cssClass(
        { width: "100%", maxWidth: 580, maxHeight: "90vh",
          background: "#fff", borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          display: "flex", flexDirection: "column", overflow: "hidden" })}>

        {/* Header */}
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 12,
          padding: "18px 24px", borderBottom: "1px solid #e5e7eb", flexShrink: 0 })}>
          <div className={cssClass({ width: 40, height: 40, borderRadius: 10,
            background: BRAND_LIGHT, border: "1.5px solid " + BRAND_BORDER,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 })}>
            <Icon size={20} color={BRAND} strokeWidth={1.75} />
          </div>
          <div className={cssClass({ flex: 1, minWidth: 0 })}>
            <p className={cssClass({ fontSize: 15, fontWeight: 700, color: BRAND, margin: 0 })}>{topic.label}</p>
            <p className={cssClass({ fontSize: 12, color: "#6b7280", margin: 0 })}>{topic.desc}</p>
          </div>
          <button onClick={onClose} className={cssClass(
            { background: "none", border: "none", cursor: "pointer",
              color: "#9ca3af", fontSize: 20, lineHeight: 1, padding: 4, flexShrink: 0 })}>✕</button>
        </div>

        {/* Scrollable body */}
        <div className={cssClass({ flex: 1, overflowY: "auto", padding: "22px 24px" })}>
          <p className={cssClass({ fontSize: 12, color: "#9ca3af", margin: "0 0 18px" })}>
            Required fields are marked with an asterisk *
          </p>

          {error &&
          <div className={cssClass({ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6,
            padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 14 })}>{error}</div>
          }

          {/* Summary */}
          <div className={cssClass({ marginBottom: 16 })}>
            <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
              {summaryLabel} <span className={cssClass({ color: "#ef4444" })}>*</span>
            </label>
            <input autoFocus value={summary} onChange={(e) => setSummary(e.target.value)}
            placeholder={summaryHint || "e.g. Issue with " + topic.label}



            onFocus={(e) => e.target.style.borderColor = BRAND}
            onBlur={(e) => e.target.style.borderColor = "#d1d5db"} className={cssClass({ width: "100%", height: 38, padding: "0 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box", color: "#374151" })} />
            {summaryHint &&
            <p className={cssClass({ fontSize: 12, color: BRAND, margin: "4px 0 0" })}>{summaryHint}</p>
            }
          </div>

          {/* Fields before attachment */}
          {fieldDefs.map((f) => renderField(f))}

          {/* Attachment */}
          <div className={cssClass({ marginBottom: afterDefs.length ? 20 : 8 })}>
            <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 })}>
              Attachment
            </label>
            <div className={cssClass({ border: "1px solid #e5e7eb", borderRadius: 6, padding: "18px",
              textAlign: "center", background: "#fafafa" })}>
              <p className={cssClass({ fontSize: 13, color: BRAND, margin: "0 0 10px" })}>
                {file ? file.name : "Drag and drop files, paste screenshots, or browse"}
              </p>
              <label>
                <span className={cssClass({ border: "1px solid #d1d5db", background: "#fff", borderRadius: 4,
                  padding: "6px 22px", fontSize: 13, color: "#374151",
                  cursor: "pointer", display: "inline-block" })}>Browse</span>
                <input type="file" hidden onChange={(e) => setFile(e.target.files[0] || null)} />
              </label>
            </div>
          </div>

          {/* Fields after attachment (urgency / impact) */}
          {afterDefs.map((f) => renderField(f))}
        </div>

        {/* Footer */}
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 12,
          padding: "14px 24px", borderTop: "1px solid #e5e7eb", flexShrink: 0, background: "#fafafa" })}>
          <button type="button" onClick={handleSubmit} disabled={submitting} className={cssClass(
            { background: BRAND, color: "#fff", border: "none", borderRadius: 6,
              padding: "9px 32px", fontSize: 14, fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 })}>
            {submitting ? "Sending…" : "Send"}
          </button>
          <button type="button" onClick={onClose} className={cssClass(
            { background: "none", color: "#6b7280", border: "none",
              padding: "9px 4px", fontSize: 14, cursor: "pointer" })}>
            Cancel
          </button>
        </div>
      </div>
    </div>);

}

/* ── REOPEN MODAL ──────────────────────────────────────────────────────── */
function ReopenModal({ ticket, onClose, onReopened }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleReopen = async () => {
    setLoading(true);setError(null);
    try {
      await reopenTicket(ticket.ticket_id, reason.trim() || null);
      onReopened();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to reopen. Please try again.");
    } finally {setLoading(false);}
  };

  return (
    <div onClick={onClose} className={cssClass(
      { position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20 })}>
      <div onClick={(e) => e.stopPropagation()} className={cssClass(
        { width: "100%", maxWidth: 460, background: "#fff", borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" })}>
        {/* Header */}
        <div className={cssClass({ padding: "18px 22px 14px", borderBottom: "1px solid #e5e7eb",
          display: "flex", alignItems: "center", justifyContent: "space-between" })}>
          <div>
            <p className={cssClass({ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 })}>Reopen this ticket?</p>
            <p className={cssClass({ fontSize: 12, color: "#6b7280", margin: "3px 0 0" })}>
              Tell us what's still not resolved.
            </p>
          </div>
          <button onClick={onClose} className={cssClass(
            { background: "none", border: "none", color: "#9ca3af",
              fontSize: 18, cursor: "pointer", padding: 4 })}>✕</button>
        </div>
        {/* Body */}
        <div className={cssClass({ padding: "18px 22px" })}>
          <div className={cssClass({ padding: "10px 14px", background: "#fff7ed",
            border: "1px solid #fed7aa", borderRadius: 8, marginBottom: 14 })}>
            <p className={cssClass({ fontSize: 13, color: "#92400e", margin: 0, fontWeight: 500 })}>
              📋 {ticket.subject}
            </p>
          </div>
          {error &&
          <div className={cssClass({ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6,
            padding: "8px 12px", fontSize: 12, color: "#dc2626", marginBottom: 12 })}>
              {error}
            </div>
          }
          <label className={cssClass({ fontSize: 13, fontWeight: 600, color: "#374151",
            display: "block", marginBottom: 6 })}>
            Reason for reopening <span className={cssClass({ color: "#9ca3af", fontWeight: 400 })}>(optional)</span>
          </label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. The issue came back after 2 hours, VPN still disconnects…"
          rows={4}



          onFocus={(e) => e.target.style.borderColor = "#be123c"}
          onBlur={(e) => e.target.style.borderColor = "#d1d5db"} className={cssClass({ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" })} />
        </div>
        {/* Footer */}
        <div className={cssClass({ padding: "12px 22px", borderTop: "1px solid #e5e7eb",
          display: "flex", gap: 10, justifyContent: "flex-end", background: "#fafafa" })}>
          <button onClick={onClose} className={cssClass(
            { padding: "8px 20px", border: "1px solid #e5e7eb", borderRadius: 6,
              background: "#fff", color: "#6b7280", fontSize: 13, cursor: "pointer" })}>
            Cancel
          </button>
          <button onClick={handleReopen} disabled={loading} className={cssClass(
            { padding: "8px 20px", borderRadius: 6, border: "none",
              background: "#be123c", color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 })}>
            {loading ? "Reopening…" : "Reopen Ticket"}
          </button>
        </div>
      </div>
    </div>);

}

/* ── TICKET DETAIL MODAL ───────────────────────────────────────────────── */
function TicketDetailModal({ ticketId, onClose, onAction }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTicket(ticketId).
    then((t) => setTicket(t)).
    catch(() => setTicket(null)).
    finally(() => setLoading(false));
  }, [ticketId]);

  const sc = ticket ? STATUS_STYLE[ticket.status] || STATUS_STYLE["Open"] : {};

  const fmtDateTime = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  // Comment author label colour
  const commentStyle = (name, comment) => {
    if (!name) return { bg: "#f3f4f6", color: "#374151", label: "Unknown" };
    const lc = comment?.toLowerCase() || "";
    if (lc.startsWith("[reopened]")) return { bg: "#fff1f2", color: "#be123c", label: name };
    if (lc.startsWith("[rejected]")) return { bg: "#fef2f2", color: "#dc2626", label: name };
    if (lc.startsWith("[approved")) return { bg: "#f5f3ff", color: "#7c3aed", label: name };
    return { bg: "#eff6ff", color: "#2563eb", label: name };
  };

  return (
    <div onClick={onClose} className={cssClass(
      { position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20 })}>
      <div onClick={(e) => e.stopPropagation()} className={cssClass(
        { width: "100%", maxWidth: 600, maxHeight: "88vh", background: "#fff",
          borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          display: "flex", flexDirection: "column", overflow: "hidden" })}>

        {/* Header */}
        <div className={cssClass({ padding: "16px 20px", borderBottom: "1px solid #e5e7eb",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 })}>
          <div className={cssClass({ flex: 1, minWidth: 0 })}>
            {ticket &&
            <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 })}>
                <span className={cssClass({ fontSize: 11, fontWeight: 700, padding: "2px 10px",
                borderRadius: 20, background: sc.bg, color: sc.color })}>
                  {ticket.status}
                </span>
                {ticket.forwarded_to_team &&
              <span className={cssClass({ fontSize: 11, color: "#7c3aed", fontWeight: 500 })}>
                    → {ticket.forwarded_to_team}
                  </span>
              }
                <span className={cssClass({ fontSize: 11, color: "#9ca3af" })}>#{ticket.ticket_id}</span>
              </div>
            }
            <p className={cssClass({ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
              {ticket?.subject || "Loading…"}
            </p>
          </div>
          <button onClick={onClose} className={cssClass(
            { background: "none", border: "none", color: "#9ca3af",
              fontSize: 20, cursor: "pointer", padding: 4, flexShrink: 0 })}>✕</button>
        </div>

        {/* Body */}
        <div className={cssClass({ flex: 1, overflowY: "auto", padding: "16px 20px" })}>
          {loading ?
          <p className={cssClass({ textAlign: "center", color: "#9ca3af", padding: 40 })}>Loading…</p> :
          !ticket ?
          <p className={cssClass({ textAlign: "center", color: "#dc2626", padding: 40 })}>Failed to load ticket.</p> :

          <>
              {/* Ticket meta */}
              <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 })}>
                {[
              { label: "Category", value: ticket.category || "—" },
              { label: "Priority", value: ticket.priority || "—" },
              { label: "Raised on", value: fmtDate(ticket.created_at) },
              { label: "Last update", value: fmtDate(ticket.updated_at || ticket.created_at) }].
              map(({ label, value }) =>
              <div key={label} className={cssClass({ background: "#f8fafc", borderRadius: 8, padding: "8px 12px" })}>
                    <p className={cssClass({ fontSize: 11, color: "#94a3b8", margin: "0 0 2px", textTransform: "uppercase",
                  letterSpacing: "0.05em", fontWeight: 700 })}>{label}</p>
                    <p className={cssClass({ fontSize: 13, color: "#1e293b", fontWeight: 600, margin: 0 })}>{value}</p>
                  </div>
              )}
              </div>

              {/* Description */}
              {ticket.description &&
            <div className={cssClass({ background: "#f8fafc", border: "1px solid #e2e8f0",
              borderRadius: 10, padding: "12px 14px", marginBottom: 16 })}>
                  <p className={cssClass({ fontSize: 11, fontWeight: 700, color: "#94a3b8",
                textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" })}>
                    Your Request
                  </p>
                  <p className={cssClass({ fontSize: 13, color: "#374151", margin: 0, whiteSpace: "pre-wrap",
                lineHeight: 1.6 })}>{ticket.description}</p>
                </div>
            }

              {/* Comments / Activity */}
              {ticket.comments?.length > 0 &&
            <div>
                  <p className={cssClass({ fontSize: 11, fontWeight: 700, color: "#94a3b8",
                textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" })}>
                    Updates from Support Team ({ticket.comments.length})
                  </p>
                  <div className={cssClass({ display: "flex", flexDirection: "column", gap: 8 })}>
                    {ticket.comments.map((c, i) => {
                  const cs = commentStyle(c.commented_by_name, c.comment);
                  return (
                    <div key={c.comment_id || i} className={cssClass(
                      { background: cs.bg, border: `1px solid ${cs.color}22`,
                        borderRadius: 10, padding: "10px 14px",
                        borderLeft: `3px solid ${cs.color}` })}>
                          <div className={cssClass({ display: "flex", alignItems: "center",
                        justifyContent: "space-between", marginBottom: 5 })}>
                            <span className={cssClass({ fontSize: 12, fontWeight: 700, color: cs.color })}>
                              {cs.label}
                            </span>
                            <span className={cssClass({ fontSize: 11, color: "#94a3b8" })}>
                              {fmtDateTime(c.created_at)}
                            </span>
                          </div>
                          <p className={cssClass({ fontSize: 13, color: "#374151", margin: 0,
                        whiteSpace: "pre-wrap", lineHeight: 1.5 })}>
                            {c.comment}
                          </p>
                        </div>);

                })}
                  </div>
                </div>
            }

              {!ticket.comments?.length &&
            <div className={cssClass({ textAlign: "center", padding: "24px 0", color: "#9ca3af" })}>
                  <p className={cssClass({ fontSize: 13, margin: 0 })}>No updates yet — support team will respond soon.</p>
                </div>
            }
            </>
          }
        </div>

        {/* Footer actions */}
        {ticket &&
        <div className={cssClass({ padding: "12px 20px", borderTop: "1px solid #e5e7eb",
          background: "#fafafa", display: "flex", gap: 8, justifyContent: "flex-end" })}>
            {ticket.status === "Resolved" &&
          <>
                <button onClick={() => {onAction("close", ticket);onClose();}} className={cssClass(
              { padding: "7px 16px", borderRadius: 7, border: "none",
                background: "#15803d", color: "#fff", fontWeight: 700,
                fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 })}>
                  <CheckCircle size={14} /> Accept & Close
                </button>
                <button onClick={() => {onAction("reopen", ticket);onClose();}} className={cssClass(
              { padding: "7px 16px", borderRadius: 7,
                border: "1.5px solid #be123c", background: "#fff",
                color: "#be123c", fontWeight: 700, fontSize: 13, cursor: "pointer" })}>
                  Not Satisfied
                </button>
              </>
          }
            <button onClick={onClose} className={cssClass(
            { padding: "7px 16px", borderRadius: 7, border: "1px solid #e2e8f0",
              background: "#fff", color: "#6b7280", fontSize: 13, cursor: "pointer" })}>
              Close
            </button>
          </div>
        }
      </div>
    </div>);

}

/* ── MY TICKETS ────────────────────────────────────────────────────────── */
function MyTicketsView({ onNewRequest }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [closing, setClosing] = useState(null);
  const [reopenFor, setReopenFor] = useState(null);
  const [viewTicket, setViewTicket] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await myTickets({ limit: 50 });
      setTickets(Array.isArray(data) ? data : data?.rows ?? []);
    } catch {setTickets([]);} finally
    {setLoading(false);}
  }, []);

  useEffect(() => {load();}, [load]);

  const handleClose = async (ticketId) => {
    setClosing(ticketId);
    try {await closeTicket(ticketId);await load();}
    catch {} finally
    {setClosing(null);}
  };

  const visible = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);
  const { paged: pagedTickets, page: tkPage, setPage: setTkPage, totalPages: tkTotalPages, from: tkFrom, to: tkTo, total: tkTotal, pageSize: tkPageSize, setPageSize: setTkPageSize } = usePagination(visible);

  return (
    <div className={cssClass({ flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
      background: "#fff", padding: "20px 28px" })}>
      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 })}>
        <div>
          <h2 className={cssClass({ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 })}>My Tickets</h2>
          <p className={cssClass({ fontSize: 12, color: "#6b7280", margin: "2px 0 0" })}>Click any ticket to view updates and comments</p>
        </div>
        <div className={cssClass({ display: "flex", gap: 8 })}>
          <button onClick={load} className={cssClass({ border: "1px solid #d1d5db", background: "#fff",
            borderRadius: 4, padding: "6px 12px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#6b7280" })}>
            <RefreshCw size={12} /> Refresh
          </button>
          <button onClick={onNewRequest} className={cssClass({ background: BRAND, color: "#fff", border: "none",
            borderRadius: 4, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" })}>
            + New Request
          </button>
        </div>
      </div>

      <div className={cssClass({ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" })}>
        {["all", "Open", "Forwarded", "In Progress", "Reopened", "Resolved", "Closed", "Rejected"].map((f) =>
        <button key={f} onClick={() => setFilter(f)} className={cssClass(
          { padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
            border: filter === f ? "1.5px solid " + BRAND : "1px solid #e5e7eb",
            background: filter === f ? BRAND_LIGHT : "#fff",
            color: filter === f ? BRAND : "#6b7280", cursor: "pointer" })}>
            {f === "all" ? "All" : f}
          </button>
        )}
      </div>

      <div className={cssClass({ flex: 1, border: "1px solid #e5e7eb", borderRadius: 6, overflow: "auto" })}>
        {loading ?
        <div className={cssClass({ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13 })}>Loading tickets…</div> :
        visible.length === 0 ?
        <div className={cssClass({ padding: 60, textAlign: "center" })}>
            <Headphones size={36} color="#e5e7eb" strokeWidth={1.2} />
            <p className={cssClass({ fontSize: 13, color: "#9ca3af", marginTop: 12 })}>No tickets found.</p>
            <button onClick={onNewRequest} className={cssClass({ marginTop: 8, background: BRAND, color: "#fff",
            border: "none", borderRadius: 4, padding: "8px 20px", fontSize: 12, fontWeight: 600, cursor: "pointer" })}>
              Raise a Request
            </button>
          </div> :

        <ul className={cssClass({ margin: 0, padding: 0, listStyle: "none" })}>
            {pagedTickets.map((t, i) => {
            const sc = STATUS_STYLE[t.status] || STATUS_STYLE["Open"];
            const isResolved = t.status === "Resolved";
            const isReopened = t.status === "Reopened";
            const isClosing = closing === t.ticket_id;

            return (
              <li key={t.ticket_id}
              onClick={() => setViewTicket(t.ticket_id)}






              onMouseEnter={(e) => {if (!isResolved && !isReopened) e.currentTarget.style.background = "#f9fafb";}}
              onMouseLeave={(e) => {if (!isResolved && !isReopened) e.currentTarget.style.background = "transparent";}} className={cssClass({ padding: "14px 18px", cursor: "pointer", borderBottom: i < visible.length - 1 ? "1px solid #f3f4f6" : "none", background: isResolved ? "#f0fdf4" : isReopened ? "#fff1f2" : "transparent", borderLeft: isResolved ? "3px solid #15803d" : isReopened ? "3px solid #be123c" : "3px solid transparent" })}>
                  <div className={cssClass({ display: "flex", alignItems: "flex-start", gap: 12 })}>
                    <div className={cssClass({ flex: 1, minWidth: 0 })}>
                      <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 })}>
                        <span className={cssClass({ fontSize: 13, fontWeight: 600, color: "#111827" })}>{t.subject}</span>
                        {t.category &&
                      <span className={cssClass({ fontSize: 11, background: "#f3f4f6", color: "#6b7280",
                        padding: "1px 8px", borderRadius: 20 })}>{t.category}</span>
                      }
                      </div>
                      {t.description &&
                    <p className={cssClass({ fontSize: 12, color: "#6b7280", margin: "0 0 4px",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>
                          {t.description}
                        </p>
                    }
                      <div className={cssClass({ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" })}>
                        <span className={cssClass({ fontSize: 11, color: "#9ca3af" })}>{fmtDate(t.created_at)}</span>
                        {t.forwarded_to_team &&
                      <span className={cssClass({ fontSize: 11, color: "#7c3aed", fontWeight: 500 })}>
                            → {t.forwarded_to_team}
                          </span>
                      }
                        {isResolved &&
                      <span className={cssClass({ fontSize: 12, color: "#15803d", fontWeight: 600 })}>
                            ✓ Issue resolved — click to view details and confirm
                          </span>
                      }
                        {isReopened &&
                      <span className={cssClass({ fontSize: 12, color: "#be123c", fontWeight: 600 })}>
                            ↩ Reopened — team is working on it again
                          </span>
                      }
                      </div>
                    </div>

                    <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" })}>
                      <span className={cssClass({ fontSize: 11, fontWeight: 600, padding: "3px 10px",
                      borderRadius: 20, background: sc.bg, color: sc.color })}>
                        {t.status}
                      </span>

                      {isResolved &&
                    <>
                          <button onClick={(e) => {e.stopPropagation();handleClose(t.ticket_id);}} disabled={isClosing} className={cssClass(
                        { display: "flex", alignItems: "center", gap: 5,
                          padding: "5px 11px", borderRadius: 6, border: "none",
                          background: "#15803d", color: "#fff",
                          fontSize: 12, fontWeight: 700,
                          cursor: isClosing ? "not-allowed" : "pointer",
                          opacity: isClosing ? 0.7 : 1 })}>
                            <CheckCircle size={13} />
                            {isClosing ? "Closing…" : "Accept & Close"}
                          </button>
                          <button onClick={(e) => {e.stopPropagation();setReopenFor(t);}} className={cssClass(
                        { display: "flex", alignItems: "center", gap: 5,
                          padding: "5px 11px", borderRadius: 6,
                          border: "1.5px solid #be123c", background: "#fff",
                          color: "#be123c", fontSize: 12, fontWeight: 700, cursor: "pointer" })}>
                            Not Satisfied
                          </button>
                        </>
                    }
                    </div>
                  </div>
                </li>);

          })}
          </ul>
        }
        <Pagination page={tkPage} setPage={setTkPage} totalPages={tkTotalPages} from={tkFrom} to={tkTo} total={tkTotal} pageSize={tkPageSize} setPageSize={setTkPageSize} />
      </div>

      {reopenFor &&
      <ReopenModal
        ticket={reopenFor}
        onClose={() => setReopenFor(null)}
        onReopened={() => {setReopenFor(null);load();}} />

      }

      {viewTicket &&
      <TicketDetailModal
        ticketId={viewTicket}
        onClose={() => setViewTicket(null)}
        onAction={(action, ticket) => {
          setViewTicket(null);
          if (action === "close") handleClose(ticket.ticket_id);
          if (action === "reopen") setReopenFor(ticket);
        }} />

      }
    </div>);

}

/* ── MAIN ──────────────────────────────────────────────────────────────── */
export default function Helpdesk() {
  const [view, setView] = useState("home");
  const [category, setCategory] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSelectCategory = (cat) => {
    if (!cat) {setView("home");setCategory(null);return;}
    setCategory(cat);setView("category");
  };

  const isRequestView = view === "home" || view === "category";

  return (
    <div className={cssClass({ height: "calc(100vh - 4.25rem)", background: "#f3f4f6",
      display: "flex", flexDirection: "column", overflow: "hidden" })}>

      {/* Tab strip */}
      <div className={cssClass({ display: "flex", background: "#fff", borderBottom: "1px solid #e5e7eb",
        flexShrink: 0, padding: "0 28px" })}>
        {[
        { id: "request", label: "Raise a Request", active: isRequestView },
        { id: "tickets", label: "My Tickets", active: view === "tickets" }].
        map((tab) =>
        <button key={tab.id}
        onClick={() => {
          if (tab.id === "tickets") {setView("tickets");setShowSuccess(false);} else
          {setView("home");setCategory(null);setShowSuccess(false);}
        }} className={cssClass(
          { padding: "12px 20px", border: "none", background: "none",
            fontSize: 13, fontWeight: tab.active ? 700 : 500, cursor: "pointer",
            color: tab.active ? BRAND : "#6b7280",
            borderBottom: tab.active ? "2.5px solid " + BRAND : "2.5px solid transparent",
            marginBottom: -1 })}>
            {tab.label}
          </button>
        )}
      </div>

      {/* Content card */}
      <div className={cssClass({ flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
        margin: "16px 20px 12px", border: "1px solid #e5e7eb", borderRadius: 8,
        overflow: "hidden", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        position: "relative" })}>

        {showSuccess &&
        <div className={cssClass({ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: "16px 24px",
          display: "flex", alignItems: "center", gap: 12, zIndex: 2000, minWidth: 320 })}>
            <CheckCircle size={22} color="#22c55e" />
            <div className={cssClass({ flex: 1 })}>
              <p className={cssClass({ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 })}>Request submitted!</p>
              <p className={cssClass({ fontSize: 12, color: "#6b7280", margin: "2px 0 0" })}>
                Your request is visible to admin &amp; your manager.
              </p>
            </div>
            <button onClick={() => setShowSuccess(false)} className={cssClass(
            { background: "none", border: "none", color: "#9ca3af",
              cursor: "pointer", fontSize: 16, padding: 2 })}>✕</button>
          </div>
        }

        {view === "home" && <HomeView onSelectCategory={handleSelectCategory} />}
        {view === "category" && category &&
        <CategoryView category={category} allCategories={CATEGORIES}
        onSelectCategory={handleSelectCategory}
        onSubmitted={() => setShowSuccess(true)} />
        }
        {view === "tickets" &&
        <MyTicketsView onNewRequest={() => {setView("home");setCategory(null);setShowSuccess(false);}} />
        }
      </div>
    </div>);

}

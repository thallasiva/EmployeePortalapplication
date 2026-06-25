import React, { useState, useEffect, useCallback } from "react";
import {
  Search, ChevronRight, Calendar, Clock, FileText, BookOpen,
  Lock, Monitor, Download, AlertCircle, DollarSign, Receipt,
  CreditCard, FileCheck, File, UserPlus, MessageSquare, HelpCircle,
  ArrowLeft, Paperclip, Send, CheckCircle, Headphones, RefreshCw,
  ChevronDown,
} from "lucide-react";
import { createTicket, myTickets } from "../../../api/helpdesk.api";
import { getStoredUser } from "../../../data/auth";

/* ── Categories & Topics ─────────────────────────────────────────── */
const CATEGORIES = [
  {
    id: "hr",
    label: "HR & People",
    description: "Leave, attendance, payslips, policy",
    topics: [
      { id: "leave",       icon: Calendar,     label: "Leave Query",          desc: "Questions or issues related to your leave balance, approvals, or types." },
      { id: "attendance",  icon: Clock,        label: "Attendance Correction",desc: "Report a missed punch, regularization request, or shift mismatch." },
      { id: "payslip",     icon: FileText,     label: "Payslip Issue",        desc: "Missing payslip, incorrect deductions, or salary amount queries." },
      { id: "policy",      icon: BookOpen,     label: "Policy Clarification", desc: "Get clarity on HR policies, guidelines, or company rules." },
    ],
  },
  {
    id: "it",
    label: "IT & Systems",
    description: "Login, hardware, software, access",
    topics: [
      { id: "login",    icon: Lock,         label: "Login / Access Issue",  desc: "Can't log in, forgot password, or need system access." },
      { id: "hardware", icon: Monitor,      label: "Hardware Request",       desc: "Request a new laptop, mouse, keyboard, or other hardware." },
      { id: "software", icon: Download,     label: "Software Request",       desc: "Need a software license or a new tool installed." },
      { id: "system",   icon: AlertCircle,  label: "System Problem",         desc: "Application crash, network issue, or other technical problem." },
    ],
  },
  {
    id: "payroll",
    label: "Payroll & Finance",
    description: "Salary, reimbursements, loans, tax",
    topics: [
      { id: "salary",  icon: DollarSign, label: "Salary Discrepancy",  desc: "Incorrect salary credited, missing components, or arrears." },
      { id: "reimb",   icon: Receipt,    label: "Reimbursement",        desc: "Raise or follow up on expense reimbursement claims." },
      { id: "loan",    icon: CreditCard, label: "Loan & Advance",       desc: "Apply for or enquire about salary loans or advances." },
      { id: "tax",     icon: FileCheck,  label: "Tax / IT Declaration", desc: "Help with income tax declarations, proof of investment, or Form 16." },
    ],
  },
  {
    id: "general",
    label: "General",
    description: "Documents, onboarding, feedback, other",
    topics: [
      { id: "docs",       icon: File,           label: "Document Request",  desc: "Request experience letter, offer letter, or other official documents." },
      { id: "onboarding", icon: UserPlus,       label: "Onboarding Help",   desc: "Need help completing onboarding tasks or getting started." },
      { id: "feedback",   icon: MessageSquare,  label: "Feedback",          desc: "Share feedback about processes, tools, or work environment." },
      { id: "other",      icon: HelpCircle,     label: "Other",             desc: "Anything else not covered by the above categories." },
    ],
  },
];

const PRIORITY_OPTS = ["Low", "Medium", "High", "Urgent"];
const STATUS_COLOR  = {
  Open:        { bg: "#eff6ff", color: "#2563eb", dot: "#3b82f6" },
  "In Progress":{ bg: "#fff7ed", color: "#c2410c", dot: "#f18200" },
  Resolved:    { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  Closed:      { bg: "#f8fafc", color: "#64748b", dot: "#94a3b8" },
};

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}

/* ── Home View ───────────────────────────────────────────────────── */
function HomeView({ onSelectCategory }) {
  const [search, setSearch] = useState("");
  const filtered = search.trim()
    ? CATEGORIES.map(c => ({
        ...c,
        topics: c.topics.filter(t =>
          t.label.toLowerCase().includes(search.toLowerCase()) ||
          t.desc.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(c => c.topics.length > 0)
    : CATEGORIES;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Hero Banner */}
      <div style={{
        background: "linear-gradient(135deg, #f18200 0%, #d97200 100%)",
        padding: "32px 24px 40px", borderRadius: 12, marginBottom: 24, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120,
          borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", bottom: -30, right: 60, width: 80, height: 80,
          borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Headphones size={22} color="#fff" strokeWidth={2} />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>Welcome to the HR Help Desk</h1>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: "0 0 20px" }}>
          Raise a support request and we'll get back to you quickly.
        </p>
        {/* Search */}
        <div style={{ position: "relative", maxWidth: 480 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search for help topics…"
            style={{
              width: "100%", height: 40, paddingLeft: 36, paddingRight: 12,
              border: "none", borderRadius: 8, fontSize: 13,
              outline: "none", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Welcome note */}
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
        You can raise a request using the options provided.
      </p>

      <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase",
        letterSpacing: "0.05em", marginBottom: 12 }}>Contact us about</p>

      {/* Category Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
        {filtered.map(cat => (
          <div key={cat.id}
            onClick={() => onSelectCategory(cat)}
            style={{
              background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
              padding: "16px 18px", cursor: "pointer", display: "flex",
              alignItems: "flex-start", gap: 12, transition: "box-shadow 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#f18200"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(241,130,0,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#f18200", margin: "0 0 4px" }}>{cat.label}</p>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                {cat.topics.map(t => t.label).join(", ")}
              </p>
            </div>
            <ChevronRight size={16} color="#94a3b8" style={{ flexShrink: 0, marginTop: 2 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Category View ───────────────────────────────────────────────── */
function CategoryView({ category, allCategories, onSelectCategory, onSelectTopic }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12,
        color: "#f18200", marginBottom: 16 }}>
        <span style={{ cursor: "pointer" }} onClick={() => onSelectCategory(null)}>HR Help Desk</span>
        <span style={{ color: "#94a3b8" }}>/</span>
        <span style={{ color: "#64748b" }}>{category.label}</span>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>{category.label}</h2>
      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px" }}>
        You can raise a request using the options provided.
      </p>

      {/* Category Dropdown */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Contact us about</label>
        <div style={{ position: "relative" }}>
          <select
            value={category.id}
            onChange={e => onSelectCategory(allCategories.find(c => c.id === e.target.value))}
            style={{
              width: "100%", height: 40, paddingLeft: 12, paddingRight: 32,
              border: "1px solid #dbe2ea", borderRadius: 8, fontSize: 13,
              background: "#fff", outline: "none", cursor: "pointer", appearance: "none",
            }}
          >
            {allCategories.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%",
            transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
        </div>
      </div>

      <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: "0 0 12px" }}>
        What can we help you with?
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {category.topics.map(topic => {
          const Icon = topic.icon;
          return (
            <div key={topic.id}
              onClick={() => onSelectTopic(topic)}
              style={{
                background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8,
                padding: "14px 16px", cursor: "pointer", display: "flex",
                alignItems: "flex-start", gap: 12, transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fff7ed"; e.currentTarget.style.borderColor = "#fed7aa"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fff",
                border: "1px solid #e2e8f0", display: "flex", alignItems: "center",
                justifyContent: "center", flexShrink: 0 }}>
                <Icon size={16} color="#f18200" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#f18200", margin: "0 0 3px" }}>{topic.label}</p>
                <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{topic.desc}</p>
              </div>
              <ChevronRight size={14} color="#94a3b8" style={{ flexShrink: 0, marginTop: 6 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Form View ───────────────────────────────────────────────────── */
function FormView({ category, topic, allCategories, onSelectCategory, onSelectTopic, onBack, onSubmitted }) {
  const [summary,  setSummary]  = useState("");
  const [desc,     setDesc]     = useState("");
  const [priority, setPriority] = useState("Medium");
  const [file,     setFile]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const Icon = topic.icon;

  const handleSubmit = async () => {
    if (!summary.trim()) { setError("Summary is required."); return; }
    setSubmitting(true);
    setError(null);
    try {
      await createTicket({
        category: category.label,
        subject:  `[${topic.label}] ${summary.trim()}`,
        description: desc.trim() || null,
        priority,
      });
      onSubmitted();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12,
        color: "#f18200", marginBottom: 16 }}>
        <span style={{ cursor: "pointer" }} onClick={() => onSelectCategory(null)}>HR Help Desk</span>
        <span style={{ color: "#94a3b8" }}>/</span>
        <span style={{ cursor: "pointer" }} onClick={() => onSelectTopic(null)}>{category.label}</span>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>{category.label}</h2>
      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px" }}>
        You can raise a request using the options provided.
      </p>

      {/* Category Dropdown */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 6 }}>Contact us about</label>
        <div style={{ position: "relative" }}>
          <select
            value={category.id}
            onChange={e => { onSelectCategory(allCategories.find(c => c.id === e.target.value)); }}
            style={{
              width: "100%", height: 40, paddingLeft: 12, paddingRight: 32,
              border: "1px solid #dbe2ea", borderRadius: 8, fontSize: 13,
              background: "#fff", outline: "none", cursor: "pointer", appearance: "none",
            }}
          >
            {allCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%",
            transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
        </div>
      </div>

      {/* Selected Topic */}
      <div style={{ background: "#fff7ed", border: "1.5px solid #fed7aa", borderRadius: 8,
        padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fff",
          border: "1px solid #fed7aa", display: "flex", alignItems: "center",
          justifyContent: "center", flexShrink: 0 }}>
          <Icon size={16} color="#f18200" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#f18200", margin: "0 0 2px" }}>{topic.label}</p>
          <p style={{ fontSize: 12, color: "#92400e", margin: 0 }}>{topic.desc}</p>
        </div>
        <ChevronDown size={14} color="#f18200" style={{ marginTop: 6 }} />
      </div>

      <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 16px" }}>
        Required fields are marked with an asterisk *
      </p>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Summary */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
          Summary <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <input
          value={summary}
          onChange={e => setSummary(e.target.value)}
          placeholder={`e.g. ${topic.label} for ${getStoredUser()?.name || "me"}`}
          style={{
            width: "100%", height: 40, padding: "0 12px", border: "1px solid #dbe2ea",
            borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box",
          }}
          onFocus={e => e.target.style.borderColor = "#f18200"}
          onBlur={e => e.target.style.borderColor = "#dbe2ea"}
        />
      </div>

      {/* Priority */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Priority</label>
        <div style={{ display: "flex", gap: 8 }}>
          {PRIORITY_OPTS.map(p => (
            <button key={p} type="button"
              onClick={() => setPriority(p)}
              style={{
                padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer",
                border: priority === p ? "1.5px solid #f18200" : "1px solid #e2e8f0",
                background: priority === p ? "#fff7ed" : "#fff",
                color: priority === p ? "#f18200" : "#64748b",
              }}>{p}</button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Description</label>
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Describe your issue in detail…"
          rows={4}
          style={{
            width: "100%", padding: "10px 12px", border: "1px solid #dbe2ea",
            borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical",
            fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.5,
          }}
          onFocus={e => e.target.style.borderColor = "#f18200"}
          onBlur={e => e.target.style.borderColor = "#dbe2ea"}
        />
      </div>

      {/* Attachment */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Attachment</label>
        <label style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          border: "1.5px dashed #dbe2ea", borderRadius: 8, padding: "20px", cursor: "pointer",
          background: "#f8fafc", gap: 6,
        }}>
          <Paperclip size={18} color="#94a3b8" />
          {file ? (
            <span style={{ fontSize: 12, color: "#f18200", fontWeight: 500 }}>{file.name}</span>
          ) : (
            <>
              <span style={{ fontSize: 12, color: "#f18200" }}>Drag and drop files, paste screenshots, or browse</span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Max 10 MB</span>
            </>
          )}
          <input type="file" hidden onChange={e => setFile(e.target.files[0] || null)} />
        </label>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            background: submitting ? "#fed7aa" : "#f18200", color: "#fff", border: "none",
            borderRadius: 8, padding: "9px 24px", fontSize: 13, fontWeight: 600,
            cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>
          <Send size={14} /> {submitting ? "Sending…" : "Send"}
        </button>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "#fff", color: "#64748b", border: "1px solid #e2e8f0",
            borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Success View ────────────────────────────────────────────────── */
function SuccessView({ onNewRequest, onViewTickets }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 16, padding: 40 }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CheckCircle size={32} color="#22c55e" />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>Request Submitted!</h2>
      <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", maxWidth: 360, margin: 0 }}>
        Your request has been raised. Our HR/IT team and your manager will be notified and will respond shortly.
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={onViewTickets}
          style={{ background: "#f18200", color: "#fff", border: "none", borderRadius: 8,
            padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          View My Tickets
        </button>
        <button onClick={onNewRequest}
          style={{ background: "#fff", color: "#64748b", border: "1px solid #e2e8f0",
            borderRadius: 8, padding: "9px 20px", fontSize: 13, cursor: "pointer" }}>
          Raise Another
        </button>
      </div>
    </div>
  );
}

/* ── My Tickets View ─────────────────────────────────────────────── */
function MyTicketsView({ onNewRequest }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await myTickets({ limit: 50 });
      setTickets(Array.isArray(data) ? data : (data?.rows || []));
    } catch { setTickets([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = filter === "all"
    ? tickets
    : tickets.filter(t => t.status?.toLowerCase().replace(" ", "_") === filter);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", margin: 0 }}>My Tickets</h2>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Track your submitted requests</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load}
            style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
              padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              fontSize: 12, color: "#64748b" }}>
            <RefreshCw size={12} /> Refresh
          </button>
          <button onClick={onNewRequest}
            style={{ background: "#f18200", color: "#fff", border: "none", borderRadius: 8,
              padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            + New Request
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", "open", "in_progress", "resolved", "closed"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500,
              border: filter === f ? "1.5px solid #f18200" : "1px solid #e2e8f0",
              background: filter === f ? "#fff7ed" : "#fff",
              color: filter === f ? "#f18200" : "#64748b", cursor: "pointer",
            }}>
            {f === "all" ? "All" : f.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      <div style={{ flex: 1, background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: 10, overflow: "auto", minHeight: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading tickets…</div>
        ) : visible.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <Headphones size={36} color="#e2e8f0" strokeWidth={1.2} />
            <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 12 }}>No tickets found.</p>
            <button onClick={onNewRequest}
              style={{ marginTop: 8, background: "#f18200", color: "#fff", border: "none",
                borderRadius: 8, padding: "8px 20px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Raise a Request
            </button>
          </div>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {visible.map((t, i) => {
              const s = STATUS_COLOR[t.status] || STATUS_COLOR["Open"];
              return (
                <li key={t.ticket_id} style={{
                  padding: "14px 18px", borderBottom: i < visible.length - 1 ? "1px solid #f1f5f9" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontSize: 8, width: 8, height: 8, borderRadius: "50%",
                          background: s.dot, display: "inline-block", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{t.subject}</span>
                        <span style={{ fontSize: 11, background: "#f1f5f9", color: "#64748b",
                          padding: "1px 7px", borderRadius: 20 }}>{t.category}</span>
                      </div>
                      {t.description && (
                        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 6px",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.description}
                        </p>
                      )}
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{fmtDate(t.created_at)}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px",
                      borderRadius: 20, background: s.bg, color: s.color, flexShrink: 0 }}>
                      {t.status}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────── */
export default function Helpdesk() {
  // view: "home" | "category" | "form" | "success" | "tickets"
  const [view,     setView]     = useState("home");
  const [category, setCategory] = useState(null);
  const [topic,    setTopic]    = useState(null);

  const handleSelectCategory = (cat) => {
    if (!cat) { setView("home"); setCategory(null); setTopic(null); return; }
    setCategory(cat);
    setView("category");
    setTopic(null);
  };

  const handleSelectTopic = (t) => {
    if (!t) { setView("category"); setTopic(null); return; }
    setTopic(t);
    setView("form");
  };

  return (
    <div style={{
      height: "calc(100vh - 4.25rem)", background: "#f5f7fb",
      display: "flex", flexDirection: "column", padding: "16px 20px 12px", overflow: "hidden",
    }}>
      {/* Tab bar — always visible */}
      <div style={{ display: "flex", alignItems: "center", gap: 4,
        marginBottom: 16, flexShrink: 0 }}>
        <button
          onClick={() => { setView("home"); setCategory(null); setTopic(null); }}
          style={{
            padding: "6px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
            border: "none", cursor: "pointer",
            background: (view === "home" || view === "category" || view === "form" || view === "success")
              ? "#f18200" : "#fff",
            color: (view === "home" || view === "category" || view === "form" || view === "success")
              ? "#fff" : "#64748b",
          }}>
          Raise a Request
        </button>
        <button
          onClick={() => setView("tickets")}
          style={{
            padding: "6px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500,
            border: "none", cursor: "pointer",
            background: view === "tickets" ? "#f18200" : "#fff",
            color: view === "tickets" ? "#fff" : "#64748b",
          }}>
          My Tickets
        </button>
        {view !== "home" && view !== "tickets" && (
          <button
            onClick={() => {
              if (view === "form") handleSelectTopic(null);
              else if (view === "category") handleSelectCategory(null);
              else setView("home");
            }}
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4,
              background: "none", border: "none", color: "#64748b", fontSize: 12,
              cursor: "pointer", padding: "6px 8px" }}>
            <ArrowLeft size={13} /> Back
          </button>
        )}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
        background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
        padding: 24, overflow: "auto" }}>
        {view === "home" && (
          <HomeView onSelectCategory={handleSelectCategory} />
        )}
        {view === "category" && category && (
          <CategoryView
            category={category}
            allCategories={CATEGORIES}
            onSelectCategory={handleSelectCategory}
            onSelectTopic={handleSelectTopic}
          />
        )}
        {view === "form" && category && topic && (
          <FormView
            category={category}
            topic={topic}
            allCategories={CATEGORIES}
            onSelectCategory={handleSelectCategory}
            onSelectTopic={handleSelectTopic}
            onBack={() => handleSelectTopic(null)}
            onSubmitted={() => setView("success")}
          />
        )}
        {view === "success" && (
          <SuccessView
            onNewRequest={() => { setView("home"); setCategory(null); setTopic(null); }}
            onViewTickets={() => setView("tickets")}
          />
        )}
        {view === "tickets" && (
          <MyTicketsView onNewRequest={() => { setView("home"); setCategory(null); setTopic(null); }} />
        )}
      </div>
    </div>
  );
}

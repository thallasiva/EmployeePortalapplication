import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Award, Check, Download, Loader2, MessageSquare, Search, Send, X, ArrowRight } from "lucide-react";
import { getUserInitials } from "../../../lib/dateUtils";
import { getErrorMessage } from "../../../api/client";
import { listDepartments } from "../../../api/department.api";
import {
  getKfReport,
  giveFeedback,
  giveKudos,
  listKfCategories,
  listKfEmployees,
  requestFeedback } from
"../../../api/kudosFeedback.api";
export const BRAND = "#f18200";
export const FEEDBACK_TYPES = ["Positive", "Constructive", "Developmental"];
export const TYPE_STYLE = {
  Positive: { badge: "bg-emerald-50 text-emerald-700", bar: "#16a34a" },
  Constructive: { badge: "bg-orange-50 text-orange-700", bar: "#f18200" },
  Developmental: { badge: "bg-blue-50 text-blue-700", bar: "#1d4ed8" }
};
export function timeAgo(value) {
  if (!value) return "";
  const date = new Date(String(value).replace(" ", "T"));
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 86400 * 7) {
    const d = Math.floor(diff / 86400);
    return `${d} day${d > 1 ? "s" : ""} ago`;
  }
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
export const Avatar = ({ name, size = 40, tone = "orange" }) => {
  const tones = {
    orange: "bg-[#fff4e6] text-[#b45309]",
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-700"
  };
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold shrink-0 ${tones[tone]}`}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
      aria-hidden="true">
      {name === "Anonymous" ? "?" : getUserInitials(name)}
    </div>);
};
export const StatCard = ({ icon, label, value, hint, accent = "bg-orange-50" }) =>
<div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent}`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="text-3xl font-black text-slate-900 mt-0.5">{value ?? "–"}</p>
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
  </div>;
export const Tabs = ({ tabs, active, onChange, label }) =>
<div role="tablist" aria-label={label} className="flex gap-1 border-b border-slate-200 overflow-x-auto">
    {tabs.map((t) =>
  <button
    key={t.key}
    role="tab"
    aria-selected={active === t.key}
    onClick={() => onChange(t.key)}
    className={`h-11 px-4 text-sm whitespace-nowrap border-b-[3px] -mb-px transition-colors ${
    active === t.key ? "border-[#f18200] text-[#b45309] font-bold" : "border-transparent text-slate-500 font-semibold hover:text-slate-800"}`
    }>
        {t.label}
        {t.count != null && t.count > 0 &&
    <span className="ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[#f18200] text-white">{t.count}</span>
    }
      </button>
  )}
  </div>;
export const EmptyState = ({ icon, title, text, action }) =>
<div className="flex flex-col items-center text-center py-12 px-4">
    <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-3">{icon}</div>
    <p className="text-sm font-bold text-slate-800">{title}</p>
    {text && <p className="text-sm text-slate-500 mt-1 max-w-sm">{text}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>;
export const Loading = () =>
<div className="flex items-center justify-center py-12 text-slate-400" role="status">
    <Loader2 className="animate-spin" size={22} />
    <span className="sr-only">Loading</span>
  </div>;
export const PrimaryButton = ({ children, className = "", ...props }) =>
<button
  {...props}
  className={`h-10 px-4 rounded-xl bg-[#f18200] hover:bg-[#e07000] disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors ${className}`}>
    {children}
  </button>;
export const SecondaryButton = ({ children, className = "", ...props }) =>
<button
  {...props}
  className={`h-10 px-4 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors ${className}`}>
    {children}
  </button>;
export const CategoryBadge = ({ name, color }) =>
name ?
<span
  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
  style={{ background: `${color || BRAND}1a`, color: color || BRAND }}>
      {name}
    </span> :
null;
/* ---------- Modal shell ---------- */
const Modal = ({ title, icon, onClose, children, width = "max-w-lg" }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-white rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] flex flex-col`}
        onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">{icon}{title}</h2>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pb-6 overflow-y-auto">{children}</div>
      </div>
    </div>);
};
const Label = ({ children, htmlFor }) =>
<label htmlFor={htmlFor} className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">{children}</label>;
/* ---------- People picker ---------- */
export const EmployeePicker = ({ multiple = false, value, onChange, teamOnly = false, max = 25, preset = [] }) => {
  const [search, setSearch] = useState("");
  const [people, setPeople] = useState([]);
  const [known, setKnown] = useState(() => Object.fromEntries(preset.map((p) => [p.employee_id, p])));
  const [loading, setLoading] = useState(false);
  const selected = multiple ? value : value ? [value] : [];
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const t = setTimeout(() => {
      listKfEmployees({ search: search || undefined, team: teamOnly ? 1 : undefined }).
      then((rows) => {
        if (!alive) return;
        setPeople(rows || []);
        setKnown((k) => ({ ...k, ...Object.fromEntries((rows || []).map((p) => [p.employee_id, p])) }));
      }).
      catch(() => alive && setPeople([])).
      finally(() => alive && setLoading(false));
    }, 250);
    return () => {alive = false;clearTimeout(t);};
  }, [search, teamOnly]);
  const toggle = (id) => {
    if (!multiple) return onChange(selected[0] === id ? null : id);
    if (selected.includes(id)) return onChange(selected.filter((x) => x !== id));
    if (selected.length >= max) return toast.info(`You can select up to ${max} people`);
    onChange([...selected, id]);
  };
  return (
    <div className="space-y-2">
      {selected.length > 0 &&
      <div className="flex flex-wrap gap-1.5">
          {selected.map((id) =>
        <span key={id} className="flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-orange-50 text-[#b45309] text-xs font-semibold">
              {known[id]?.name || `#${id}`}
              <button type="button" aria-label={`Remove ${known[id]?.name || id}`} onClick={() => toggle(id)} className="w-5 h-5 rounded-full hover:bg-orange-100 flex items-center justify-center">
                <X size={12} />
              </button>
            </span>
        )}
        </div>
      }
      <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 h-10 focus-within:border-[#f18200]">
        <Search size={15} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={teamOnly ? "Search your team" : "Search by name, code or email"}
          aria-label="Search employees"
          className="flex-1 text-sm outline-none bg-transparent" />
        {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
      </div>
      <ul className="border border-slate-100 rounded-xl max-h-52 overflow-y-auto divide-y divide-slate-50" aria-label="Employees">
        {!loading && people.length === 0 &&
        <li className="px-3 py-4 text-sm text-slate-500 text-center">No employees found</li>
        }
        {people.map((p) => {
          const on = selected.includes(p.employee_id);
          return (
            <li key={p.employee_id}>
              <button
                type="button"
                onClick={() => toggle(p.employee_id)}
                aria-pressed={on}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 ${on ? "bg-orange-50/60" : ""}`}>
                <Avatar name={p.name} size={32} tone={on ? "orange" : "slate"} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-slate-800 truncate">{p.name}</span>
                  <span className="block text-xs text-slate-500 truncate">
                    {[p.designation, p.department_name].filter(Boolean).join(" · ") || p.emp_code}
                    {p.is_direct_report ? " · Your team" : ""}
                  </span>
                </span>
                {on && <Check size={16} className="text-[#f18200]" />}
              </button>
            </li>);
        })}
      </ul>
    </div>);
};
/* ---------- Give Kudos ---------- */
export const GiveKudosModal = ({ onClose, onSent, teamOnly = false, preset = [] }) => {
  const [to, setTo] = useState(preset.map((p) => p.employee_id));
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    listKfCategories({ type: "kudos" }).then((rows) => {
      setCategories(rows || []);
      if (rows?.length) setCategoryId(rows[0].category_id);
    }).catch(() => {});
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    if (!to.length) return toast.error("Select at least one person");
    if (message.trim().length < 5) return toast.error("Write a short message (at least 5 characters)");
    setSaving(true);
    try {
      const res = await giveKudos({ to_employee_ids: to, category_id: categoryId, message: message.trim(), is_public: isPublic });
      toast.success(res?.message || "Kudos sent");
      onSent?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not send kudos"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title="Give Kudos" icon={<Award size={20} className="text-amber-500" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>To {teamOnly ? "(your team)" : ""}</Label>
          <EmployeePicker multiple value={to} onChange={setTo} teamOnly={teamOnly} preset={preset} />
        </div>
        <fieldset>
          <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Category</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) =>
            <button
              type="button"
              key={c.category_id}
              aria-pressed={categoryId === c.category_id}
              onClick={() => setCategoryId(c.category_id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              categoryId === c.category_id ? "bg-[#f18200] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`
              }
              title={c.description || undefined}>
                {c.category_name}
              </button>
            )}
          </div>
        </fieldset>
        <div>
          <Label htmlFor="kudos-message">Message</Label>
          <textarea
            id="kudos-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="What did they do that you appreciated?"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#f18200] resize-none" />
          <p className="text-[11px] text-slate-400 text-right">{message.length}/1000</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-4 h-4 accent-[#f18200]" />
          Show on the Kudos Wall for everyone
        </label>
        <div className="flex gap-2 pt-1">
          <SecondaryButton type="button" onClick={onClose} className="flex-1">Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={saving} className="flex-1">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {to.length > 1 ? `Send Kudos to ${to.length}` : "Send Kudos"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>);
};
/* ---------- Give Feedback ---------- */
export const GiveFeedbackModal = ({ onClose, onSent, request = null, presetEmployee = null, teamOnly = false }) => {
  const lockedTo = request ? request.requester_employee_id : presetEmployee?.employee_id;
  const [to, setTo] = useState(lockedTo || null);
  const [type, setType] = useState("Positive");
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    listKfCategories({ type: "feedback" }).then((rows) => setCategories(rows || [])).catch(() => {});
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    if (!to) return toast.error("Select who the feedback is for");
    if (message.trim().length < 5) return toast.error("Write your feedback (at least 5 characters)");
    setSaving(true);
    try {
      await giveFeedback({
        to_employee_id: to,
        feedback_type: type,
        category_id: categoryId,
        message: message.trim(),
        is_anonymous: anonymous,
        request_id: request?.request_id || null
      });
      toast.success("Feedback sent");
      onSent?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not send feedback"));
    } finally {
      setSaving(false);
    }
  };
  const lockedName = request?.requester_name || presetEmployee?.name;
  return (
    <Modal title={request ? "Respond to feedback request" : "Give Feedback"} icon={<MessageSquare size={20} className="text-[#f18200]" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {lockedTo ?
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <Avatar name={lockedName} size={36} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">{lockedName}</p>
              {request && <p className="text-xs text-slate-500 truncate">Asked about: {request.topic}</p>}
            </div>
          </div> :
        <div>
            <Label>For</Label>
            <EmployeePicker value={to} onChange={setTo} teamOnly={teamOnly} />
          </div>
        }
        {request?.message && <p className="text-sm text-slate-600 bg-orange-50/50 rounded-xl p-3">“{request.message}”</p>}
        <fieldset>
          <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Type</legend>
          <div className="grid grid-cols-3 gap-2">
            {FEEDBACK_TYPES.map((t) =>
            <button
              type="button"
              key={t}
              aria-pressed={type === t}
              onClick={() => setType(t)}
              className={`h-10 rounded-xl text-xs font-bold border transition-all ${
              type === t ? "border-[#f18200] bg-orange-50 text-[#b45309]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`
              }>
                {t}
              </button>
            )}
          </div>
        </fieldset>
        {categories.length > 0 &&
        <div>
            <Label htmlFor="fb-category">Area (optional)</Label>
            <select
            id="fb-category"
            value={categoryId || ""}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
            className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm outline-none focus:border-[#f18200] bg-white">
              <option value="">General</option>
              {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
            </select>
          </div>
        }
        <div>
          <Label htmlFor="fb-message">Feedback</Label>
          <textarea
            id="fb-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Be specific: what happened, the impact, and what to keep or change."
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#f18200] resize-none" />
          <p className="text-[11px] text-slate-400 text-right">{message.length}/2000</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="w-4 h-4 accent-[#f18200]" />
          Send anonymously (your name is hidden from the receiver)
        </label>
        <div className="flex gap-2 pt-1">
          <SecondaryButton type="button" onClick={onClose} className="flex-1">Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={saving} className="flex-1">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send Feedback
          </PrimaryButton>
        </div>
      </form>
    </Modal>);
};
/* ---------- Request Feedback ---------- */
export const RequestFeedbackModal = ({ onClose, onSent }) => {
  const [reviewers, setReviewers] = useState([]);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!reviewers.length) return toast.error("Select at least one person");
    if (topic.trim().length < 3) return toast.error("Add a topic");
    setSaving(true);
    try {
      const res = await requestFeedback({ reviewer_employee_ids: reviewers, topic: topic.trim(), message: message.trim() });
      toast.success(res?.message || "Feedback requested");
      onSent?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not send request"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title="Request Feedback" icon={<MessageSquare size={20} className="text-[#f18200]" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Ask (up to 10 people)</Label>
          <EmployeePicker multiple max={10} value={reviewers} onChange={setReviewers} />
        </div>
        <div>
          <Label htmlFor="rq-topic">Topic</Label>
          <input
            id="rq-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={150}
            placeholder="e.g. Sprint 42 delivery, client demo, code reviews"
            className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm outline-none focus:border-[#f18200]" />
        </div>
        <div>
          <Label htmlFor="rq-message">Note (optional)</Label>
          <textarea
            id="rq-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Anything specific you want them to comment on?"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#f18200] resize-none" />
        </div>
        <div className="flex gap-2 pt-1">
          <SecondaryButton type="button" onClick={onClose} className="flex-1">Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={saving} className="flex-1">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send Request
          </PrimaryButton>
        </div>
      </form>
    </Modal>);
};
/* ---------- Kudos card ---------- */
export const KudosItem = ({ k, perspective = "wall" }) => {
  const person = perspective === "received" ? k.from_name : perspective === "sent" ? k.to_name : k.from_name;
  return (
    <article className="flex items-start gap-4 border border-slate-100 rounded-xl p-4 hover:bg-slate-50/60 transition-colors">
      <Avatar name={person} size={44} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {perspective === "received" &&
          <><span className="text-sm font-bold text-slate-900">{k.from_name}</span><span className="text-xs text-slate-500">recognised you</span></>
          }
          {perspective === "sent" &&
          <><span className="text-xs text-slate-500">You recognised</span><span className="text-sm font-bold text-slate-900">{k.to_name}</span></>
          }
          {perspective === "wall" &&
          <><span className="text-sm font-bold text-slate-900">{k.from_name}</span><ArrowRight size={13} className="text-slate-400" /><span className="text-sm font-bold text-slate-900">{k.to_name}</span></>
          }
          <CategoryBadge name={k.category_name} color={k.category_color} />
          {!k.is_public && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Private</span>}
        </div>
        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line break-words">{k.message}</p>
        <p className="text-xs text-slate-400 mt-2">{timeAgo(k.created_at)}</p>
      </div>
    </article>);
};
/* ---------- Report (HR Manager / Admin) ---------- */
const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "short" });
};
function downloadCsv(filename, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
export const FeedbackReport = ({ onGiveKudos }) => {
  const [months, setMonths] = useState(6);
  const [departmentId, setDepartmentId] = useState("");
  const [type, setType] = useState("");
  const [departments, setDepartments] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {listDepartments().then(setDepartments).catch(() => {});}, []);
  useEffect(() => {
    setLoading(true);
    getKfReport({ months, department_id: departmentId || undefined, type: type || undefined }).
    then(setReport).
    catch((err) => toast.error(getErrorMessage(err, "Could not load report"))).
    finally(() => setLoading(false));
  }, [months, departmentId, type]);
  const totalByType = useMemo(() => (report?.by_type || []).reduce((s, r) => s + Number(r.total), 0), [report]);
  const maxTrend = useMemo(() => Math.max(1, ...(report?.trend || []).flatMap((t) => [t.kudos, t.feedback])), [report]);
  const exportCsv = () => {
    if (!report) return;
    downloadCsv(`feedback-report-${months}m.csv`, [
    ["Employee", "Code", "Department", "Positive", "Constructive", "Developmental", "Total", "Last feedback"],
    ...report.by_employee.map((r) => [r.name, r.emp_code, r.department_name, r.positive, r.constructive, r.developmental, r.total, r.last_feedback_at])]
    );
  };
  const t = report?.totals || {};
  const participation = t.employees ? Math.round(Number(t.active_people) / Number(t.employees) * 100) : 0;
  const responseRate = Number(t.requests_total) ? Math.round(Number(t.requests_completed) / Number(t.requests_total) * 100) : null;
  // conic-gradient donut for the feedback mix
  let acc = 0;
  const donut = (report?.by_type || []).map((r) => {
    const start = acc;
    acc += totalByType ? Number(r.total) / totalByType * 100 : 0;
    return `${TYPE_STYLE[r.feedback_type].bar} ${start}% ${acc}%`;
  }).join(", ");
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">Period
          <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="h-10 min-w-[150px] border border-slate-200 rounded-xl px-3 text-sm text-slate-800 bg-white">
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">Department
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="h-10 min-w-[170px] border border-slate-200 rounded-xl px-3 text-sm text-slate-800 bg-white">
            <option value="">All departments</option>
            {departments.map((d) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">Feedback type
          <select value={type} onChange={(e) => setType(e.target.value)} className="h-10 min-w-[150px] border border-slate-200 rounded-xl px-3 text-sm text-slate-800 bg-white">
            <option value="">All types</option>
            {FEEDBACK_TYPES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <SecondaryButton onClick={exportCsv} disabled={!report?.by_employee?.length} className="ml-auto">
          <Download size={15} /> Export CSV
        </SecondaryButton>
      </div>
      {loading && !report ? <Loading /> :
      <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<Award size={22} className="text-amber-500" />} label="Kudos" value={t.kudos} hint={`Last ${months} months`} accent="bg-amber-50" />
            <StatCard icon={<MessageSquare size={22} className="text-[#f18200]" />} label="Feedback" value={t.feedback} hint={`Last ${months} months`} />
            <StatCard icon={<Check size={22} className="text-emerald-600" />} label="Participation" value={`${participation}%`} hint={`${t.active_people || 0} of ${t.employees || 0} people`} accent="bg-emerald-50" />
            <StatCard icon={<Send size={22} className="text-blue-600" />} label="Request response" value={responseRate == null ? "–" : `${responseRate}%`} hint={`${t.pending_requests || 0} pending`} accent="bg-blue-50" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="text-base font-bold text-slate-900">Monthly trend</h2>
                <div className="flex gap-4 text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#f18200]" />Kudos</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#1d4ed8]" />Feedback</span>
                </div>
              </div>
              <div className="h-48 flex items-end gap-3 border-b border-slate-100 px-1" role="img" aria-label="Kudos and feedback per month">
                {report.trend.map((m) =>
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end gap-1 h-40">
                      <div title={`${m.kudos} kudos`} className="w-3 sm:w-4 rounded-t bg-[#f18200]" style={{ height: `${m.kudos / maxTrend * 100}%`, minHeight: m.kudos ? 4 : 0 }} />
                      <div title={`${m.feedback} feedback`} className="w-3 sm:w-4 rounded-t bg-[#1d4ed8]" style={{ height: `${m.feedback / maxTrend * 100}%`, minHeight: m.feedback ? 4 : 0 }} />
                    </div>
                  </div>
              )}
              </div>
              <div className="flex gap-3 px-1 mt-2">
                {report.trend.map((m) => <span key={m.month} className="flex-1 text-center text-xs font-semibold text-slate-500">{monthLabel(m.month)}</span>)}
              </div>
            </section>
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="text-base font-bold text-slate-900 mb-4">Feedback by type</h2>
              <div className="flex items-center gap-5 flex-wrap">
                <div
                className="w-32 h-32 rounded-full flex items-center justify-center"
                style={{ background: totalByType ? `conic-gradient(${donut})` : "#eef0f5" }}
                role="img"
                aria-label={report.by_type.map((r) => `${r.feedback_type} ${r.total}`).join(", ")}>
                  <div className="w-20 h-20 rounded-full bg-white flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-slate-900">{totalByType}</span>
                    <span className="text-[11px] text-slate-500">total</span>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  {report.by_type.map((r) =>
                <li key={r.feedback_type} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded" style={{ background: TYPE_STYLE[r.feedback_type].bar }} />
                      {r.feedback_type}
                      <strong>{totalByType ? Math.round(r.total / totalByType * 100) : 0}%</strong>
                    </li>
                )}
                </ul>
              </div>
            </section>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
              <h2 className="text-base font-bold text-slate-900 px-5 pt-5 pb-3">Feedback received per employee</h2>
              {report.by_employee.length === 0 ?
            <EmptyState icon={<MessageSquare className="text-[#f18200]" />} title="No feedback in this period" /> :
            <table className="w-full min-w-[620px] text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-500 text-left">
                      <th scope="col" className="px-5 py-3 font-semibold">Employee</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Department</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Received</th>
                      <th scope="col" className="px-3 py-3 font-semibold">Mix</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Last feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.by_employee.map((r) =>
                <tr key={r.employee_id} className="border-t border-slate-50">
                        <td className="px-5 py-3 font-semibold text-slate-800">{r.name}</td>
                        <td className="px-3 py-3 text-slate-500">{r.department_name || "–"}</td>
                        <td className="px-3 py-3 font-bold">{r.total}</td>
                        <td className="px-3 py-3">
                          <div
                      className="flex w-36 h-2.5 rounded-full overflow-hidden bg-slate-100"
                      title={`${r.positive} positive, ${r.constructive} constructive, ${r.developmental} developmental`}>
                            <span style={{ width: `${r.positive / r.total * 100}%`, background: TYPE_STYLE.Positive.bar }} />
                            <span style={{ width: `${r.constructive / r.total * 100}%`, background: TYPE_STYLE.Constructive.bar }} />
                            <span style={{ width: `${r.developmental / r.total * 100}%`, background: TYPE_STYLE.Developmental.bar }} />
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-500">{timeAgo(r.last_feedback_at)}</td>
                      </tr>
                )}
                  </tbody>
                </table>
            }
            </section>
            <div className="space-y-4">
              <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h2 className="text-base font-bold text-slate-900 mb-3">Kudos by department</h2>
                {report.by_department.filter((d) => Number(d.kudos) > 0).length === 0 ?
              <p className="text-sm text-slate-500">No kudos in this period.</p> :
              <ul className="space-y-3">
                    {report.by_department.filter((d) => Number(d.kudos) > 0).slice(0, 6).map((d) =>
                <li key={d.department_id}>
                        <div className="flex justify-between text-sm"><span className="font-semibold text-slate-700">{d.department_name}</span><strong>{d.kudos}</strong></div>
                        <div className="h-2 rounded-full bg-slate-100 mt-1">
                          <div className="h-2 rounded-full bg-[#f18200]" style={{ width: `${d.kudos / Math.max(...report.by_department.map((x) => Number(x.kudos)), 1) * 100}%` }} />
                        </div>
                      </li>
                )}
                  </ul>
              }
              </section>
              <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h2 className="text-base font-bold text-slate-900">Low recognition</h2>
                <p className="text-xs text-slate-500 mb-3">No kudos in the last 60 days</p>
                {report.low_recognition.length === 0 ?
              <p className="text-sm text-slate-500">Everyone has been recognised recently.</p> :
              <ul className="space-y-2">
                    {report.low_recognition.slice(0, 6).map((p) =>
                <li key={p.employee_id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0">
                          <span className="block font-semibold text-slate-800 truncate">{p.name}</span>
                          <span className="block text-xs text-slate-500">{p.last_kudos_at ? `Last ${timeAgo(p.last_kudos_at)}` : "Never recognised"}</span>
                        </span>
                        {onGiveKudos &&
                  <button onClick={() => onGiveKudos({ employee_id: p.employee_id, name: p.name })} className="text-xs font-bold text-[#b45309] hover:underline shrink-0">
                            Recognise
                          </button>
                  }
                      </li>
                )}
                  </ul>
              }
              </section>
            </div>
          </div>
        </>
      }
    </div>);
};

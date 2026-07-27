// Shared UI primitives for the Recruitment module
import React from "react";
import { X, ChevronRight } from "lucide-react";

const BRAND = "#f18200";

// Tailwind class maps for StatusBadge
const STATUS_CLS = {
  "Work in Progress":    "bg-blue-100 text-blue-700",
  "Schedule Interview":  "bg-violet-100 text-violet-600",
  "Shortlisted":         "bg-sky-100 text-sky-700",
  "Offer Released":      "bg-amber-100 text-amber-600",
  "Offer Accepted":      "bg-emerald-100 text-emerald-600",
  "Offer Rejected":      "bg-red-100 text-red-600",
  "Joining Formalities": "bg-cyan-100 text-cyan-600",
  "Onboarded":           "bg-green-100 text-green-800",
  "Active":              "bg-emerald-100 text-emerald-600",
  "In Active":           "bg-gray-100 text-gray-500",
  "Open":                "bg-emerald-100 text-emerald-600",
  "Closed":              "bg-red-100 text-red-600",
  "Completed":           "bg-blue-100 text-blue-700",
  "Hold":                "bg-amber-100 text-amber-600",
  "Scheduled":           "bg-violet-100 text-violet-600",
  "Selected":            "bg-emerald-100 text-emerald-600",
  "Not Selected":        "bg-red-100 text-red-600",
  "Approved":            "bg-emerald-100 text-emerald-600",
  "Pending Approval":    "bg-amber-100 text-amber-600",
  "Rejected":            "bg-red-100 text-red-600",
};

/* ── Status Badge ─────────────────────────────────────────────────────────── */
export function StatusBadge({ status }) {
  const cls = STATUS_CLS[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-[9px] py-[2px] rounded-full text-[11px] font-semibold tracking-[0.02em] whitespace-nowrap ${cls}`}>
      {status}
    </span>
  );
}

/* ── Page Header ──────────────────────────────────────────────────────────── */
export function PageHeader({ breadcrumbs = [], title, subtitle, action }) {
  return (
    <div className="mb-5">
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1 mb-1.5 text-[12px] text-gray-400">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight size={12} />}
              <span className={i === breadcrumbs.length - 1 ? "text-[#f18200] font-medium" : "text-gray-400"}>
                {b}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 m-0">{title}</h1>
          {subtitle && <p className="text-[13px] text-gray-500 mt-0.5 mb-0">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}

/* ── Primary Button ───────────────────────────────────────────────────────── */
const BTN_VARIANT = {
  primary:   "bg-[#f18200] text-white border border-[#f18200]",
  secondary: "bg-white text-gray-700 border border-gray-300",
  danger:    "bg-white text-red-600 border border-red-300",
  ghost:     "bg-transparent text-gray-500 border-0",
};
const BTN_SIZE = {
  sm: "py-[5px] px-3 text-[12px]",
  md: "py-[7px] px-4 text-[13px]",
  lg: "py-2.5 px-5 text-sm",
};

export function Btn({ children, onClick, variant = "primary", size = "md", disabled, type = "button", icon }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-[7px] font-semibold transition-opacity ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } ${BTN_VARIANT[variant] ?? BTN_VARIANT.primary} ${BTN_SIZE[size] ?? BTN_SIZE.md}`}
    >
      {icon && icon}
      {children}
    </button>
  );
}

/* ── Card ─────────────────────────────────────────────────────────────────── */
export function Card({ children, style = {}, className = "" }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-[10px] p-5 ${className}`} style={style}>
      {children}
    </div>
  );
}

/* ── Stat Card ────────────────────────────────────────────────────────────── */
export function StatCard({ label, value, sub, icon: Icon, iconBg = "#fff7ed", iconColor = BRAND, trend }) {
  return (
    <div className="bg-white border border-gray-200 rounded-[10px] px-[18px] py-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] text-gray-500 font-medium uppercase tracking-[0.05em] mb-1.5">{label}</div>
          <div className="text-[26px] font-bold text-gray-900 leading-none">{value}</div>
          {sub && (
            <div className={`text-[11px] mt-1 ${
              trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-gray-500"
            }`}>{sub}</div>
          )}
        </div>
        {Icon && (
          <div
            className="w-10 h-10 rounded-[9px] flex items-center justify-center flex-shrink-0"
            style={{ background: iconBg }}
          >
            <Icon size={20} color={iconColor} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Form Field ───────────────────────────────────────────────────────────── */
export function Field({ label, required, children, error }) {
  return (
    <div className="mb-3.5">
      {label && (
        <label className="block text-[12px] font-semibold text-gray-700 mb-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-[11px] text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

const inputCls = "w-full box-border px-[11px] py-2 rounded-[7px] border border-gray-300 text-[13px] text-gray-900 outline-none";

export function Input({ value, onChange, placeholder, type = "text", disabled, name, ...rest }) {
  return (
    <input
      name={name}
      type={type}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`${inputCls} ${disabled ? "bg-gray-50" : "bg-white"}`}
      style={{ fontFamily: "inherit" }}
      {...rest}
    />
  );
}

export function Select({ value, onChange, options = [], placeholder, disabled, name }) {
  return (
    <select
      name={name}
      value={value ?? ""}
      onChange={onChange}
      disabled={disabled}
      className={`${inputCls} ${disabled ? "bg-gray-50 cursor-default" : "bg-white cursor-pointer"}`}
      style={{ fontFamily: "inherit" }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  );
}

export function Textarea({ value, onChange, placeholder, rows = 3, disabled, name }) {
  return (
    <textarea
      name={name}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={`${inputCls} resize-y leading-relaxed ${disabled ? "bg-gray-50" : "bg-white"}`}
      style={{ fontFamily: "inherit" }}
    />
  );
}

/* ── Table ────────────────────────────────────────────────────────────────── */
export function Table({ columns, data, onRowClick, emptyMessage = "No records found.", pageSize: initialPageSize = 20 }) {
  const [page,     setPage]     = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  React.useEffect(() => { setPage(1); }, [data]);
  React.useEffect(() => { setPage(1); }, [pageSize]);

  const PAGE_SIZES  = [20, 50, 100, 200, 500];
  const total       = data?.length ?? 0;
  const totalPages  = Math.max(1, Math.ceil(total / pageSize));
  const safePage    = Math.min(page, totalPages);
  const paged       = (data ?? []).slice((safePage - 1) * pageSize, safePage * pageSize);
  const from        = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to          = Math.min(safePage * pageSize, total);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col, i) => (
                <th
                  key={i}
                  style={{ width: col.width }}
                  className="px-3.5 py-2.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-[0.04em] whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {total === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3.5 py-8 text-center text-gray-400 text-[13px]">
                  {emptyMessage}
                </td>
              </tr>
            ) : paged.map((row, ri) => (
              <tr
                key={ri}
                onClick={() => onRowClick && onRowClick(row)}
                className={`border-b border-gray-100 transition-colors ${onRowClick ? "cursor-pointer hover:bg-gray-50" : "cursor-default"}`}
              >
                {columns.map((col, ci) => (
                  <td key={ci} className="px-3.5 py-[11px] text-gray-700 align-middle">
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination — always shown */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-white text-[13px] text-gray-600 select-none">
        <div className="flex items-center gap-2">
          <span className="text-[12px]">Items per page:</span>
          <div className="relative">
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
              className="appearance-none border border-gray-300 rounded px-2 py-0.5 pr-6 text-[13px] bg-white focus:outline-none focus:border-[#d97706] cursor-pointer">
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">▾</span>
          </div>
        </div>
        <span className="text-[12px]">{total === 0 ? "0 of 0" : `${from} – ${to} of ${total}`}</span>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setPage(1)} disabled={safePage === 1} title="First page"
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
            {"|<"}
          </button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} title="Previous"
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
            {"<"}
          </button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} title="Next"
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
            {">"}
          </button>
          <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages} title="Last page"
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
            {">|"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Center Modal ─────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width = 560, footer }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/45 flex items-center justify-center p-5"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-[14px] w-full flex flex-col max-h-[90vh] shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
        style={{ maxWidth: width }}
      >
        <div className="flex items-center justify-between px-[22px] py-[18px] border-b border-gray-100">
          <h2 className="m-0 text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="bg-transparent border-0 cursor-pointer text-gray-400 p-1 rounded-md flex">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-[22px] py-5 flex-1">
          {children}
        </div>
        {footer && (
          <div className="px-[22px] py-3.5 border-t border-gray-100 flex justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Slide-Over (right panel) ─────────────────────────────────────────────── */
export function SlideOver({ open, onClose, title, children, width = 520, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex">
      <div className="flex-1 bg-black/35" onClick={onClose} />
      <div
        className="bg-white flex flex-col h-screen shadow-[-8px_0_40px_rgba(0,0,0,0.15)] max-w-[95vw]"
        style={{ width }}
      >
        <div className="flex items-center justify-between px-[22px] py-[18px] border-b border-gray-100 bg-white">
          <h2 className="m-0 text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="bg-transparent border-0 cursor-pointer text-gray-400 p-1 rounded-md flex">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-[22px] py-5">
          {children}
        </div>
        {footer && (
          <div className="px-[22px] py-3.5 border-t border-gray-100 flex justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Search Bar ───────────────────────────────────────────────────────────── */
export function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative inline-flex items-center">
      <svg className="absolute left-2.5 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-60 box-border pl-[33px] pr-[11px] py-2 rounded-[7px] border border-gray-200 text-[13px] text-gray-900 bg-gray-50 outline-none"
        style={{ fontFamily: "inherit" }}
      />
    </div>
  );
}

/* ── Section Title ────────────────────────────────────────────────────────── */
export function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-3.5">
      <h3 className="m-0 text-sm font-bold text-gray-900">{children}</h3>
      {action}
    </div>
  );
}

/* ── Tabs ─────────────────────────────────────────────────────────────────── */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-0.5 border-b-2 border-gray-100 mb-5">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`py-2 px-4 text-[13px] font-semibold border-0 border-b-2 -mb-0.5 bg-transparent cursor-pointer transition-colors ${
            active === tab.key
              ? "border-[#f18200] text-[#f18200]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.label}
          {tab.count != null && (
            <span className={`ml-1.5 text-[10px] font-bold rounded-full px-1.5 py-px ${
              active === tab.key ? "bg-[#fff7ed] text-[#f18200]" : "bg-gray-100 text-gray-500"
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Empty State ──────────────────────────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="text-center py-12 px-5 text-gray-400">
      {Icon && <Icon size={40} className="mx-auto mb-3 opacity-40" />}
      <div className="text-[15px] font-semibold text-gray-500 mb-1.5">{title}</div>
      {desc && <div className="text-[13px] mb-4">{desc}</div>}
      {action}
    </div>
  );
}

/* ── Detail Row ───────────────────────────────────────────────────────────── */
export function DetailRow({ label, value }) {
  return (
    <div className="flex gap-2 mb-2.5 text-[13px]">
      <span className="text-gray-500 min-w-[160px] font-medium">{label}</span>
      <span className="text-gray-900 flex-1">{value || "—"}</span>
    </div>
  );
}

export function TwoColGrid({ children }) {
  return (
    <div className="grid grid-cols-2 gap-x-5">
      {children}
    </div>
  );
}

export const BRAND_COLOR = BRAND;

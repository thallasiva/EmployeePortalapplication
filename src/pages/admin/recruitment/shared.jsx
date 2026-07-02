// Shared UI primitives for the Recruitment module
import React from "react";
import { X, ChevronRight } from "lucide-react";

const BRAND = "#f18200";

/* ── Status Badge ─────────────────────────────────────────────────────────── */
export function StatusBadge({ status }) {
  const map = {
    "Work in Progress":     { bg: "#dbeafe", color: "#1d4ed8" },
    "Schedule Interview":   { bg: "#ede9fe", color: "#7c3aed" },
    "Shortlisted":          { bg: "#e0f2fe", color: "#0369a1" },
    "Offer Released":       { bg: "#fef3c7", color: "#d97706" },
    "Offer Accepted":       { bg: "#d1fae5", color: "#059669" },
    "Offer Rejected":       { bg: "#fee2e2", color: "#dc2626" },
    "Joining Formalities":  { bg: "#cffafe", color: "#0891b2" },
    "Onboarded":            { bg: "#dcfce7", color: "#166534" },
    // Job statuses
    "Active":               { bg: "#d1fae5", color: "#059669" },
    "In Active":            { bg: "#f3f4f6", color: "#6b7280" },
    "Open":                 { bg: "#d1fae5", color: "#059669" },
    "Closed":               { bg: "#fee2e2", color: "#dc2626" },
    "Completed":            { bg: "#dbeafe", color: "#1d4ed8" },
    "Hold":                 { bg: "#fef3c7", color: "#d97706" },
    // Interview
    "Scheduled":            { bg: "#ede9fe", color: "#7c3aed" },
    "Selected":             { bg: "#d1fae5", color: "#059669" },
    "Not Selected":         { bg: "#fee2e2", color: "#dc2626" },
    // Offer approval
    "Approved":             { bg: "#d1fae5", color: "#059669" },
    "Pending Approval":     { bg: "#fef3c7", color: "#d97706" },
    "Rejected":             { bg: "#fee2e2", color: "#dc2626" },
  };
  const s = map[status] || { bg: "#f3f4f6", color: "#4b5563" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 9px", borderRadius: 12,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.02em",
      background: s.bg, color: s.color,
      whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

/* ── Page Header ──────────────────────────────────────────────────────────── */
export function PageHeader({ breadcrumbs = [], title, subtitle, action }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {breadcrumbs.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6, fontSize: 12, color: "#9ca3af" }}>
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight size={12} />}
              <span style={{ color: i === breadcrumbs.length - 1 ? BRAND : "#9ca3af", fontWeight: i === breadcrumbs.length - 1 ? 500 : 400 }}>{b}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 13, color: "#6b7280", margin: "3px 0 0" }}>{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}

/* ── Primary Button ───────────────────────────────────────────────────────── */
export function Btn({ children, onClick, variant = "primary", size = "md", disabled, type = "button", icon }) {
  const styles = {
    primary: { background: BRAND, color: "#fff", border: `1px solid ${BRAND}` },
    secondary: { background: "#fff", color: "#374151", border: "1px solid #d1d5db" },
    danger: { background: "#fff", color: "#dc2626", border: "1px solid #fca5a5" },
    ghost: { background: "transparent", color: "#6b7280", border: "none" },
  };
  const sizes = {
    sm: { padding: "5px 12px", fontSize: 12 },
    md: { padding: "7px 16px", fontSize: 13 },
    lg: { padding: "10px 20px", fontSize: 14 },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        borderRadius: 7, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1, transition: "opacity 0.15s",
        ...styles[variant], ...sizes[size],
      }}
    >
      {icon && icon}
      {children}
    </button>
  );
}

/* ── Card ─────────────────────────────────────────────────────────────────── */
export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb",
      borderRadius: 10, padding: "20px",
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── Stat Card ────────────────────────────────────────────────────────────── */
export function StatCard({ label, value, sub, icon: Icon, iconBg = "#fff7ed", iconColor = BRAND, trend }) {
  return (
    <Card style={{ padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: trend === "up" ? "#059669" : trend === "down" ? "#dc2626" : "#6b7280", marginTop: 4 }}>{sub}</div>}
        </div>
        {Icon && (
          <div style={{ width: 40, height: 40, borderRadius: 9, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={20} color={iconColor} />
          </div>
        )}
      </div>
    </Card>
  );
}

/* ── Form Field ───────────────────────────────────────────────────────────── */
export function Field({ label, required, children, error }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
          {label}{required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
        </label>
      )}
      {children}
      {error && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>{error}</p>}
    </div>
  );
}

const inputBase = {
  width: "100%", boxSizing: "border-box",
  padding: "8px 11px", borderRadius: 7,
  border: "1px solid #d1d5db", fontSize: 13,
  color: "#111827", background: "#fff",
  outline: "none", fontFamily: "inherit",
};

export function Input({ value, onChange, placeholder, type = "text", disabled, name, ...rest }) {
  return (
    <input
      name={name}
      type={type}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      style={{ ...inputBase, background: disabled ? "#f9fafb" : "#fff" }}
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
      style={{ ...inputBase, background: disabled ? "#f9fafb" : "#fff", cursor: disabled ? "default" : "pointer" }}
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
      style={{ ...inputBase, resize: "vertical", lineHeight: 1.5, background: disabled ? "#f9fafb" : "#fff" }}
    />
  );
}

/* ── Table ────────────────────────────────────────────────────────────────── */
export function Table({ columns, data, onRowClick, emptyMessage = "No records found." }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
            {columns.map((col, i) => (
              <th key={i} style={{
                padding: "10px 14px", textAlign: "left",
                fontSize: 11, fontWeight: 700, color: "#6b7280",
                textTransform: "uppercase", letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                width: col.width,
              }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(!data || data.length === 0) ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: "32px 14px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                {emptyMessage}
              </td>
            </tr>
          ) : data.map((row, ri) => (
            <tr
              key={ri}
              onClick={() => onRowClick && onRowClick(row)}
              style={{
                borderBottom: "1px solid #f3f4f6",
                cursor: onRowClick ? "pointer" : "default",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => { if (onRowClick) e.currentTarget.style.background = "#fafafa"; }}
              onMouseLeave={e => { e.currentTarget.style.background = ""; }}
            >
              {columns.map((col, ci) => (
                <td key={ci} style={{ padding: "11px 14px", color: "#374151", verticalAlign: "middle" }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Center Modal ─────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width = 560, footer }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.45)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 20,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 14, width: "100%", maxWidth: width,
        maxHeight: "90vh", display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px", borderBottom: "1px solid #f0f0f0",
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4, borderRadius: 6, display: "flex" }}>
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div style={{ overflowY: "auto", padding: "20px 22px", flex: 1 }}>
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div style={{ padding: "14px 22px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
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
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex" }}>
      {/* Backdrop */}
      <div style={{ flex: 1, background: "rgba(0,0,0,0.35)" }} onClick={onClose} />
      {/* Panel */}
      <div style={{
        width, maxWidth: "95vw", background: "#fff",
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
        height: "100vh",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px", borderBottom: "1px solid #f0f0f0",
          background: "#fff",
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#111827" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4, borderRadius: 6, display: "flex" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
          {children}
        </div>
        {footer && (
          <div style={{ padding: "14px 22px", borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
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
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <svg style={{ position: "absolute", left: 10, color: "#9ca3af" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          ...inputBase, paddingLeft: 33, width: 240,
          background: "#f9fafb", border: "1px solid #e5e7eb",
        }}
      />
    </div>
  );
}

/* ── Section Title ────────────────────────────────────────────────────────── */
export function SectionTitle({ children, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111827" }}>{children}</h3>
      {action}
    </div>
  );
}

/* ── Tabs ─────────────────────────────────────────────────────────────────── */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 2, borderBottom: "2px solid #f0f0f0", marginBottom: 20 }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: "8px 16px", fontSize: 13, fontWeight: 600,
            border: "none", background: "none", cursor: "pointer",
            borderBottom: active === tab.key ? `2px solid ${BRAND}` : "2px solid transparent",
            color: active === tab.key ? BRAND : "#6b7280",
            marginBottom: -2, transition: "color 0.15s",
          }}
        >
          {tab.label}
          {tab.count != null && (
            <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, background: active === tab.key ? "#fff7ed" : "#f3f4f6", color: active === tab.key ? BRAND : "#6b7280", borderRadius: 20, padding: "1px 6px" }}>
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
    <div style={{ textAlign: "center", padding: "48px 20px", color: "#9ca3af" }}>
      {Icon && <Icon size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />}
      <div style={{ fontSize: 15, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>{title}</div>
      {desc && <div style={{ fontSize: 13, marginBottom: 16 }}>{desc}</div>}
      {action}
    </div>
  );
}

/* ── Detail Row ───────────────────────────────────────────────────────────── */
export function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 10, fontSize: 13 }}>
      <span style={{ color: "#6b7280", minWidth: 160, fontWeight: 500 }}>{label}</span>
      <span style={{ color: "#111827", flex: 1 }}>{value || "—"}</span>
    </div>
  );
}

export function TwoColGrid({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
      {children}
    </div>
  );
}

export const BRAND_COLOR = BRAND;

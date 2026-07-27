export const BRAND        = "#f18200";
export const BRAND_LIGHT  = "#fff7ed";
export const BRAND_BORDER = "#fed7aa";

export const STATUS_STYLE = {
  "Open":       { bg: "#eff6ff", color: "#2563eb" },
  "Forwarded":  { bg: "#f5f3ff", color: "#7c3aed" },
  "In Progress":{ bg: "#fff7ed", color: "#c2410c" },
  "Reopened":   { bg: "#fff1f2", color: "#be123c" },
  "Resolved":   { bg: "#f0fdf4", color: "#15803d" },
  "Closed":     { bg: "#f8fafc", color: "#64748b" },
  "Rejected":   { bg: "#fef2f2", color: "#b91c1c" },
};

export function getStatusStyle(status) {
  return STATUS_STYLE[status] ?? STATUS_STYLE["Open"];
}

export function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function getCommentStyle(name, comment) {
  if (!name) return { bg: "#f3f4f6", color: "#374151", label: "Unknown" };
  const lc = comment?.toLowerCase() || "";
  if (lc.startsWith("[reopened]")) return { bg: "#fff1f2",  color: "#be123c", label: name };
  if (lc.startsWith("[rejected]")) return { bg: "#fef2f2",  color: "#dc2626", label: name };
  if (lc.startsWith("[approved"))  return { bg: "#f5f3ff",  color: "#7c3aed", label: name };
  return { bg: "#eff6ff", color: "#2563eb", label: name };
}

/** Build the plain-text description from dynamic form values */
export function buildDescription(fieldDefs, afterDefs, vals) {
  const parts = [];
  [...fieldDefs, ...afterDefs].forEach((f) => {
    if (f.key === "desc") {
      if (vals.desc?.trim()) parts.push(vals.desc.trim());
    } else if (f.type === "datetime") {
      const d = vals[f.key];
      const t = vals[f.key + "_time"];
      if (d || t) parts.push(`${f.label}: ${d}${t ? " " + t : ""}`);
    } else {
      if (vals[f.key]?.trim()) parts.push(`${f.label}: ${vals[f.key]}`);
    }
  });
  return parts.join("\n") || null;
}

/** Shared input base style object (used with cssClass) */
export const INPUT_BASE = {
  width: "100%", height: 38, padding: "0 12px",
  border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13,
  outline: "none", boxSizing: "border-box", color: "#374151", background: "#fff",
};

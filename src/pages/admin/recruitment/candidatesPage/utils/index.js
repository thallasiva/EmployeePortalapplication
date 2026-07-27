import { REQUIRED_FIELDS } from "../constants";

export function scoreTextCls(v) {
  return v >= 80 ? "text-green-600" : v >= 65 ? "text-blue-700" : v >= 45 ? "text-amber-600" : "text-red-600";
}

export function scoreBgCls(v) {
  return v >= 80 ? "bg-green-600" : v >= 65 ? "bg-blue-700" : v >= 45 ? "bg-amber-600" : "bg-red-600";
}

export function safeArr(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch {}
  return String(v).split(",").map((s) => s.trim()).filter(Boolean);
}

export function missingFields(form) {
  return REQUIRED_FIELDS.filter((f) => !form[f] && form[f] !== 0);
}

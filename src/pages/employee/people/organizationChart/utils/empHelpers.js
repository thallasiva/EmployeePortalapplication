export function fullName(e) {
  return [e.first_name, e.last_name].filter(Boolean).join(" ") || e.emp_code || "—";
}

export function initials(name) {
  const p = (name || "?").trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "?";
}

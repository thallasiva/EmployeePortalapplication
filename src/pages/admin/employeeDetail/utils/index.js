export function fmt(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function toDateInput(val) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function cleanForm(obj, dateKeys = []) {
  const out = { ...obj };
  dateKeys.forEach((k) => {
    if (out[k] === "" || out[k] === undefined) out[k] = null;
  });
  return out;
}

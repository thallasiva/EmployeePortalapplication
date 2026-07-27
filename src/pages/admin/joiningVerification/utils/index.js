export function fmt(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function parse(v) {
  try {
    return JSON.parse(v) || [];
  } catch {
    return [];
  }
}

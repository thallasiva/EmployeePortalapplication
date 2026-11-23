const BRAND = "#e87500";
const FEEDBACK_TYPES = ["Positive", "Constructive", "Developmental"];
const TYPE_STYLE = {
  Positive: {
    badge: "bg-emerald-50 text-emerald-700",
    bar: "#16a34a"
  },
  Constructive: {
    badge: "bg-orange-50 text-orange-700",
    bar: "#e87500"
  },
  Developmental: {
    badge: "bg-blue-50 text-[#e87500]",
    bar: "#cf6900"
  }
};
function timeAgo(value) {
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
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}
/* ---------- Report (HR Manager / Admin) ---------- */
const monthLabel = key => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", {
    month: "short"
  });
};
function downloadCsv(filename, rows) {
  const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = rows.map(r => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], {
    type: "text/csv;charset=utf-8"
  }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
export { BRAND, FEEDBACK_TYPES, TYPE_STYLE, timeAgo, monthLabel, downloadCsv };

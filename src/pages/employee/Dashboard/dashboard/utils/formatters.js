export const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
}

export function fmtTime(t) {
  if (!t) return "—";
  try {
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(String(t))) {
      const [h, m] = String(t).split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
    }
    const d = new Date(t);
    if (isNaN(d)) return String(t);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return String(t);
  }
}

export function fmtHolDate(dateStr) {
  const d = new Date(dateStr);
  return {
    badge: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    weekday: d.toLocaleDateString("en-US", { weekday: "long" }),
  };
}

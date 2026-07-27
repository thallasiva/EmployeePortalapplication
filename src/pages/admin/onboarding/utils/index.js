import { API_BASE_URL } from "../../../../api/client";
import { CHECKLIST_TEMPLATE } from "../constants";

export function daysSince(dateStr) {
  if (!dateStr) return 9999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

export function progressFromDays(days) {
  if (days <= 1) return 10;
  if (days <= 7) return 30;
  if (days <= 14) return 55;
  if (days <= 30) return 75;
  if (days <= 60) return 88;
  return 100;
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function initials(first, last) {
  return `${(first || "?")[0]}${(last || "")[0] || ""}`.toUpperCase();
}

export function fileUrl(relPath) {
  if (!relPath) return "#";
  const base = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${base}${relPath}`;
}

export function buildChecklist(days) {
  return CHECKLIST_TEMPLATE.map((group) => {
    const items = group.items.map((item) => ({
      ...item,
      status: days > item.dueDays ? "Completed" : "Pending",
    }));
    const completed = items.filter((i) => i.status === "Completed").length;
    return { ...group, items, completed, total: items.length };
  });
}

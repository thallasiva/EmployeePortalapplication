import { AVATAR_COLORS } from "../constants";

export const fmt = (d) => d.toISOString().split("T")[0];

export function expandDates(from, to) {
  const dates = [];
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    dates.push(fmt(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export const avatarColor = (name = "") =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

export const initials = (name = "") =>
  name.trim().split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

export const daysBetween = (from, to) => {
  const ms = new Date(to) - new Date(from);
  return Math.round(ms / 86400000) + 1;
};

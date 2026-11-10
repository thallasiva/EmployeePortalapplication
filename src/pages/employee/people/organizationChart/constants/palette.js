export const BRAND = "#e87500";
export const PALETTE = [
  "#e87500", "#e87500", "#a855f7", "#ec4899",
  "#10b981", "#ef4444", "#e87500", "#84cc16",
  "#f59e0b", "#e87500", "#8b5cf6", "#14b8a6",
];
export function deptColor(deptId) {
  if (deptId == null) return "#94a3b8";
  return PALETTE[Number(deptId) % PALETTE.length];
}

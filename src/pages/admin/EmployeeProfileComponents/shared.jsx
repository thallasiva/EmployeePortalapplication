const AVATAR_COLORS = ["#e87500", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#e87500", "#22c55e"];
function initials(name = "") {
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() || "?";
}
function avatarColor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
export { AVATAR_COLORS, initials, avatarColor };

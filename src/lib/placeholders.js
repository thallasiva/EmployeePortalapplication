/** Local placeholders — no external HTTP requests */

const svgAvatar = (letter = "U", color = "#f18200", size = 40) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size / 2}" fill="${color}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="${Math.round(size * 0.35)}" font-weight="600">${letter}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export const PLACEHOLDER_AVATAR = svgAvatar("U", "#f18200", 40);
export const PLACEHOLDER_AVATAR_LG = svgAvatar("U", "#f18200", 60);
export const PLACEHOLDER_AVATAR_SM = svgAvatar("U", "#f18200", 50);

const COLORS = ["#f18200", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4", "#f59e0b", "#84cc16"];
const LETTERS = "ABCDEFGHKLMNPRSTUV";

function strHash(s = "") {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

/** Pass a name string → shows real initials with color seeded by name.
 *  Pass a number (legacy) → picks a letter from LETTERS seeded by the number. */
export function avatarDataUri(seedOrName = 0, size = 40) {
  if (typeof seedOrName === "string" && seedOrName.trim()) {
    const name = seedOrName.trim();
    const initials = name.split(/\s+/).filter(Boolean).map(p => p[0]).join("").slice(0, 2).toUpperCase() || "?";
    const color = COLORS[strHash(name) % COLORS.length];
    return svgAvatar(initials, color, size);
  }
  const seed = Number(seedOrName) || 0;
  return svgAvatar(
    LETTERS[Math.abs(seed) % LETTERS.length],
    COLORS[Math.abs(seed) % COLORS.length],
    size
  );
}

const svgIcon = (path, color = "#64748b") => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" stroke="${color}" stroke-width="2"><path d="${path}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export const PLACEHOLDER_ICON_EMPTY = svgIcon(
  "M8 12h32M12 20h24M16 28h16",
  "#94a3b8"
);

export const PLACEHOLDER_ICON_MONEY = svgAvatar("$", "#3b82f6", 48);

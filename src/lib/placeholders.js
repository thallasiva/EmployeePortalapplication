/** Local placeholders — no external HTTP requests */

const svgAvatar = (letter = "U", color = "#f18200", size = 40) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size / 2}" fill="${color}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="${Math.round(size * 0.35)}" font-weight="600">${letter}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export const PLACEHOLDER_AVATAR = svgAvatar("U", "#f18200", 40);
export const PLACEHOLDER_AVATAR_LG = svgAvatar("U", "#f18200", 60);
export const PLACEHOLDER_AVATAR_SM = svgAvatar("U", "#f18200", 50);

const COLORS = ["#f18200", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444"];
const LETTERS = "ABCDEFGHKLMNPRSTUV";

export function avatarDataUri(seed = 0, size = 40) {
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

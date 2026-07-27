import { TYPE_CONFIG } from "../constants";

export function getConfig(title = "") {
  const t = title.toLowerCase();
  return (
    TYPE_CONFIG.find((c) => c.match.some((k) => t.includes(k))) ||
    TYPE_CONFIG[TYPE_CONFIG.length - 1]
  );
}

export function ltCode(name = "") {
  const n = name.toLowerCase();
  if (n.includes("earned")) return "EL";
  if (n.includes("sick")) return "SL";
  if (n.includes("casual")) return "CL";
  if (n.includes("comp")) return "CO";
  if (n.includes("maternity")) return "ML";
  if (n.includes("privilege")) return "PL";
  if (n.includes("restricted")) return "RH";
  return name.slice(0, 2).toUpperCase();
}

export const fmt = (v) =>
  v == null || v === 0 ? "-" : Number(v).toFixed(1).replace(".0", "");

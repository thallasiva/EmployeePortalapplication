export function getScoreColor(score) {
  if (score >= 80) return "#f18200";
  if (score >= 65) return "#0369a1";
  if (score >= 45) return "#d97706";
  return "#dc2626";
}

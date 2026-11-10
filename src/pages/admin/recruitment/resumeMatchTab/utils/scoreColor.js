export function getScoreColor(score) {
  if (score >= 80) return "#e87500";
  if (score >= 65) return "#c45f00";
  if (score >= 45) return "#d97706";
  return "#dc2626";
}

export function delegateStatus(from, to) {
  if (!from || !to) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (to < today) return "expired";
  if (from > today) return "upcoming";
  return "active";
}

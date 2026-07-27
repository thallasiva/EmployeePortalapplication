export const formatHours = (val) => `${parseFloat(val || 0).toFixed(1)}h`;

export const formatDate = (val) =>
  val ? new Date(val).toLocaleDateString("en-GB") : "—";

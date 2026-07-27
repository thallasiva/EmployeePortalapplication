/** Format a numeric value to 1 decimal, stripping trailing ".0" */
export const fmt = (v) => Number(v || 0).toFixed(1).replace(/\.0$/, "");

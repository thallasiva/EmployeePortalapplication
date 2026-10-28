export const formatCalcDisplay = (c) => {
  if (c.calc_type === "Percentage") return `${c.percentage_value}% of ${c.percentage_of}`;
  if (c.calc_type === "Formula") return c.formula_expr;
  return "Fixed";
};

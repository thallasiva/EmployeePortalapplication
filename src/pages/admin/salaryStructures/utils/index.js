import { CAT_ORDER } from "../constants";

export const groupLinesByCategory = (lines) =>
  CAT_ORDER.reduce((acc, cat) => {
    acc[cat] = lines
      .filter((l) => l.category === cat)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
    return acc;
  }, {});

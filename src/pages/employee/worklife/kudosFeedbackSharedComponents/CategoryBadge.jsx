import React from "react";
import { BRAND } from "./shared";
const CategoryBadge = ({
  name,
  color
}) => name ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{
  background: `${color || BRAND}1a`,
  color: color || BRAND
}}>
      {name}
    </span> : null;
export { CategoryBadge };

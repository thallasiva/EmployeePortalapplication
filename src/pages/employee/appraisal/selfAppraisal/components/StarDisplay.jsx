import React from "react";
import { Star } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND } from "../constants";

const StarDisplay = React.memo(function StarDisplay({ value, color = BRAND, size = 16 }) {
  return (
    <span className={cssClass({ display: "flex", alignItems: "center", gap: 3 })}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={cssClass({
            color: n <= value ? color : "#e2e8f0",
            fill:  n <= value ? color : "#e2e8f0",
          })}
        />
      ))}
      <span className={cssClass({ fontSize: 12, color: "#64748b", marginLeft: 4 })}>
        {value}/5
      </span>
    </span>
  );
});

export default StarDisplay;

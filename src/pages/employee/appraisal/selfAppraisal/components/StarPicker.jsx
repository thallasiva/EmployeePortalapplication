import React, { useState } from "react";
import { Star } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND } from "../constants";

const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

const StarPicker = React.memo(function StarPicker({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);
  return (
    <span className={cssClass({ display: "flex", alignItems: "center", gap: 4 })}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={22}
          onClick={() => !disabled && onChange(n)}
          onMouseEnter={() => !disabled && setHover(n)}
          onMouseLeave={() => setHover(0)}
          className={cssClass({
            cursor: disabled ? "default" : "pointer",
            color: (hover || value) >= n ? BRAND : "#e2e8f0",
            fill:  (hover || value) >= n ? BRAND : "#e2e8f0",
            transition: "color 0.1s",
          })}
        />
      ))}
      {value > 0 && (
        <span className={cssClass({ fontSize: 12, fontWeight: 600, color: BRAND, marginLeft: 6 })}>
          {LABELS[value]}
        </span>
      )}
    </span>
  );
});

export default StarPicker;

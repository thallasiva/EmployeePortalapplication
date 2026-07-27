import React, { useState } from "react";
import { Star } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";

function StarPicker({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);
  return (
    <span className={cssClass({ display: "flex", gap: 3 })}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={18}
          onClick={() => !disabled && onChange(n)}
          onMouseEnter={() => !disabled && setHover(n)}
          onMouseLeave={() => setHover(0)}
          className={cssClass({
            cursor: disabled ? "default" : "pointer",
            color: (hover || value) >= n ? "#6366f1" : "#e2e8f0",
            fill: (hover || value) >= n ? "#6366f1" : "#e2e8f0",
          })}
        />
      ))}
    </span>
  );
}

export default React.memo(StarPicker);

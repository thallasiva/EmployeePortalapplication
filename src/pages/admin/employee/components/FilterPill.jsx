import React from "react";
import { X } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";

const FilterPill = React.memo(function FilterPill({ label, onRemove }) {
  return (
    <span
      className={cssClass({
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "#fff7ed",
        color: "#c2410c",
        border: "1px solid #fed7aa",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 10px",
      })}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className={cssClass({
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "flex",
        })}
      >
        <X size={11} color="#f18200" />
      </button>
    </span>
  );
});

export default FilterPill;

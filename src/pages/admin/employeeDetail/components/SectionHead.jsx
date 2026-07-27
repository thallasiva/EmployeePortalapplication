import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants";

const SectionHead = React.memo(function SectionHead({ icon: Icon, title }) {
  return (
    <div
      className={cssClass({
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 16, paddingBottom: 10, borderBottom: "2px solid #f3f4f6",
      })}
    >
      <div
        className={cssClass({
          width: 32, height: 32, borderRadius: 8, background: BRAND + "18",
          display: "flex", alignItems: "center", justifyContent: "center",
        })}
      >
        <Icon size={16} color={BRAND} />
      </div>
      <span className={cssClass({ fontSize: 15, fontWeight: 700, color: "#111827" })}>
        {title}
      </span>
    </div>
  );
});

export default SectionHead;

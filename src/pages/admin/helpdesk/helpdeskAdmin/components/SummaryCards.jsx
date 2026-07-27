import React from "react";
import { cssClass } from "../../../../../utils/classStyles";

const SummaryCards = React.memo(({ cards }) => (
  <div className={cssClass({ display: "flex", gap: 10, marginBottom: 16, flexShrink: 0, flexWrap: "wrap" })}>
    {cards.map((s) => (
      <div key={s.label} className={cssClass({
        background: s.bg, border: `1px solid ${s.color}33`,
        borderRadius: 10, padding: "10px 16px", minWidth: 90,
        display: "flex", alignItems: "center", gap: 10,
      })}>
        <div className={cssClass({ fontSize: 22, fontWeight: 800, color: s.color })}>{s.value}</div>
        <div className={cssClass({ fontSize: 11, color: s.color, fontWeight: 600, lineHeight: 1.3 })}>{s.label}</div>
      </div>
    ))}
  </div>
));

SummaryCards.displayName = "SummaryCards";
export default SummaryCards;

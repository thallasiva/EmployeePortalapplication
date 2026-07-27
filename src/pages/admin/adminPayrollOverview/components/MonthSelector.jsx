import React from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND, MONTHS, VISIBLE } from "../constants";

const MonthSelector = React.memo(function MonthSelector({
  months, selIdx, scroll,
  onSelectIdx, onScrollLeft, onScrollRight,
  isProcessed, isFuture,
}) {
  const visibleMonths = months.slice(scroll, scroll + VISIBLE);
  const now = new Date();

  return (
    <div className={cssClass({
      background: "#fff", border: "1px solid #e9eaec", borderRadius: 12,
      padding: "14px 16px", marginBottom: 22, boxShadow: "0 1px 4px #0000000a",
    })}>
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 6 })}>
        <button
          onClick={onScrollLeft}
          disabled={scroll === 0}
          className={cssClass({
            background: "none", border: "1px solid #e5e7eb", borderRadius: 6,
            cursor: scroll === 0 ? "not-allowed" : "pointer",
            color: scroll === 0 ? "#d1d5db" : "#374151",
            padding: "6px 8px", display: "flex",
          })}
        >
          <ChevronLeft size={16} />
        </button>

        <div className={cssClass({ display: "flex", gap: 5, flex: 1 })}>
          {visibleMonths.map((m) => {
            const gIdx = months.findIndex((x) => x.month === m.month && x.year === m.year);
            const active = gIdx === selIdx;
            const locked = isProcessed(m.month, m.year);
            const future = isFuture(m.month, m.year);
            const curr = m.month === now.getMonth() + 1 && m.year === now.getFullYear();
            return (
              <button
                key={`${m.month}-${m.year}`}
                onClick={() => onSelectIdx(gIdx)}
                className={cssClass({
                  flex: "1 1 0", padding: "10px 4px", borderRadius: 8, cursor: "pointer",
                  border: active ? `2px solid ${BRAND}` : "1px solid #e9eaec",
                  background: active ? "#fff8f0" : future ? "#fafafa" : "#fff",
                  color: active ? BRAND : future ? "#c4c4c4" : "#374151",
                  fontWeight: active ? 800 : 500,
                  fontSize: 13, position: "relative", transition: "all .15s",
                })}
              >
                {curr && !active && (
                  <div className={cssClass({
                    position: "absolute", top: -1, right: -1, width: 7, height: 7,
                    borderRadius: "50%", background: BRAND, border: "1.5px solid #fff",
                  })} />
                )}
                {locked && !active && (
                  <Lock size={9} className={cssClass({
                    position: "absolute", top: 5, left: "50%",
                    transform: "translateX(-50%)", color: "#9ca3af",
                  })} />
                )}
                <div className={cssClass({ marginTop: locked && !active ? 10 : 0 })}>{MONTHS[m.month - 1]}</div>
                <div className={cssClass({ fontSize: 10, opacity: .65 })}>{m.year}</div>
              </button>
            );
          })}
        </div>

        <button
          onClick={onScrollRight}
          disabled={scroll + VISIBLE >= months.length}
          className={cssClass({
            background: "none", border: "1px solid #e5e7eb", borderRadius: 6,
            cursor: scroll + VISIBLE >= months.length ? "not-allowed" : "pointer",
            color: scroll + VISIBLE >= months.length ? "#d1d5db" : "#374151",
            padding: "6px 8px", display: "flex",
          })}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
});

export default MonthSelector;

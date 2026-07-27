import React, { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";

const SHOW = 6;

const FilterSection = React.memo(function FilterSection({ sec, collapsed, onToggle }) {
  const [showAll, setShowAll] = useState(false);
  const visibleOpts = showAll ? sec.options : sec.options.slice(0, SHOW);
  const activeCount = sec.selected.size;

  return (
    <div className={cssClass({ borderBottom: "1px solid #334155" })}>
      <button
        type="button"
        onClick={onToggle}
        className={cssClass({
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#e2e8f0",
        })}
      >
        <span
          className={cssClass({
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
          })}
        >
          {sec.label}
        </span>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 6 })}>
          {activeCount > 0 && (
            <span
              className={cssClass({
                background: "#f43f5e",
                color: "#fff",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
                padding: "1px 6px",
              })}
            >
              {activeCount}
            </span>
          )}
          <ChevronDown
            size={13}
            className={cssClass({
              color: "#64748b",
              transform: collapsed ? "rotate(-90deg)" : "none",
              transition: "0.15s",
            })}
          />
        </div>
      </button>

      {!collapsed && (
        <div className={cssClass({ paddingBottom: 8 })}>
          {visibleOpts.map((opt) => {
            const sel = sec.selected.has(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const next = new Set(sec.selected);
                  if (next.has(opt.value)) next.delete(opt.value);
                  else next.add(opt.value);
                  sec.onChange(next);
                }}
                className={cssClass({
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 20px",
                  background: sel ? "rgba(244,63,94,0.12)" : "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                })}
              >
                <span className={cssClass({ fontSize: 13, color: sel ? "#f9a8b4" : "#cbd5e1" })}>
                  {opt.label}
                </span>
                <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
                  {opt.count !== undefined && (
                    <span className={cssClass({ fontSize: 11, color: "#475569" })}>
                      {opt.count}
                    </span>
                  )}
                  <span
                    className={cssClass({
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      flexShrink: 0,
                      border: `1.5px solid ${sel ? "#f43f5e" : "#475569"}`,
                      background: sel ? "#f43f5e" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    })}
                  >
                    {sel && <Check size={9} color="#fff" />}
                  </span>
                </div>
              </button>
            );
          })}
          {sec.options.length > SHOW && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className={cssClass({
                padding: "6px 20px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                color: "#64748b",
                fontWeight: 600,
              })}
            >
              {showAll ? "Show less" : `See all (${sec.options.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default FilterSection;

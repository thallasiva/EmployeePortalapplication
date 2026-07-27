import React, { useEffect, useRef, useState } from "react";
import { Filter, X } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import FilterSection from "./FilterSection";

const FilterPanel = React.memo(function FilterPanel({
  open,
  onClose,
  sections,
  activePills,
  activeFilterCount,
  resultCount,
  onClearAll,
}) {
  const [collapsed, setCollapsed] = useState({});
  const ref = useRef(null);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const toggleSection = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        className={cssClass({ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.25)" })}
      />

      <div
        ref={ref}
        className={cssClass({
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 401,
          width: 300,
          background: "#1e293b",
          color: "#e2e8f0",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.25)",
        })}
      >
        {/* Header */}
        <div
          className={cssClass({
            padding: "18px 20px 14px",
            borderBottom: "1px solid #334155",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          })}
        >
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
            <Filter size={14} className={cssClass({ color: "#94a3b8" })} />
            <span
              className={cssClass({
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "#e2e8f0",
                textTransform: "uppercase",
              })}
            >
              Filter
            </span>
          </div>
          <button
            onClick={onClose}
            className={cssClass({
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748b",
              display: "flex",
            })}
          >
            <X size={16} />
          </button>
        </div>

        {/* Active pills */}
        {activePills.length > 0 && (
          <div
            className={cssClass({ padding: "12px 20px", borderBottom: "1px solid #334155" })}
          >
            <div
              className={cssClass({
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              })}
            >
              <span
                className={cssClass({
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                })}
              >
                Active filters
              </span>
              <span className={cssClass({ fontSize: 12, color: "#94a3b8" })}>
                {resultCount} results
              </span>
            </div>
            <div className={cssClass({ display: "flex", flexWrap: "wrap", gap: 6 })}>
              {activePills.map((p) => (
                <span
                  key={p.id}
                  className={cssClass({
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "#f43f5e",
                    color: "#fff",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 10px",
                  })}
                >
                  {p.label}
                  <button
                    onClick={p.remove}
                    className={cssClass({
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#fff",
                      display: "flex",
                      padding: 0,
                    })}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <button
              onClick={onClearAll}
              className={cssClass({
                marginTop: 10,
                fontSize: 12,
                color: "#f43f5e",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: 4,
              })}
            >
              ✕ Clear all filters
            </button>
          </div>
        )}

        {/* Sections */}
        <div className={cssClass({ flex: 1, overflowY: "auto", padding: "8px 0" })}>
          {sections.map((sec) => (
            <FilterSection
              key={sec.id}
              sec={sec}
              collapsed={!!collapsed[sec.id]}
              onToggle={() => toggleSection(sec.id)}
            />
          ))}
        </div>
      </div>
    </>
  );
});

export default FilterPanel;

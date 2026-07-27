import React from "react";
import { Search, ZoomIn, ZoomOut, RotateCcw, Network } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND } from "../constants/palette";
import { fullName } from "../utils/empHelpers";

const OrgToolbar = React.memo(function OrgToolbar({
  manager,
  search,
  onSearch,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}) {
  return (
    <div className={cssClass({
      display: "flex", flexWrap: "wrap", justifyContent: "space-between",
      alignItems: "center", gap: 10, marginBottom: 8, flexShrink: 0,
    })}>
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
        <Network size={20} color={BRAND} />
        <div>
          <h1 className={cssClass({ fontSize: 17, fontWeight: 700, color: "#1f2937", margin: 0 })}>
            Organization Chart
          </h1>
          <p className={cssClass({ fontSize: 12, color: "#64748b", margin: 0 })}>
            {manager
              ? `Your reporting structure under ${fullName(manager)}`
              : "Your reporting structure"}
          </p>
        </div>
      </div>

      <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
        <div className={cssClass({ position: "relative" })}>
          <Search size={13} className={cssClass({
            position: "absolute", left: 9, top: "50%",
            transform: "translateY(-50%)", color: "#94a3b8",
          })} />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search people…"
            className={cssClass({
              height: 32, width: 190, paddingLeft: 28, paddingRight: 10,
              border: "1px solid #dbe2ea", borderRadius: 8, fontSize: 12,
              outline: "none", background: "#fff",
            })}
          />
        </div>

        <div className={cssClass({
          display: "flex", alignItems: "center", gap: 2, background: "#fff",
          border: "1px solid #dbe2ea", borderRadius: 8, height: 32, padding: "0 4px",
        })}>
          <button onClick={onZoomOut} className={cssClass({
            background: "none", border: "none", cursor: "pointer", padding: 4, color: "#64748b", display: "flex",
          })}>
            <ZoomOut size={14} />
          </button>
          <span className={cssClass({ fontSize: 11, color: "#475569", minWidth: 34, textAlign: "center" })}>
            {zoom}%
          </span>
          <button onClick={onZoomIn} className={cssClass({
            background: "none", border: "none", cursor: "pointer", padding: 4, color: "#64748b", display: "flex",
          })}>
            <ZoomIn size={14} />
          </button>
          <button onClick={onZoomReset} className={cssClass({
            background: "none", border: "none", cursor: "pointer", padding: 4,
            color: "#64748b", borderLeft: "1px solid #e2e8f0", marginLeft: 2, display: "flex",
          })}>
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
});

export default OrgToolbar;

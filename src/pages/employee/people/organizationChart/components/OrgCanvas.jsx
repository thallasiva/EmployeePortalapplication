import React from "react";
import { Network, ChevronUp } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND } from "../constants/palette";
import { fullName } from "../utils/empHelpers";
import AncestorChain from "./AncestorChain";
import TeamRow from "./TeamRow";
import SelfRootView from "./SelfRootView";

const OrgCanvas = React.memo(function OrgCanvas({
  loading,
  error,
  selfEmp,
  manager,
  selfDirectReports,
  selfId,
  team,
  visibleAncestors,
  ancestorChain,
  canExpandMore,
  onExpand,
  onCollapse,
  onExpandToOne,
  zoom,
  search,
}) {
  return (
    <div className={cssClass({
      flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "auto", minHeight: 0,
    })}>
      {loading ? (
        <div className={cssClass({ display: "flex", justifyContent: "center", padding: 60, fontSize: 14, color: "#94a3b8" })}>
          Loading hierarchy…
        </div>
      ) : error ? (
        <div className={cssClass({ display: "flex", justifyContent: "center", padding: 60, fontSize: 14, color: "#ef4444" })}>
          {error}
        </div>
      ) : !selfEmp ? (
        <div className={cssClass({ display: "flex", flexDirection: "column", alignItems: "center", padding: 60, gap: 12 })}>
          <Network size={40} strokeWidth={1.2} color="#cbd5e1" />
          <p className={cssClass({ fontSize: 13, color: "#94a3b8" })}>No employee data found.</p>
        </div>
      ) : (
        <div className={cssClass({
          transform: `scale(${zoom / 100})`, transformOrigin: "top center",
          transition: "transform 0.15s ease", padding: "32px 20px 48px",
          display: "flex", flexDirection: "column", alignItems: "center",
        })}>
          {!manager ? (
            <SelfRootView self={selfEmp} directReports={selfDirectReports} search={search} />
          ) : (
            <>
              {visibleAncestors.length > 0 && (
                <AncestorChain
                  ancestors={visibleAncestors}
                  canExpandMore={canExpandMore}
                  onExpand={onExpand}
                  onCollapse={onCollapse}
                  search={search}
                />
              )}

              {visibleAncestors.length === 0 && ancestorChain.length > 0 && (
                <button
                  onClick={onExpandToOne}
                  className={cssClass({
                    marginBottom: 12, display: "flex", alignItems: "center", gap: 6,
                    padding: "5px 16px", borderRadius: 20, border: `1.5px solid ${BRAND}`,
                    background: "#fff8f0", color: BRAND, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                  })}
                >
                  <ChevronUp size={13} />
                  View {fullName(manager)}'s Reporting Manager
                </button>
              )}

              <TeamRow manager={manager} team={team} selfId={selfId} search={search} />
            </>
          )}
        </div>
      )}
    </div>
  );
});

export default OrgCanvas;

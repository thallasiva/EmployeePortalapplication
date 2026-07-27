import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import EmpCard from "./EmpCard";
import VLine from "./VLine";

const AncestorChain = React.memo(function AncestorChain({
  ancestors,
  canExpandMore,
  onExpand,
  onCollapse,
  search,
}) {
  return (
    <div className={cssClass({ display: "flex", flexDirection: "column", alignItems: "center" })}>
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 })}>
        {canExpandMore && (
          <button
            onClick={onExpand}
            title="Expand one more level up"
            className={cssClass({
              width: 26, height: 26, borderRadius: "50%",
              border: "1.5px solid #6366f1", background: "#f5f3ff",
              color: "#6366f1", fontSize: 16, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            })}
          >+</button>
        )}
        <button
          onClick={onCollapse}
          title="Collapse this level"
          className={cssClass({
            width: 26, height: 26, borderRadius: "50%",
            border: "1.5px solid #e2e8f0", background: "#fff",
            color: "#64748b", fontSize: 18, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          })}
        >−</button>
      </div>

      {ancestors.map((anc) => (
        <React.Fragment key={anc.employee_id}>
          <EmpCard emp={anc} search={search} />
          <VLine height={32} />
        </React.Fragment>
      ))}
    </div>
  );
});

export default AncestorChain;

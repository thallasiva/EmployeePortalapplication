import React from "react";
import { Info, Users } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";

const DelegatedToMe = React.memo(function DelegatedToMe({ myId, employees, delegates }) {
  const items = [];

  return (
    <div className={cssClass({ display: "flex", flexDirection: "column", gap: 12 })}>
      <div
        className={cssClass({
          background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10,
          padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
        })}
      >
        <Info size={16} className={cssClass({ color: "#f18200", flexShrink: 0 })} />
        <p className={cssClass({ fontSize: 13, color: "#92400e", margin: 0 })}>
          When a colleague sets you as their delegate, their pending approval requests will appear here.
          You'll also receive a notification.
        </p>
      </div>

      {items.length === 0 ? (
        <div
          className={cssClass({
            background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
            padding: "48px 24px", textAlign: "center",
          })}
        >
          <div
            className={cssClass({
              width: 56, height: 56, borderRadius: "50%", background: "#f8fafc",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
            })}
          >
            <Users size={24} className={cssClass({ color: "#cbd5e1" })} />
          </div>
          <p className={cssClass({ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: "0 0 4px" })}>
            No active delegations
          </p>
          <p className={cssClass({ fontSize: 12, color: "#94a3b8", margin: 0 })}>
            No one has delegated their workflow approvals to you yet.
          </p>
        </div>
      ) : (
        items.map((item, i) => (
          <div key={i} className={cssClass({ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 })}>
            {/* placeholder for future delegation items */}
          </div>
        ))
      )}
    </div>
  );
});

export default DelegatedToMe;

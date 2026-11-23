import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
const EmptyState = React.memo(function EmptyState({
  icon: Icon,
  text
}) {
  return <div className={cssClass({
    textAlign: "center",
    padding: "64px 0",
    color: "#94a3b8"
  })}>
      <div className={cssClass({
      width: 64,
      height: 64,
      borderRadius: "50%",
      background: "#f1f5f9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 16px"
    })}>
        <Icon size={28} color="#cbd5e1" />
      </div>
      <p className={cssClass({
      margin: 0,
      fontSize: 14,
      color: "#64748b"
    })}>{text}</p>
    </div>;
});
export { EmptyState };

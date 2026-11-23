import React from "react";
import { AlertTriangle } from "lucide-react";
import { cssClass } from "../../../../../../utils/classStyles";
import { Req } from "./Req";
const FieldWrap = React.memo(function FieldWrap({
  label,
  required,
  error,
  children,
  hint
}) {
  return <div>
      <label className={cssClass({
      display: "block",
      fontSize: 12,
      fontWeight: 600,
      color: "#374151",
      marginBottom: 5
    })}>
        {label}{required && <Req />}
      </label>
      {children}
      {hint && !error && <p className={cssClass({
      margin: "4px 0 0",
      fontSize: 11,
      color: "#94a3b8"
    })}>{hint}</p>}
      {error && <p className={cssClass({
      margin: "4px 0 0",
      fontSize: 11,
      color: "#ef4444",
      display: "flex",
      alignItems: "center",
      gap: 3
    })}>
          <AlertTriangle size={11} /> {error}
        </p>}
    </div>;
});
export { FieldWrap };

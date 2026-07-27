import { memo } from "react";
import { Check, AlertCircle } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";

const Toast = memo(({ msg, type = "success" }) =>
  msg ? (
    <div className={cssClass({
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      background: type === "success" ? "#16a34a" : "#dc2626",
      color: "#fff", borderRadius: 10, padding: "10px 18px",
      fontSize: 13, fontWeight: 600, boxShadow: "0 4px 16px #0003",
      display: "flex", alignItems: "center", gap: 8,
    })}>
      {type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
      {msg}
    </div>
  ) : null
);

Toast.displayName = "Toast";
export default Toast;

import React from "react";
import { cssClass } from "../../../../../utils/classStyles";

const ToastNotification = React.memo(function ToastNotification({ toast }) {
  if (!toast) return null;
  return (
    <div className={cssClass({
      position: "fixed", top: 20, right: 20, zIndex: 999,
      background: toast.type === "error" ? "#fef2f2" : "#f0fdf4",
      border: `1px solid ${toast.type === "error" ? "#fca5a5" : "#86efac"}`,
      borderRadius: 10, padding: "10px 18px",
      fontSize: 13, fontWeight: 600,
      color: toast.type === "error" ? "#dc2626" : "#15803d",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    })}>
      {toast.msg}
    </div>
  );
});

export default ToastNotification;

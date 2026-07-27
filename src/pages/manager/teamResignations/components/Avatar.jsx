import React from "react";
import { BRAND } from "../constants";
import { cssClass } from "../../../../utils/classStyles";

const Avatar = React.memo(function Avatar({ name, size = 38, color = BRAND }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cssClass({
      width: size, height: size, borderRadius: "50%", background: color,
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: size * 0.35, flexShrink: 0,
    })}>
      {initials}
    </div>
  );
});

export default Avatar;

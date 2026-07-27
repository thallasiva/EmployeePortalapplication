import React from "react";
import { initials } from "../utils";

const Avatar = React.memo(function Avatar({ name, color, size = 40 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `${color}22`,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.34,
        fontWeight: 700,
        flexShrink: 0,
        userSelect: "none",
        border: `2px solid ${color}33`,
      }}
    >
      {initials(name)}
    </div>
  );
});

export default Avatar;

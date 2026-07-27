import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { getInitials, avatarColor } from "../utils";

const Avatar = React.memo(function Avatar({ name, size = 36 }) {
  const bg = avatarColor(name);
  return (
    <span
      className={cssClass({
        width: size,
        height: size,
        background: bg,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.35,
        flexShrink: 0,
      })}
    >
      {getInitials(name)}
    </span>
  );
});

export default Avatar;

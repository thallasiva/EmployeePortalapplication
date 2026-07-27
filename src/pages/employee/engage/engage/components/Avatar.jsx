import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { avatarColor, initials } from "../utils";

const Avatar = React.memo(function Avatar({ name, size = 32 }) {
  const [bg, fg] = avatarColor(name);
  return (
    <div
      className={cssClass({
        width: size, height: size, borderRadius: "50%", background: bg, color: fg,
        fontWeight: 700, fontSize: size * 0.36, display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0, userSelect: "none",
      })}
    >
      {initials(name)}
    </div>
  );
});

export default Avatar;

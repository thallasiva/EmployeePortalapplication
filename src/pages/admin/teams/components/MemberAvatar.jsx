import React from "react";
import { cssClass, joinClasses } from "../../../../utils/classStyles";
import { getAvatarColor, getInitials } from "../utils";

const MemberAvatar = React.memo(function MemberAvatar({ name, size = "sm" }) {
  return (
    <span
      className={joinClasses(
        `teams-avatar teams-avatar--${size}`,
        cssClass({ backgroundColor: getAvatarColor(name) })
      )}
      title={name}
    >
      {getInitials(name)}
    </span>
  );
});

export default MemberAvatar;

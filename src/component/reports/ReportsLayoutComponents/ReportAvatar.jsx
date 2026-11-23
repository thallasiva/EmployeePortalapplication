import React from "react";
import { cssClass, joinClasses } from "../../../utils/classStyles";
import { getInitials, getAvatarColor } from "./shared";
function ReportAvatar({
  name,
  size = "md"
}) {
  return <span className={joinClasses(`report-avatar report-avatar--${size}`, cssClass({
    backgroundColor: getAvatarColor(name)
  }))}>
      {getInitials(name)}
    </span>;
}
export { ReportAvatar };

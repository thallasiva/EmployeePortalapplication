import React from "react";
import { FileSpreadsheet, FileText, Presentation } from "lucide-react";
function DocIcon({
  icon,
  size = 18
}) {
  if (icon === "slides") return <Presentation size={size} />;
  if (icon === "sheet") return <FileSpreadsheet size={size} />;
  return <FileText size={size} />;
}
export { DocIcon };

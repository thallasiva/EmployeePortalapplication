import React from "react";
import { ChevronDown } from "lucide-react";
function ReportPageHeader({
  title
}) {
  return <div className="report-header">
      <div>
        <h1 className="report-header__title">{title}</h1>
      </div>
      <button type="button" className="report-header__export">
        Export
        <span className="report-header__export-arrow"><ChevronDown size={12} /></span>
      </button>
    </div>;
}
export { ReportPageHeader };

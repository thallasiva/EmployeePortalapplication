import React from "react";
import { Plus, Upload } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { YEAR_OPTIONS } from "../constants";
import Btn from "./Btn";

const PageHeader = React.memo(({ year, locationFilter, allLocations, onYearChange, onLocationChange, onAddHoliday, onUploadCSV }) => (
  <div className={cssClass({ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    flexWrap: "wrap", gap: 12, marginBottom: 22 })}>
    <div>
      <h1 className={cssClass({ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827",
        fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", letterSpacing: "-0.025em" })}>
        Time Off &amp; Holidays
      </h1>
      <p className={cssClass({ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" })}>
        Shift-specific holiday calendars · General · Mid · Night · location-wise filter
      </p>
    </div>
    <div className={cssClass({ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" })}>
      <select value={locationFilter} onChange={(e) => onLocationChange(e.target.value)}
        className={cssClass({ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
          fontSize: 13, color: "#374151", minWidth: 160 })}>
        <option value="">All Locations</option>
        {allLocations.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
      <select value={year} onChange={(e) => onYearChange(Number(e.target.value))}
        className={cssClass({ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
          fontSize: 13, color: "#374151" })}>
        {YEAR_OPTIONS.map((y) => <option key={y}>{y}</option>)}
      </select>
      <Btn variant="cancel" onClick={onUploadCSV}>
        <Upload size={14} />Upload CSV
      </Btn>
      <Btn onClick={onAddHoliday}>
        <Plus size={15} />Add Holiday
      </Btn>
    </div>
  </div>
));

PageHeader.displayName = "PageHeader";
export default PageHeader;

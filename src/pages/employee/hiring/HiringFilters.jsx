import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  DATE_ADDED_OPTIONS,
  DEPARTMENTS,
  LOCATIONS,
} from "../../../data/hiringFilters";

function FilterSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="hiring-filter-section">
      <button
        type="button"
        className="hiring-filter-section__head"
        onClick={() => setOpen(!open)}
      >
        {title}
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="hiring-filter-section__body">{children}</div>}
    </div>
  );
}

export default function HiringFilters({
  dateAdded,
  onDateAddedChange,
  departments,
  onDepartmentToggle,
  locations,
  onLocationToggle,
}) {
  const [showAllDepts, setShowAllDepts] = useState(true);
  const visibleDepts = showAllDepts ? DEPARTMENTS : DEPARTMENTS.slice(0, 8);

  return (
    <aside className="hiring-filters">
      <h2 className="hiring-filters__title">Filters</h2>

      <FilterSection title="Date added">
        {DATE_ADDED_OPTIONS.map((opt) => (
          <label key={opt.id} className="hiring-filter-option">
            <input
              type="radio"
              name="dateAdded"
              checked={dateAdded === opt.id}
              onChange={() => onDateAddedChange(opt.id)}
            />
            {opt.label}
          </label>
        ))}
      </FilterSection>

      <FilterSection title="Department">
        {visibleDepts.map((dept) => (
          <label key={dept} className="hiring-filter-option">
            <input
              type="checkbox"
              checked={departments.includes(dept)}
              onChange={() => onDepartmentToggle(dept)}
            />
            {dept}
          </label>
        ))}
        {DEPARTMENTS.length > 8 && (
          <button
            type="button"
            className="hiring-filter-show-less"
            onClick={() => setShowAllDepts(!showAllDepts)}
          >
            {showAllDepts ? "- Show less" : "+ Show more"}
          </button>
        )}
      </FilterSection>

      <FilterSection title="Location">
        {LOCATIONS.map((loc) => (
          <label key={loc} className="hiring-filter-option">
            <input
              type="checkbox"
              checked={locations.includes(loc)}
              onChange={() => onLocationToggle(loc)}
            />
            {loc}
          </label>
        ))}
      </FilterSection>
    </aside>
  );
}

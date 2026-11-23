import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
function FilterSection({
  title,
  defaultOpen = true,
  children
}) {
  const [open, setOpen] = useState(defaultOpen);
  return <div className="hiring-filter-section">
      <button type="button" className="hiring-filter-section__head" onClick={() => setOpen(!open)}>
        {title}
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="hiring-filter-section__body">{children}</div>}
    </div>;
}
export { FilterSection };

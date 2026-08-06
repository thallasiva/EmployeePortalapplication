import React from "react";
import { ChevronRight } from "lucide-react";

const DocNavCard = React.memo(function DocNavCard({ icon, title, onClick, color, bg }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between text-left hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150"
    >
      <span className="inline-flex items-center gap-2.5 text-[13px] font-medium text-gray-700">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: bg || "#f5f3ff" }}
        >
          {icon}
        </span>
        {title}
      </span>
      <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
    </button>
  );
});

export default DocNavCard;

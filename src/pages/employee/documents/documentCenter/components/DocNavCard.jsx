import React from "react";

const DocNavCard = React.memo(function DocNavCard({ icon, title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white border border-[#e8edf3] h-[52px] px-4 flex items-center justify-between text-left hover:shadow-sm">
      <span className="inline-flex items-center gap-2 text-[13px] text-[#2f3a4a]">
        {icon}
        {title}
      </span>
      <span className="text-[12px] text-[#5a78ad]">View All</span>
    </button>
  );
});

export default DocNavCard;

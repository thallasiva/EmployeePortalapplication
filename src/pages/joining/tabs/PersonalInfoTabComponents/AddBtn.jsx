import React from "react";
const AddBtn = ({
  onClick
}) => <button onClick={onClick} type="button" className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 border border-white/30 transition-colors">
    + Add Row
  </button>;
export { AddBtn };

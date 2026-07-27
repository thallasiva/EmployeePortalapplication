import React from "react";

export const EmptyState = React.memo(function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="text-center py-12 px-5 text-gray-400">
      {Icon && <Icon size={40} className="mx-auto mb-3 opacity-40" />}
      <div className="text-[15px] font-semibold text-gray-500 mb-1.5">{title}</div>
      {desc && <div className="text-[13px] mb-4">{desc}</div>}
      {action}
    </div>
  );
});

import React from "react";

export const SectionTitle = React.memo(function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-3.5">
      <h3 className="m-0 text-sm font-bold text-gray-900">{children}</h3>
      {action}
    </div>
  );
});

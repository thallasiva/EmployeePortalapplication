import React from "react";

export const SectionTitle = React.memo(function SectionTitle({ children }) {
  return <h3 className="text-[13px] font-semibold text-[#3a4558] mb-2">{children}</h3>;
});

export const PanelTitle = React.memo(function PanelTitle({ children }) {
  return (
    <h2 className="text-[20px] text-[#3a4558] font-semibold mb-3 border-b border-[#d7deea] pb-2 inline-block">
      {children}
    </h2>
  );
});

import React from "react";
const PanelTitle = React.memo(function PanelTitle({
  children
}) {
  return <h2 className="text-[20px] text-[#3a4558] font-semibold mb-3 border-b border-[#d7deea] pb-2 inline-block">
      {children}
    </h2>;
});
export { PanelTitle };

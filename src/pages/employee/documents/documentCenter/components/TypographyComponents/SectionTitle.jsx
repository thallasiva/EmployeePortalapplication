import React from "react";
const SectionTitle = React.memo(function SectionTitle({
  children
}) {
  return <h3 className="text-[13px] font-semibold text-[#3a4558] mb-2">{children}</h3>;
});
export { SectionTitle };

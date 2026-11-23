import React from "react";
import { SecHdr, NoData } from ".././TablePrimitives";
const SectionC = React.memo(function SectionC({
  open,
  onToggle
}) {
  return <>
      <SecHdr label="C. Perquisites" amount={0} expanded={open} onToggle={onToggle} />
      {open && <NoData />}
    </>;
});
export { SectionC };

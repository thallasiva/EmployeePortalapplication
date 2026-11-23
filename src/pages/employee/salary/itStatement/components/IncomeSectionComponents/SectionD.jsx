import React from "react";
import { SecHdr, NoData } from ".././TablePrimitives";
const SectionD = React.memo(function SectionD({
  open,
  onToggle
}) {
  return <>
      <SecHdr label="D. Income Excluded From Tax" amount={0} expanded={open} onToggle={onToggle} />
      {open && <NoData />}
    </>;
});
export { SectionD };

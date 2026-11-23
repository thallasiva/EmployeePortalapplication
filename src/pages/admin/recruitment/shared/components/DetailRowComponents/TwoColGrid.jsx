import React from "react";
const TwoColGrid = React.memo(function TwoColGrid({
  children
}) {
  return <div className="grid grid-cols-2 gap-x-5">
      {children}
    </div>;
});
export { TwoColGrid };

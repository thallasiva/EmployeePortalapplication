import React from "react";

const Row = React.memo(function Row({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || value === 0 ? value : "—"}</dd>
    </div>
  );
});

export default Row;

import React from "react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND } from "../constants";

const DetailRow = React.memo(function DetailRow({ label, value }) {
  return (
    <div>
      <p className={cssClass({ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: BRAND, textTransform: "uppercase", letterSpacing: "0.05em" })}>{label}</p>
      <p className={cssClass({ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" })}>{value || "—"}</p>
    </div>
  );
});

export default DetailRow;

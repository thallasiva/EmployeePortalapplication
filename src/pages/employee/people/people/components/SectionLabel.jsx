import React from "react";
import { BRAND } from "../constants";

const SectionLabel = React.memo(function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.07em",
        color: BRAND,
        textTransform: "uppercase",
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
});

export default SectionLabel;

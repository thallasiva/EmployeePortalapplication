import React from "react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants";

const Toggle = React.memo(function Toggle({ on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      className={cssClass({
        width: 44, height: 24, borderRadius: 12, cursor: "pointer", position: "relative",
        background: on ? BRAND : "#d1d5db", transition: "background .2s", flexShrink: 0,
      })}
    >
      <div
        className={cssClass({
          position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%",
          background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px #0003",
          left: on ? 22 : 2,
        })}
      />
    </div>
  );
});

export default Toggle;

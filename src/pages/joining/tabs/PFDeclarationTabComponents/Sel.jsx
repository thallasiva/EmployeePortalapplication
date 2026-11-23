import React from "react";
import { inp } from "./shared";
const Sel = ({
  options,
  ...p
}) => <select {...p} className={inp + " font-sans"}>
    <option value="">Select...</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>;
export { Sel };

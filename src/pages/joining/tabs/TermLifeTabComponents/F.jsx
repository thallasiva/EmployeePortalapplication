import React from "react";
import { Label } from "./Label";
const F = ({
  label,
  required,
  full,
  children
}) => <div className={full ? "col-span-2" : ""}>
    {label && <Label required={required}>{label}</Label>}
    {children}
  </div>;
export { F };

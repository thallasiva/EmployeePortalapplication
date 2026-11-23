import React from "react";
import { Label } from "./Label";
function Field({
  label,
  children
}) {
  return <div style={{
    marginBottom: 16
  }}><Label>{label}</Label>{children}</div>;
}
export { Field };

import React from "react";
import { BTN_VARIANT, BTN_SIZE } from "../constants";

export const Btn = React.memo(function Btn({
  children, onClick, variant = "primary", size = "md",
  disabled, type = "button", icon,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-[7px] font-semibold transition-opacity ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } ${BTN_VARIANT[variant] ?? BTN_VARIANT.primary} ${BTN_SIZE[size] ?? BTN_SIZE.md}`}
    >
      {icon && icon}
      {children}
    </button>
  );
});

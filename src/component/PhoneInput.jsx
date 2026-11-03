import React from "react";
import PhoneNumberInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";

export default function PhoneInput({ value = "", onChange, onBlur, style }) {
  const inputStyle = {
    border: "1px solid #d1d5db",
    borderRadius: 7,
    padding: "7px 10px",
    fontSize: 13,
    flex: 1,
    minWidth: 0,
    boxSizing: "border-box",
    outline: "none",
    background: "#fff",
    ...style,
  };

  return (
    <PhoneNumberInput
      aria-label="Mobile number"
      autoComplete="tel"
      defaultCountry="IN"
      flags={flags}
      numberInputProps={{ style: inputStyle }}
      onBlur={onBlur}
      onChange={(nextValue) => onChange(nextValue || "")}
      style={{ width: "100%" }}
      value={value || undefined}
    />
  );
}

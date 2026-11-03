import React, { useState } from "react";

const BANK_NAMES = [
  "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank",
  "Punjab National Bank", "Bank of Baroda", "Canara Bank", "Union Bank of India",
  "Indian Bank", "IndusInd Bank", "Yes Bank",
];

export default function BankNameInput({ value = "", onChange, style }) {
  const [otherSelected, setOtherSelected] = useState(false);
  const isCustomValue = value && !BANK_NAMES.includes(value);
  const showOther = otherSelected || Boolean(isCustomValue);

  return (
    <>
      <select
        value={showOther ? "__other__" : value}
        style={style}
        onChange={(event) => {
          if (event.target.value === "__other__") {
            setOtherSelected(true);
            if (BANK_NAMES.includes(value)) onChange("");
          } else {
            setOtherSelected(false);
            onChange(event.target.value);
          }
        }}
      >
        <option value="">Select a bank</option>
        {BANK_NAMES.map((bank) => <option key={bank} value={bank}>{bank}</option>)}
        <option value="__other__">Other</option>
      </select>
      {showOther && (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          style={style}
          placeholder="Enter bank name"
        />
      )}
    </>
  );
}

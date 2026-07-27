import React from "react";
import { CURRENCIES, RATE_PERIODS } from "../constants/formConstants";

const RateInput = React.memo(function RateInput({
  nameVal, nameCur, namePeriod, val, cur, period, onChange,
}) {
  return (
    <div className="flex overflow-hidden rounded-md border border-gray-300">
      <select
        name={nameCur}
        value={cur}
        onChange={onChange}
        className="shrink-0 cursor-pointer border-0 border-r border-gray-300 bg-gray-50 px-2 text-[13px] outline-none font-inherit"
      >
        {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
      </select>

      <input
        name={nameVal}
        type="number"
        value={val}
        onChange={onChange}
        placeholder="0"
        className="min-w-0 flex-1 border-0 px-2.5 py-2 text-left text-[13px] outline-none font-inherit"
      />

      <select
        name={namePeriod}
        value={period}
        onChange={onChange}
        className="shrink-0 cursor-pointer border-0 border-l border-gray-300 bg-gray-50 px-2 text-xs outline-none font-inherit"
      >
        {RATE_PERIODS.map((p) => <option key={p}>{p}</option>)}
      </select>
    </div>
  );
});

export default RateInput;

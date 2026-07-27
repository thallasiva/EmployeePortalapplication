import React from "react";
import { STEPS } from "../constants";

const StepBar = React.memo(function StepBar({ step }) {
  return (
    <div className="flex items-center justify-center mb-5">
      {STEPS.map((s, i) => {
        const done = step > s.id;
        const active = step === s.id;
        return (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${done || active ? "bg-[#f18200]" : "bg-gray-300"}`}>
                {done ? "✓" : s.id}
              </div>
              <span className={`text-[11px] whitespace-nowrap ${active ? "font-bold text-gray-900" : "font-medium text-gray-400"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 &&
              <div className={`h-0.5 w-[60px] mx-1 flex-shrink-0 -mt-3.5 ${step > s.id ? "bg-[#f18200]" : "bg-gray-200"}`} />
            }
          </React.Fragment>
        );
      })}
    </div>
  );
});

export default StepBar;

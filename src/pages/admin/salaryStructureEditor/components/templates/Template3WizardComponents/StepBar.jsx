import React from "react";
import { Check } from "lucide-react";
import { AMBER, WIZARD_STEPS } from "./shared";
// ─── Step progress bar ────────────────────────────────────────────────────────
function StepBar({
  currentStep,
  onStep
}) {
  return <div className="flex items-center justify-center gap-0 py-4 px-6 bg-white border-b border-gray-200">
      {WIZARD_STEPS.map((step, idx) => {
      const isActive = step.id === currentStep;
      const isCompleted = step.id < currentStep;
      const isLast = idx === WIZARD_STEPS.length - 1;
      return <React.Fragment key={step.id}>
            <button onClick={() => onStep(step.id)} className="flex flex-col items-center gap-1 group min-w-max px-2">
              {/* Circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${isCompleted ? "bg-green-500 border-green-500 text-white" : isActive ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-400"}`} style={isActive ? {
            backgroundColor: AMBER,
            borderColor: AMBER
          } : {}}>
                {isCompleted ? <Check size={14} /> : step.id}
              </div>
              {/* Label */}
              <span className={`text-[10px] font-medium whitespace-nowrap ${isActive ? "font-bold" : isCompleted ? "text-green-600" : "text-gray-400"}`} style={isActive ? {
            color: AMBER
          } : {}}>
                {step.label}
              </span>
            </button>
            {!isLast && <div className={`h-0.5 w-8 mt-[-12px] transition-colors ${isCompleted ? "bg-green-400" : "bg-gray-200"}`} />}
          </React.Fragment>;
    })}
    </div>;
}
// ─── Donut chart ──────────────────────────────────────────────────────────────
export { StepBar };

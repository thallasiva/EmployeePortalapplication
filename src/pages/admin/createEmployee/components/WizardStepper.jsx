import React from "react";
import { Check } from "lucide-react";
import { STEPS } from "../constants";

const WizardStepper = React.memo(function WizardStepper({ step }) {
  return (
    <div className="emp-stepper">
      {STEPS.map((s, idx) => (
        <React.Fragment key={s.id}>
          <div className="emp-stepper__item">
            <span
              className={`emp-stepper__circle ${
                step > s.id ? "is-done" : step === s.id ? "is-active" : ""
              }`}
            >
              {step > s.id ? <Check size={14} /> : s.id + 1}
            </span>
            <span className={`emp-stepper__label ${step === s.id ? "is-active" : ""}`}>
              {s.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`emp-stepper__line ${step > s.id ? "is-done" : ""}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
});

export default WizardStepper;

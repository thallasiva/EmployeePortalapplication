import React from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { STEPS } from "../constants";

const WizardFooter = React.memo(function WizardFooter({
  step,
  submitting,
  onPrev,
  onNext,
  onSubmit,
  onCancel,
}) {
  return (
    <div className="emp-wizard__footer">
      {step > 0 ? (
        <button
          type="button"
          className="emp-wizard__btn emp-wizard__btn--prev"
          onClick={onPrev}
        >
          <ChevronLeft size={16} />
          Previous
        </button>
      ) : (
        <span />
      )}
      <div className="emp-wizard__footer-right">
        <button
          type="button"
          className="emp-wizard__btn emp-wizard__btn--cancel"
          onClick={onCancel}
        >
          Cancel
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="emp-wizard__btn emp-wizard__btn--next"
            onClick={onNext}
          >
            Next
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="emp-wizard__btn emp-wizard__btn--create disabled:opacity-60"
            onClick={onSubmit}
            disabled={submitting}
          >
            <Check size={16} />
            {submitting ? "Creating..." : "Create Employee"}
          </button>
        )}
      </div>
    </div>
  );
});

export default WizardFooter;

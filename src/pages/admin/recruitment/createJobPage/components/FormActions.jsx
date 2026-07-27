import React from "react";

const FormActions = React.memo(function FormActions({ isValid, submitting, onReset }) {
  return (
    <div className="mt-1 flex justify-end gap-3 border-t border-[#f0f0f0] pt-4">
      <button
        type="button"
        onClick={onReset}
        className="cursor-pointer rounded-md border border-gray-300 bg-white px-8 py-[9px] text-sm font-semibold text-gray-700"
      >
        Reset
      </button>
      <button
        type="submit"
        disabled={!isValid || submitting}
        className={`rounded-md px-8 py-[9px] text-sm font-semibold text-white ${
          isValid && !submitting ? "cursor-pointer bg-[#f18200]" : "cursor-not-allowed bg-gray-300"
        }`}
      >
        {submitting ? "Submitting…" : "Submit Job Requirement"}
      </button>
    </div>
  );
});

export default FormActions;

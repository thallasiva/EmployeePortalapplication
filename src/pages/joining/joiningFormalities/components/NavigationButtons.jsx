import React from "react";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { TABS } from "../constants";

const NavigationButtons = React.memo(function NavigationButtons({
  tab,
  saving,
  goTo,
  handleSubmit
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      <button
        onClick={() => goTo(tab - 1)}
        disabled={tab === 0}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-[#d97706] bg-white border border-[#d97706] hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
      >
        <ChevronLeft size={15} /> Previous
      </button>
      {tab < TABS.length - 1 ? (
        <button
          onClick={() => goTo(tab + 1)}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-[13px] font-medium text-white shadow-sm"
        >
          Save &amp; Continue <ChevronRight size={15} />
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-2 text-[13px] font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Submitting..." : "Submit Formalities"}
          <CheckCircle size={15} />
        </button>
      )}
    </div>
  );
});

export default NavigationButtons;

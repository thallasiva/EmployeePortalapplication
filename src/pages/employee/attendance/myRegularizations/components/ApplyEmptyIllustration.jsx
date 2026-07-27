import React from "react";
import { Calendar } from "lucide-react";

const ApplyEmptyIllustration = React.memo(function ApplyEmptyIllustration() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[280px] py-12">
      <Calendar size={56} strokeWidth={1} className="text-slate-300 mb-4" />
      <p className="text-sm text-slate-400">Select date to start regularizing</p>
    </div>
  );
});

export default ApplyEmptyIllustration;

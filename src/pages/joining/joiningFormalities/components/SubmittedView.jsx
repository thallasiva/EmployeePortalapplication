import React from "react";
import { CheckCircle } from "lucide-react";

const SubmittedView = React.memo(function SubmittedView({ inv }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <CheckCircle size={52} className="text-emerald-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">Formalities Submitted!</h1>
        <p className="text-gray-500 text-sm">
          Thank you, <strong>{inv?.candidate_name || "Candidate"}</strong>! Your joining
          formalities have been submitted and are pending HR verification.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white">
          <CheckCircle size={14} /> Submitted Successfully
        </div>
      </div>
    </div>
  );
});

export default SubmittedView;

import React from "react";
import { XCircle } from "lucide-react";

const ErrorView = React.memo(function ErrorView({ error }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <XCircle size={52} className="text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">Link Invalid or Expired</h1>
        <p className="text-gray-500 text-sm">{error}</p>
        <p className="text-gray-400 text-xs mt-4">Please contact HR for a new invitation link.</p>
      </div>
    </div>
  );
});

export default ErrorView;

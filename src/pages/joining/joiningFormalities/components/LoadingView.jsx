import React from "react";

const LoadingView = React.memo(function LoadingView() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Verifying your invitation...</p>
      </div>
    </div>
  );
});

export default LoadingView;

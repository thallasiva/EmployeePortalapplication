import React from "react";
import { History } from "lucide-react";

const HistoryTab = React.memo(function HistoryTab() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-gray-400">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <History size={24} className="text-gray-300" />
      </div>
      <p className="text-sm font-medium text-gray-500">Version History</p>
      <p className="text-xs text-gray-300 mt-1">Saved revisions will appear here.</p>
    </div>
  );
});

export default HistoryTab;

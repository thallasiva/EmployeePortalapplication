import React from "react";
import { FlaskConical } from "lucide-react";

const PlaceholderTab = React.memo(function PlaceholderTab({ title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-gray-400">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <FlaskConical size={24} className="text-gray-300" />
      </div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-xs text-gray-300 mt-1">{sub || "Coming soon."}</p>
    </div>
  );
});

export default PlaceholderTab;

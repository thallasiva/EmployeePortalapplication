import React from "react";
const EmptyState = ({
  icon,
  title,
  text,
  action
}) => <div className="flex flex-col items-center text-center py-12 px-4">
    <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-3">{icon}</div>
    <p className="text-sm font-bold text-slate-800">{title}</p>
    {text && <p className="text-sm text-slate-500 mt-1 max-w-sm">{text}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>;
export { EmptyState };

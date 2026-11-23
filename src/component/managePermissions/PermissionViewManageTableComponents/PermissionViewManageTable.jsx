import React from 'react';
import { ToggleSwitch } from "./ToggleSwitch";
const PermissionViewManageTable = ({
  rows,
  values,
  onToggle
}) => {
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-[1.8fr_180px_180px] border-b border-slate-200 bg-white">
        <div className="px-5 py-3 text-sm font-semibold text-slate-800">Rule Description</div>
        <div className="px-5 py-3 text-center text-sm font-semibold text-slate-800">View</div>
        <div className="px-5 py-3 text-center text-sm font-semibold text-slate-800">Manage</div>
      </div>
      {rows.map((row, index) => <div key={row.key} className={`grid grid-cols-[1.8fr_180px_180px] items-center ${index !== rows.length - 1 ? 'border-b border-slate-200' : ''}`}>
          <div className="px-5 py-4">
            <p className="text-sm font-medium text-slate-800">{row.label}</p>
            <p className="text-xs text-slate-500">{row.description}</p>
          </div>
          <div className="flex justify-center px-5 py-4">
            <ToggleSwitch enabled={values[row.key].view} onToggle={() => onToggle(row.key, 'view')} />
          </div>
          <div className="flex justify-center px-5 py-4">
            <ToggleSwitch enabled={values[row.key].manage} onToggle={() => onToggle(row.key, 'manage')} />
          </div>
        </div>)}
    </div>;
};
export { PermissionViewManageTable };

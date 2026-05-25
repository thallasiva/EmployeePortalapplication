import React from 'react';

const ToggleSwitch = ({ enabled, onToggle }) =>
{
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className={`relative h-6 w-11 rounded-full transition ${enabled ? 'bg-brand' : 'bg-slate-300'}`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${enabled ? 'right-1' : 'left-1'}`}
      />
    </button>
  );
};

const PermissionAllowTable = ({ rows, values, onToggle }) =>
{
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-[1.8fr_180px] border-b border-slate-200 bg-white">
        <div className="px-5 py-3 text-sm font-semibold text-slate-800">Rule Description</div>
        <div className="px-5 py-3 text-center text-sm font-semibold text-slate-800">Allow?</div>
      </div>

      {rows.map((row, index) => (
        <div
          key={row.key}
          className={`grid grid-cols-[1.8fr_180px] items-center ${index !== rows.length - 1 ? 'border-b border-slate-200' : ''}`}
        >
          <div className="px-5 py-4">
            <p className="text-sm font-medium text-slate-800">{row.label}</p>
            <p className="text-xs text-slate-500">{row.description}</p>
          </div>

          <div className="flex justify-center px-5 py-4">
            <ToggleSwitch
              enabled={values[row.key]}
              onToggle={() => onToggle(row.key)}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default PermissionAllowTable;

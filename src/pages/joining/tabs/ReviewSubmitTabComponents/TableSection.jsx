import React from "react";
const TableSection = ({
  title,
  rows,
  cols
}) => rows && rows.length > 0 && <div className="mb-6">
    <h3 className="text-[13px] font-bold text-amber-800 uppercase tracking-wide border-b border-amber-200 pb-1 mb-3">{title}</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-[12px] border-collapse">
        <thead>
          <tr className="bg-amber-50">
            {cols.map(c => <th key={c.key} className="text-left px-3 py-2 font-semibold text-amber-800 border border-amber-100">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => <tr key={i} className="border-b border-gray-100">
              {cols.map(c => <td key={c.key} className="px-3 py-2 text-gray-700 border border-gray-100">{row[c.key] || "—"}</td>)}
            </tr>)}
        </tbody>
      </table>
    </div>
  </div>;
export { TableSection };

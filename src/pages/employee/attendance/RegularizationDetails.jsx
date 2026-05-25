import React from "react";
import { ChevronLeft } from "lucide-react";

export default function RegularizationDetails({ record, onBack }) {
  if (!record) return null;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-sky-600 hover:text-sky-700 font-medium"
      >
        <ChevronLeft size={16} />
        Back to History
      </button>

      <div className="bg-white border border-sky-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p className="text-sm text-slate-600">
            Regularization by{" "}
            <span className="font-semibold text-slate-800">
              {record.regularizedBy}
            </span>
          </p>
          <span className="text-xs font-semibold text-slate-400 tracking-wide">
            {record.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-amber-50/80 border-b border-amber-100">
          <div className="px-4 py-3 bg-amber-50/90">
            <p className="text-xs text-slate-500">Remarks</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              {record.remarks}
            </p>
          </div>
          <div className="px-4 py-3 bg-amber-50/90 border-t sm:border-t-0 sm:border-l border-amber-100">
            <p className="text-xs text-slate-500">No. of days</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              {record.days}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-3">
          <h3 className="text-sm font-medium text-slate-700">
            Date applied for regularization
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-sky-50 text-slate-600 text-left">
                  {[
                    "Date",
                    "Approve/Reject",
                    "Approver Remarks",
                    "Shift",
                    "First In Time",
                    "Last Out Time",
                    "Reason",
                  ].map((h) => (
                    <th key={h} className="px-3 py-2.5 font-semibold border-b border-slate-200 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {record.rows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2.5 text-slate-800">{row.date}</td>
                    <td className="px-3 py-2.5 font-semibold text-emerald-600">
                      {row.decision}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{row.approverRemarks}</td>
                    <td className="px-3 py-2.5 text-slate-700">{row.shift}</td>
                    <td className="px-3 py-2.5">{row.firstIn}</td>
                    <td className="px-3 py-2.5">{row.lastOut}</td>
                    <td className="px-3 py-2.5 text-slate-700">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              Application Timeline
            </h3>
            <ul className="relative pl-4 space-y-6">
              <span className="absolute left-[7px] top-2 bottom-2 w-px bg-sky-200" />
              {record.timeline.map((step, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-4 top-1.5 w-3 h-3 rounded-full bg-sky-500 ring-4 ring-white" />
                  <p className="text-sm font-medium text-slate-800">{step.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{step.time}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

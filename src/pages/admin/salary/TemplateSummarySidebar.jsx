import React from "react";
import { fmtINR } from "./salaryHelpers";

export default function TemplateSummarySidebar({ lines, previewCtc, onCtcChange, computed }) {
  const components = computed?.components ?? [];
  const earnings = components.filter((c) => c.category === "Earning");
  const deductions = components.filter((c) => c.category === "Deduction");
  const employer = components.filter((c) => c.category === "Employer Contribution");

  const fixedEarnings = earnings.filter((e) => (e.frequency || "Monthly") === "Monthly");
  const variableEarnings = earnings.filter((e) => (e.frequency || "Monthly") !== "Monthly");

  const totalFixed = fixedEarnings.reduce((s, c) => s + (c.monthly_amount || 0), 0);
  const totalVarMon = variableEarnings.reduce((s, c) => s + Math.round((c.annual_amount || 0) / 12), 0);
  const grossMonthly = totalFixed + totalVarMon;
  const totalDeduct = deductions.reduce((s, c) => s + (c.monthly_amount || 0), 0);
  const net = Math.max(0, grossMonthly - totalDeduct);

  return (
    <div className="w-72 shrink-0 border-l border-gray-200 bg-gray-50 flex flex-col overflow-hidden">
      {}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <p className="text-xs font-semibold text-gray-700 mb-2">Template Summary (Monthly)</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 shrink-0">Preview CTC</span>
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
            <input
              type="number" value={previewCtc}
              onChange={(e) => onCtcChange(Number(e.target.value))}
              className="w-full pl-5 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-indigo-300" />

          </div>
          <span className="text-[10px] text-gray-400 shrink-0">/mo</span>
        </div>
        {previewCtc > 0 &&
        <p className="text-[10px] text-gray-400 mt-1">Annual: ₹{(previewCtc * 12).toLocaleString("en-IN")}</p>
        }
      </div>

      {}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {}
        <div className="space-y-2">
          {[
          ["Total Fixed Pay", totalFixed, "text-gray-800"],
          ["Variable Pay (Monthly Equiv.)", totalVarMon, "text-gray-800"]].
          map(([label, val, cls]) =>
          <div key={label} className="flex justify-between text-xs">
              <span className="text-gray-500">{label}</span>
              <span className={`font-medium ${cls}`}>{fmtINR(val)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200">
            <span className="text-gray-700">Gross Salary</span>
            <span className="text-gray-900">{fmtINR(grossMonthly)}</span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Total Deductions</span>
            <span className="font-medium text-red-600">{fmtINR(totalDeduct)}</span>
          </div>

          <div className="flex justify-between text-sm font-bold pt-2 border-t-2 border-green-200">
            <span className="text-green-800">Net Salary (Take Home)</span>
            <span className="text-green-600">{fmtINR(net)}</span>
          </div>
        </div>

        {}
        <div className="border border-blue-200 rounded-xl bg-blue-50 p-3 space-y-2 mt-3">
          <p className="text-[11px] font-semibold text-blue-800 mb-2">CTC Summary (Annual)</p>
          {[
          ["Total Fixed Pay (Annual)", totalFixed * 12],
          ["Total Variable Pay (Annual)", variableEarnings.reduce((s, c) => s + (c.annual_amount || 0), 0)],
          ["Employer Contributions (Annual)", employer.reduce((s, c) => s + (c.annual_amount || 0), 0)]].
          map(([label, val]) =>
          <div key={label} className="flex justify-between text-xs">
              <span className="text-blue-700">{label}</span>
              <span className="font-medium text-blue-900">{fmtINR(val)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold pt-2 border-t border-blue-200 text-blue-900">
            <span>Total CTC (Annual)</span>
            <span>{fmtINR(previewCtc * 12)}</span>
          </div>
        </div>

        {}
        {lines &&
        <div className="text-[11px] text-gray-400 space-y-1 pt-1 border-t border-gray-100">
            {[
          ["Earning components", lines.filter((l) => l.category === "Earning").length],
          ["Deduction components", lines.filter((l) => l.category === "Deduction").length],
          ["Employer components", lines.filter((l) => l.category === "Employer Contribution").length]].
          map(([label, count]) =>
          <div key={label} className="flex justify-between">
                <span>{label}</span>
                <span className="font-medium text-gray-600">{count}</span>
              </div>
          )}
          </div>
        }
      </div>
    </div>);

}

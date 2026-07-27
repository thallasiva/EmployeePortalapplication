import React from "react";
import { Mail, X } from "lucide-react";
import { MONTH_OPTIONS } from "../constants/payslipOptions";

const GenerateAllResultModal = React.memo(function GenerateAllResultModal({ result, onClose }) {
  if (!result) return null;
  const { month, year, generated, emailed, results = [] } = result;
  const monthLabel = MONTH_OPTIONS.find((m) => m.value === Number(month))?.label || month;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="font-semibold text-gray-900">
            Payslips generated for {monthLabel} {year}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-gray-600 mb-3">
            Generated <strong>{generated}</strong> payslip(s), emailed <strong>{emailed}</strong> of them.
          </p>
          <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-3 py-2">Employee</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((r) => (
                  <tr key={r.employee_id}>
                    <td className="px-3 py-2">
                      {r.employee_name} <span className="text-gray-400">({r.emp_code})</span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{r.email}</td>
                    <td className="px-3 py-2">
                      {r.emailed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                          <Mail size={14} /> Sent
                        </span>
                      ) : (
                        <span className="text-rose-600 font-medium" title={r.error}>
                          Not sent{r.error ? `: ${r.error}` : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

export default GenerateAllResultModal;

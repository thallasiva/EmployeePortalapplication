import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getAssignmentHistory } from "../../../api/salaryAssignment.api";
import { apiErrorToast } from "../../../utils/ToastControllers";
function HistoryPanel({
  employeeId,
  onClose
}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getAssignmentHistory(employeeId).then(h => setHistory(h ?? [])).catch(err => apiErrorToast(err, "load salary history")).finally(() => setLoading(false));
  }, [employeeId]);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="text-base font-semibold text-gray-800">Salary Revision History</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={15} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          {loading ? <p className="text-sm text-gray-400 text-center py-8">Loading…</p> : history.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No revision history found.</p> : <div className="space-y-3">
              {history.map((h, i) => <div key={h.assignment_id} className={`rounded-xl border px-4 py-3 ${h.is_active ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">{h.structure_name}</span>
                    {h.is_active && <span className="text-[10px] bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">Active</span>}
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <p>CTC: <b className="text-gray-700">₹{Number(h.ctc_annual).toLocaleString("en-IN")}/year</b> · ₹{Number(h.ctc_monthly).toLocaleString("en-IN")}/month</p>
                    <p>From: <b>{h.effective_from?.slice(0, 10)}</b>{h.effective_to ? ` – ${h.effective_to.slice(0, 10)}` : ' – Present'}</p>
                  </div>
                </div>)}
            </div>}
        </div>
      </div>
    </div>;
}
export { HistoryPanel };

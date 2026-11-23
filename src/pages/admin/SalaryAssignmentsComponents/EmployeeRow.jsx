import React, { useState } from "react";
import { Clock } from "lucide-react";
import { assignSalaryStructure } from "../../../api/salaryAssignment.api";
import { apiErrorToast, successToast } from "../../../utils/ToastControllers";
import { fmt } from "./shared";
import { AssignModal } from "./AssignModal";
import { HistoryPanel } from "./HistoryPanel";
function EmployeeRow({
  emp,
  structures,
  onAssigned
}) {
  const [open, setOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const handleSave = async (empId, data) => {
    setSaving(true);
    try {
      await assignSalaryStructure(empId, data);
      successToast("Salary structure assigned");
      setOpen(false);
      onAssigned();
    } catch (err) {
      apiErrorToast(err, "assign salary structure");
    } finally {
      setSaving(false);
    }
  };
  return <>
      <tr className="border-t border-gray-100 hover:bg-gray-50">
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-gray-800">{emp.employee_name}</p>
          <p className="text-[11px] text-gray-400">{emp.emp_code}</p>
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">{emp.designation_name || "—"}</td>
        <td className="px-4 py-3 text-xs text-gray-500">{emp.department_name || "—"}</td>
        <td className="px-4 py-3">
          {emp.structure_name ? <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">{emp.structure_name}</span> : <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Not assigned</span>}
        </td>
        <td className="px-4 py-3">
          {emp.ctc_annual ? <div>
                <p className="text-sm font-medium text-gray-700">{fmt(emp.ctc_annual / 12)}<span className="text-[10px] text-gray-400">/mo</span></p>
                <p className="text-[11px] text-gray-400">{fmt(emp.ctc_annual)}/yr</p>
              </div> : <span className="text-gray-400 text-xs">—</span>}
        </td>
        <td className="px-4 py-3 text-xs text-gray-400">{emp.effective_from?.slice(0, 10) || "—"}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setOpen(true)} className="text-[11px] bg-[#e87500] text-white px-2.5 py-1 rounded-lg hover:bg-[#7c3d00]">
              {emp.structure_id ? "Revise" : "Assign"}
            </button>
            {emp.structure_id && <button onClick={() => setHistOpen(true)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50">
                <Clock size={13} />
              </button>}
          </div>
        </td>
      </tr>
      {open && <AssignModal employee={emp} structures={structures} onSave={handleSave} onClose={() => setOpen(false)} saving={saving} />}
      {histOpen && <HistoryPanel employeeId={emp.employee_id} onClose={() => setHistOpen(false)} />}
    </>;
}
export { EmployeeRow };

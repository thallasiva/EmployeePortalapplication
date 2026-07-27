import React, { useEffect, useState, useCallback } from "react";
import Pagination, { usePagination } from "../../components/Pagination";
import { Search, X, ChevronDown, ChevronUp, Clock, CheckCircle } from "lucide-react";
import { listSalaryAssignments, assignSalaryStructure, getAssignmentHistory } from "../../api/salaryAssignment.api";
import { listStructures } from "../../api/salaryComponent.api";
import { successToast, errorToast } from "../../utils/ToastControllers";
import { getErrorMessage } from "../../api/client";

const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400";
const sel = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white";

function fmt(n) {
  if (!n) return "—";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}


function AssignModal({ employee, structures, onSave, onClose, saving }) {
  const cur = employee;
  const [structureId, setStructId] = useState(cur.structure_id ? String(cur.structure_id) : "");
  const [ctcMonthly, setCtcMonthly] = useState(cur.ctc_annual ? String(Math.round(cur.ctc_annual / 12)) : "");
  const [effectiveFrom, setEffDate] = useState(new Date().toISOString().slice(0, 10));

  const ctcAnnual = Number(ctcMonthly) * 12;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-base font-semibold text-gray-800">Assign Salary Structure</p>
            <p className="text-xs text-gray-400 mt-0.5">{employee.employee_name} · {employee.emp_code}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={15} /></button>
        </div>
        <form onSubmit={(e) => {e.preventDefault();onSave(employee.employee_id, { structure_id: structureId, ctc_annual: ctcAnnual, effective_from: effectiveFrom });}}
        className="px-5 py-4 space-y-4">

          <div>
            <label className="block text-xs text-gray-500 mb-1">Salary Structure *</label>
            <select required value={structureId} onChange={(e) => setStructId(e.target.value)} className={sel}>
              <option value="">— Select structure —</option>
              {structures.map((s) =>
              <option key={s.structure_id} value={s.structure_id}>
                  {s.structure_name}{s.is_default ? " (Default)" : ""}
                </option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">CTC (Monthly) *</label>
            <input required type="number" min={1000} value={ctcMonthly}
            onChange={(e) => setCtcMonthly(e.target.value)} className={inp} placeholder="e.g. 50000" />
            {ctcMonthly && Number(ctcMonthly) > 0 &&
            <p className="text-[11px] text-indigo-600 mt-0.5">
                Annual: ₹{ctcAnnual.toLocaleString("en-IN")}
              </p>
            }
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Effective From *</label>
            <input required type="date" value={effectiveFrom} onChange={(e) => setEffDate(e.target.value)} className={inp} />
          </div>

          {cur.structure_id &&
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[12px] text-amber-700">
              Current: <b>{cur.structure_name}</b> · {fmt(cur.ctc_annual)}/year — will be replaced from {effectiveFrom}
            </div>
          }

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-[#1e3a5f] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#16304f] disabled:opacity-60">
              {saving ? "Saving…" : "Assign Structure"}
            </button>
          </div>
        </form>
      </div>
    </div>);

}


function HistoryPanel({ employeeId, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAssignmentHistory(employeeId).
    then((h) => setHistory(h ?? [])).
    catch(() => errorToast("Failed to load history")).
    finally(() => setLoading(false));
  }, [employeeId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="text-base font-semibold text-gray-800">Salary Revision History</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={15} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          {loading ?
          <p className="text-sm text-gray-400 text-center py-8">Loading…</p> :
          history.length === 0 ?
          <p className="text-sm text-gray-400 text-center py-8">No revision history found.</p> :

          <div className="space-y-3">
              {history.map((h, i) =>
            <div key={h.assignment_id} className={`rounded-xl border px-4 py-3 ${h.is_active ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">{h.structure_name}</span>
                    {h.is_active && <span className="text-[10px] bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">Active</span>}
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <p>CTC: <b className="text-gray-700">₹{Number(h.ctc_annual).toLocaleString("en-IN")}/year</b> · ₹{Number(h.ctc_monthly).toLocaleString("en-IN")}/month</p>
                    <p>From: <b>{h.effective_from?.slice(0, 10)}</b>{h.effective_to ? ` → ${h.effective_to.slice(0, 10)}` : ' → Present'}</p>
                  </div>
                </div>
            )}
            </div>
          }
        </div>
      </div>
    </div>);

}


function EmployeeRow({ emp, structures, onAssigned }) {
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
      errorToast(getErrorMessage(err, "Failed to assign"));
    } finally {setSaving(false);}
  };

  return (
    <>
      <tr className="border-t border-gray-100 hover:bg-gray-50">
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-gray-800">{emp.employee_name}</p>
          <p className="text-[11px] text-gray-400">{emp.emp_code}</p>
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">{emp.designation_name || "—"}</td>
        <td className="px-4 py-3 text-xs text-gray-500">{emp.department_name || "—"}</td>
        <td className="px-4 py-3">
          {emp.structure_name ?
          <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">{emp.structure_name}</span> :
          <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Not assigned</span>
          }
        </td>
        <td className="px-4 py-3">
          {emp.ctc_annual ?
          <div>
                <p className="text-sm font-medium text-gray-700">{fmt(emp.ctc_annual / 12)}<span className="text-[10px] text-gray-400">/mo</span></p>
                <p className="text-[11px] text-gray-400">{fmt(emp.ctc_annual)}/yr</p>
              </div> :
          <span className="text-gray-400 text-xs">—</span>
          }
        </td>
        <td className="px-4 py-3 text-xs text-gray-400">{emp.effective_from?.slice(0, 10) || "—"}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setOpen(true)}
            className="text-[11px] bg-[#1e3a5f] text-white px-2.5 py-1 rounded-lg hover:bg-[#16304f]">
              {emp.structure_id ? "Revise" : "Assign"}
            </button>
            {emp.structure_id &&
            <button onClick={() => setHistOpen(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50">
                <Clock size={13} />
              </button>
            }
          </div>
        </td>
      </tr>

      {open &&
      <AssignModal employee={emp} structures={structures}
      onSave={handleSave} onClose={() => setOpen(false)} saving={saving} />
      }
      {histOpen &&
      <HistoryPanel employeeId={emp.employee_id} onClose={() => setHistOpen(false)} />
      }
    </>);

}


export default function SalaryAssignmentsPage() {
  const [employees, setEmployees] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [emps, structs] = await Promise.all([
      listSalaryAssignments({ search: search || null }),
      listStructures()]
      );
      setEmployees(emps ?? []);
      setStructures(structs ?? []);
    } catch {errorToast("Failed to load");} finally
    {setLoading(false);}
  }, [search]);

  useEffect(() => {load();}, [load]);

  const filtered = employees.filter((e) => {
    if (filterStatus === "assigned" && !e.structure_id) return false;
    if (filterStatus === "unassigned" && e.structure_id) return false;
    return true;
  });

  const { paged, page, setPage, totalPages, from, to, total, pageSize, setPageSize } = usePagination(filtered);

  const assignedCount = employees.filter((e) => e.structure_id).length;
  const unassignedCount = employees.length - assignedCount;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Salary Structure Assignments</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {assignedCount} assigned · <span className="text-amber-500">{unassignedCount} pending</span>
          </p>
        </div>
      </div>

      {}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employee or code…"
          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none" />
        </div>
        {["all", "assigned", "unassigned"].map((v) =>
        <button key={v} onClick={() => setFilter(v)}
        className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
        filterStatus === v ?
        "bg-[#1e3a5f] text-white border-[#1e3a5f]" :
        "border-gray-200 text-gray-500 hover:bg-gray-50"}`
        }>
            {v === "all" ? `All (${employees.length})` : v === "assigned" ? `Assigned (${assignedCount})` : `Unassigned (${unassignedCount})`}
          </button>
        )}
      </div>

      {}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ?
        <div className="text-center py-16 text-sm text-gray-400">Loading…</div> :
        filtered.length === 0 ?
        <div className="text-center py-16 text-sm text-gray-400">No employees found.</div> :

        <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Employee", "Designation", "Department", "Structure", "CTC", "Effective From", "Action"].map((h) =>
                <th key={h} className="px-4 py-2.5 text-left text-[11px] text-gray-400 font-medium">{h}</th>
                )}
                </tr>
              </thead>
              <tbody>
                {paged.map((emp) =>
              <EmployeeRow key={emp.employee_id} emp={emp} structures={structures} onAssigned={load} />
              )}
              </tbody>
            </table>
            <Pagination page={page} setPage={setPage} totalPages={totalPages} from={from} to={to} total={total} pageSize={pageSize} setPageSize={setPageSize} />
          </>
        }
      </div>
    </div>);

}

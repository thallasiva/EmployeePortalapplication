import React, { useEffect, useState, useCallback } from "react";
import Pagination, { usePagination } from "../../../components/Pagination";
import { Search } from "lucide-react";
import { listSalaryAssignments } from "../../../api/salaryAssignment.api";
import { listStructures } from "../../../api/salaryComponent.api";
import { apiErrorToast } from "../../../utils/ToastControllers";
import { EmployeeRow } from "./EmployeeRow";
function SalaryAssignmentsPage() {
  const [employees, setEmployees] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilter] = useState("all");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [emps, structs] = await Promise.all([listSalaryAssignments({
        search: search || null
      }), listStructures()]);
      setEmployees(emps ?? []);
      setStructures(structs ?? []);
    } catch (err) {
      apiErrorToast(err, "load salary data");
    } finally {
      setLoading(false);
    }
  }, [search]);
  useEffect(() => {
    load();
  }, [load]);
  const filtered = employees.filter(e => {
    if (filterStatus === "assigned" && !e.structure_id) return false;
    if (filterStatus === "unassigned" && e.structure_id) return false;
    return true;
  });
  const {
    paged,
    page,
    setPage,
    totalPages,
    from,
    to,
    total,
    pageSize,
    setPageSize
  } = usePagination(filtered);
  const assignedCount = employees.filter(e => e.structure_id).length;
  const unassignedCount = employees.length - assignedCount;
  return <div className="p-6 max-w-6xl mx-auto">
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee or code…" className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none" />
        </div>
        {["all", "assigned", "unassigned"].map(v => <button key={v} onClick={() => setFilter(v)} className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${filterStatus === v ? "bg-[#e87500] text-white border-[#e87500]" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
            {v === "all" ? `All (${employees.length})` : v === "assigned" ? `Assigned (${assignedCount})` : `Unassigned (${unassignedCount})`}
          </button>)}
      </div>
      {}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? <div className="text-center py-16 text-sm text-gray-400">Loading…</div> : filtered.length === 0 ? <div className="text-center py-16 text-sm text-gray-400">No employees found.</div> : <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Employee", "Designation", "Department", "Structure", "CTC", "Effective From", "Action"].map(h => <th key={h} className="px-4 py-2.5 text-left text-[11px] text-gray-400 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {paged.map(emp => <EmployeeRow key={emp.employee_id} emp={emp} structures={structures} onAssigned={load} />)}
              </tbody>
            </table>
            <Pagination page={page} setPage={setPage} totalPages={totalPages} from={from} to={to} total={total} pageSize={pageSize} setPageSize={setPageSize} />
          </>}
      </div>
    </div>;
}
export { SalaryAssignmentsPage };

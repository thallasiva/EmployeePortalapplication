import { useState, useEffect, useCallback, useRef } from "react";
import { getLeaveSummary } from "../../api/leaveRequest.api";
import { getErrorMessage } from "../../api/client";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/**
 * Leave Summary Report
 * ====================
 * HR-style leave ledger showing per employee:
 *  Opening Balance | Eligibility | Availed | Monthly breakdown | Closing Balance
 */
export default function LeaveSummaryReport() {
  const [year, setYear]         = useState(CURRENT_YEAR);
  const [statusFilter, setStatus] = useState("");
  const [search, setSearch]     = useState("");
  const [data, setData]         = useState(null);   // { employees, leaveTypes, months }
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const tableRef                = useRef(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await getLeaveSummary({ year, status: statusFilter || undefined });
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [year, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const employees = (data?.employees || []).filter((e) =>
    !search ||
    e.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.emp_code?.toLowerCase().includes(search.toLowerCase()) ||
    e.department_name?.toLowerCase().includes(search.toLowerCase())
  );

  const leaveTypes = data?.leaveTypes || [];

  // Short code map
  const ltCode = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes("earned"))       return "EL";
    if (n.includes("sick"))         return "SL";
    if (n.includes("casual"))       return "CL";
    if (n.includes("comp"))         return "CO";
    if (n.includes("maternity"))    return "ML";
    if (n.includes("privilege"))    return "PL";
    if (n.includes("restricted"))   return "RH";
    return name.slice(0, 2).toUpperCase();
  };

  const fmt = (v) => (v == null || v === 0 ? "-" : Number(v).toFixed(1).replace(".0", ""));

  const handleExportCSV = () => {
    if (!employees.length) return;
    const rows = [];
    // Header row 1
    const h = ["Emp No","Employee Name","Status","Department","Designation","DOJ"];
    leaveTypes.forEach((lt) => h.push(`Opening ${ltCode(lt.leave_type_name)}`));
    leaveTypes.forEach((lt) => h.push(`Eligibility ${ltCode(lt.leave_type_name)}`));
    leaveTypes.forEach((lt) => h.push(`Availed ${ltCode(lt.leave_type_name)}`));
    MONTH_LABELS.forEach((m) =>
      leaveTypes.forEach((lt) => h.push(`${m} ${ltCode(lt.leave_type_name)}`))
    );
    leaveTypes.forEach((lt) => h.push(`Closing ${ltCode(lt.leave_type_name)}`));
    rows.push(h);

    employees.forEach((emp) => {
      const row = [
        emp.emp_code, emp.employee_name, emp.employee_status,
        emp.department_name, emp.designation_name,
        emp.emp_joining_date ? emp.emp_joining_date.slice(0, 10) : "",
      ];
      const ld = (ltId) => emp.leave_data?.find((d) => d.leave_type_id === ltId) || {};
      leaveTypes.forEach((lt) => row.push(ld(lt.leave_type_id).opening_balance ?? 0));
      leaveTypes.forEach((lt) => row.push(ld(lt.leave_type_id).granted ?? 0));
      leaveTypes.forEach((lt) => row.push(ld(lt.leave_type_id).availed ?? 0));
      MONTH_LABELS.forEach((_, mi) =>
        leaveTypes.forEach((lt) => row.push(ld(lt.leave_type_id).monthly?.[mi] ?? 0))
      );
      leaveTypes.forEach((lt) => row.push(ld(lt.leave_type_id).closing_balance ?? 0));
      rows.push(row);
    });

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `leave_summary_${year}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Leave Summary Report</h1>
          <p className="text-sm text-slate-500">Full year leave ledger for all employees</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="border rounded-lg px-3 py-1.5 text-sm"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <select
            className="border rounded-lg px-3 py-1.5 text-sm"
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Notice">On Notice</option>
          </select>

          <input
            type="text"
            placeholder="Search employee / dept…"
            className="border rounded-lg px-3 py-1.5 text-sm w-52"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            onClick={handleExportCSV}
            disabled={!employees.length}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm border rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            ↓ Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
          Loading leave summary…
        </div>
      ) : (
        <div ref={tableRef} className="overflow-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="text-xs border-collapse min-w-max">
            {/* ════ Group header row ════ */}
            <thead>
              <tr className="bg-slate-700 text-white">
                <th rowSpan={3} className="sticky left-0 z-20 bg-slate-700 px-3 py-2 text-left whitespace-nowrap min-w-[44px]">Emp No</th>
                <th rowSpan={3} className="sticky left-[72px] z-20 bg-slate-700 px-3 py-2 text-left whitespace-nowrap min-w-[160px]">Employee Name</th>
                <th rowSpan={3} className="px-3 py-2 text-left whitespace-nowrap">Status</th>
                <th rowSpan={3} className="px-3 py-2 text-left whitespace-nowrap">Department</th>
                <th rowSpan={3} className="px-3 py-2 text-left whitespace-nowrap">Designation</th>
                <th rowSpan={3} className="px-3 py-2 text-left whitespace-nowrap">DOJ</th>

                {/* Opening Balance */}
                <th colSpan={leaveTypes.length} className="px-3 py-1.5 text-center bg-blue-700 border-x border-blue-500">
                  Opening Balance
                </th>

                {/* Eligibility */}
                <th colSpan={leaveTypes.length} className="px-3 py-1.5 text-center bg-emerald-700 border-x border-emerald-500">
                  Leave Eligibility
                </th>

                {/* Availed */}
                <th colSpan={leaveTypes.length} className="px-3 py-1.5 text-center bg-amber-700 border-x border-amber-500">
                  Leaves Availed
                </th>

                {/* Monthly */}
                {MONTH_LABELS.map((m) => (
                  <th key={m} colSpan={leaveTypes.length} className="px-3 py-1.5 text-center bg-purple-700 border-x border-purple-500 whitespace-nowrap">
                    {m}&apos;{String(year).slice(2)}
                  </th>
                ))}

                {/* Closing */}
                <th colSpan={leaveTypes.length} className="px-3 py-1.5 text-center bg-rose-700 border-x border-rose-500">
                  Closing Balance
                </th>
              </tr>

              {/* ── Leave type sub-headers ── */}
              {[
                { bg: "bg-blue-600",   cols: leaveTypes },
                { bg: "bg-emerald-600", cols: leaveTypes },
                { bg: "bg-amber-600",  cols: leaveTypes },
                ...MONTH_LABELS.map(() => ({ bg: "bg-purple-600", cols: leaveTypes })),
                { bg: "bg-rose-600",   cols: leaveTypes },
              ].map(({ bg, cols }, gi) => (
                gi === 0 ? null : undefined   // rendered together below
              ))}
              <tr>
                {[
                  { bg: "bg-blue-600 border-blue-500" },
                  { bg: "bg-emerald-600 border-emerald-500" },
                  { bg: "bg-amber-600 border-amber-500" },
                  ...MONTH_LABELS.map(() => ({ bg: "bg-purple-600 border-purple-500" })),
                  { bg: "bg-rose-600 border-rose-500" },
                ].map(({ bg }, si) =>
                  leaveTypes.map((lt) => (
                    <th key={`${si}-${lt.leave_type_id}`} className={`${bg} px-2 py-1 text-center font-medium border-x`}>
                      {ltCode(lt.leave_type_name)}
                    </th>
                  ))
                )}
              </tr>
            </thead>

            {/* ════ Body ════ */}
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={999} className="py-12 text-center text-slate-400">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((emp, idx) => {
                  const ld = (ltId) => emp.leave_data?.find((d) => d.leave_type_id === ltId) || {};
                  const rowBg = idx % 2 === 0 ? "bg-white" : "bg-slate-50";
                  return (
                    <tr key={emp.employee_id} className={`${rowBg} hover:bg-blue-50 transition-colors`}>
                      {/* Sticky employee info */}
                      <td className={`sticky left-0 z-10 ${rowBg} px-3 py-2 font-mono text-slate-600 whitespace-nowrap border-b border-slate-100`}>
                        {emp.emp_code || "—"}
                      </td>
                      <td className={`sticky left-[72px] z-10 ${rowBg} px-3 py-2 font-medium text-slate-800 whitespace-nowrap border-b border-slate-100`}>
                        {emp.employee_name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap border-b border-slate-100">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          emp.employee_status === "Active"
                            ? "bg-green-100 text-green-700"
                            : emp.employee_status === "Inactive"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {emp.employee_status}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-600 border-b border-slate-100">{emp.department_name || "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-600 border-b border-slate-100">{emp.designation_name || "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-500 border-b border-slate-100">
                        {emp.emp_joining_date ? emp.emp_joining_date.slice(0, 10) : "—"}
                      </td>

                      {/* Opening */}
                      {leaveTypes.map((lt) => (
                        <td key={`ob-${lt.leave_type_id}`} className="px-2 py-2 text-center text-blue-800 bg-blue-50 border-b border-blue-100 border-x border-blue-100">
                          {fmt(ld(lt.leave_type_id).opening_balance)}
                        </td>
                      ))}

                      {/* Eligibility */}
                      {leaveTypes.map((lt) => (
                        <td key={`gr-${lt.leave_type_id}`} className="px-2 py-2 text-center text-emerald-800 bg-emerald-50 border-b border-emerald-100 border-x border-emerald-100">
                          {fmt(ld(lt.leave_type_id).granted)}
                        </td>
                      ))}

                      {/* Availed */}
                      {leaveTypes.map((lt) => (
                        <td key={`av-${lt.leave_type_id}`} className="px-2 py-2 text-center text-amber-800 bg-amber-50 border-b border-amber-100 border-x border-amber-100">
                          {fmt(ld(lt.leave_type_id).availed)}
                        </td>
                      ))}

                      {/* Monthly */}
                      {MONTH_LABELS.map((_, mi) =>
                        leaveTypes.map((lt) => (
                          <td key={`m${mi}-${lt.leave_type_id}`} className="px-2 py-2 text-center text-purple-800 bg-purple-50 border-b border-purple-100 border-x border-purple-100">
                            {fmt(ld(lt.leave_type_id).monthly?.[mi])}
                          </td>
                        ))
                      )}

                      {/* Closing */}
                      {leaveTypes.map((lt) => (
                        <td key={`cl-${lt.leave_type_id}`} className="px-2 py-2 text-center font-medium text-rose-800 bg-rose-50 border-b border-rose-100 border-x border-rose-100">
                          {fmt(ld(lt.leave_type_id).closing_balance)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* ════ Totals footer ════ */}
            {employees.length > 0 && (
              <tfoot>
                <tr className="bg-slate-800 text-white font-medium">
                  <td className="sticky left-0 z-10 bg-slate-800 px-3 py-2" colSpan={2}>Totals</td>
                  <td colSpan={4} className="px-3 py-2 text-slate-400 text-xs">{employees.length} employees</td>

                  {/* Opening totals */}
                  {leaveTypes.map((lt) => {
                    const total = employees.reduce((s, e) => s + (e.leave_data?.find((d) => d.leave_type_id === lt.leave_type_id)?.opening_balance || 0), 0);
                    return <td key={`tot-ob-${lt.leave_type_id}`} className="px-2 py-2 text-center">{fmt(total)}</td>;
                  })}

                  {/* Eligibility totals */}
                  {leaveTypes.map((lt) => {
                    const total = employees.reduce((s, e) => s + (e.leave_data?.find((d) => d.leave_type_id === lt.leave_type_id)?.granted || 0), 0);
                    return <td key={`tot-gr-${lt.leave_type_id}`} className="px-2 py-2 text-center">{fmt(total)}</td>;
                  })}

                  {/* Availed totals */}
                  {leaveTypes.map((lt) => {
                    const total = employees.reduce((s, e) => s + (e.leave_data?.find((d) => d.leave_type_id === lt.leave_type_id)?.availed || 0), 0);
                    return <td key={`tot-av-${lt.leave_type_id}`} className="px-2 py-2 text-center">{fmt(total)}</td>;
                  })}

                  {/* Monthly totals */}
                  {MONTH_LABELS.map((_, mi) =>
                    leaveTypes.map((lt) => {
                      const total = employees.reduce((s, e) => s + (e.leave_data?.find((d) => d.leave_type_id === lt.leave_type_id)?.monthly?.[mi] || 0), 0);
                      return <td key={`tot-m${mi}-${lt.leave_type_id}`} className="px-2 py-2 text-center">{fmt(total)}</td>;
                    })
                  )}

                  {/* Closing totals */}
                  {leaveTypes.map((lt) => {
                    const total = employees.reduce((s, e) => s + (e.leave_data?.find((d) => d.leave_type_id === lt.leave_type_id)?.closing_balance || 0), 0);
                    return <td key={`tot-cl-${lt.leave_type_id}`} className="px-2 py-2 text-center">{fmt(total)}</td>;
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
        {(data?.leaveTypes || []).map((lt) => (
          <span key={lt.leave_type_id} className="flex items-center gap-1">
            <span className="font-semibold text-slate-700">{ltCode(lt.leave_type_name)}</span>
            = {lt.leave_type_name}
          </span>
        ))}
      </div>
    </div>
  );
}

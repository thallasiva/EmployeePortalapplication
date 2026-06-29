import React, { useEffect, useState, useMemo } from "react";
import { FileText, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { listPayslips } from "../../../api/payroll.api";
import {
  ReportPageHeader,
  ReportAvatar,
  ReportStatusBadge,
} from "../../../component/reports/ReportsLayout";

const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" },
  { value: 3, label: "March" },   { value: 4, label: "April" },
  { value: 5, label: "May" },     { value: 6, label: "June" },
  { value: 7, label: "July" },    { value: 8, label: "August" },
  { value: 9, label: "September" },{ value: 10, label: "October" },
  { value: 11, label: "November" },{ value: 12, label: "December" },
];

function formatINR(val) {
  const n = Number(val);
  if (isNaN(n)) return "₹0";
  return "₹" + n.toLocaleString("en-IN");
}

export default function PayslipReport() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    listPayslips({ month, year, limit: 500 })
      .then((data) => setPayslips(Array.isArray(data) ? data : []))
      .catch(() => setPayslips([]))
      .finally(() => setLoading(false));
  }, [month, year]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return payslips;
    return payslips.filter(
      (p) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
        (p.emp_code ?? "").toLowerCase().includes(q) ||
        (p.department_name ?? "").toLowerCase().includes(q)
    );
  }, [payslips, search]);

  // Stats
  const totalPayslips = payslips.length;
  const paidCount = payslips.filter((p) => p.status === "paid").length;
  const pendingCount = payslips.filter((p) => p.status !== "paid").length;
  const totalGross = payslips.reduce((sum, p) => sum + Number(p.gross_salary ?? p.net_pay ?? 0), 0);

  const yearOptions = [year - 1, year, year + 1];

  return (
    <div className="report-page">
      <ReportPageHeader title="Payslip Report" />

      {/* Stats */}
      <div className="report-stats-grid" style={{ maxWidth: 800 }}>
        {[
          { label: "Total Payslips", value: totalPayslips, barWidth: "100%", barColor: "#f18200" },
          { label: "Paid", value: paidCount, barWidth: `${totalPayslips ? (paidCount / totalPayslips) * 100 : 0}%`, barColor: "#16a34a" },
          { label: "Pending", value: pendingCount, barWidth: `${totalPayslips ? (pendingCount / totalPayslips) * 100 : 0}%`, barColor: "#f97316" },
          { label: "Total Gross", value: formatINR(totalGross), barWidth: "100%", barColor: "#8b5cf6" },
        ].map((s) => (
          <div key={s.label} className="report-stat-card">
            <p className="report-stat-card__value">{s.value}</p>
            <p className="report-stat-card__label">{s.label}</p>
            <div className="report-stat-card__bar-bg">
              <div className="report-stat-card__bar" style={{ width: s.barWidth, background: s.barColor }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="report-table-section">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h3 className="font-semibold text-gray-800 text-sm flex-1">Payslips</h3>

          <div className="flex items-center gap-1.5 border border-gray-200 rounded px-2.5 h-9 bg-white">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search employee…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm outline-none w-40"
            />
          </div>

          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-9 px-2 border border-gray-200 rounded text-sm outline-none bg-white"
          >
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 px-2 border border-gray-200 rounded text-sm outline-none bg-white"
          >
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading payslips…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <FileText size={32} className="opacity-30" />
            <p className="text-sm">No payslips found for {MONTHS.find((m) => m.value === month)?.label} {year}.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="report-data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Month</th>
                  <th>Gross Salary</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => {
                  const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Employee";
                  const monthLabel = MONTHS.find((m) => m.value === Number(p.month))?.label ?? p.month;
                  return (
                    <tr key={p.id ?? idx}>
                      <td>{idx + 1}</td>
                      <td>
                        <div className="report-person-cell">
                          <ReportAvatar name={name} />
                          <div>
                            <strong>{name}</strong>
                            <div className="text-xs text-gray-400">{p.emp_code}</div>
                          </div>
                        </div>
                      </td>
                      <td>{p.department_name ?? "—"}</td>
                      <td>{monthLabel} {p.year}</td>
                      <td>{formatINR(p.gross_salary)}</td>
                      <td>{formatINR(p.net_pay)}</td>
                      <td>
                        <ReportStatusBadge status={p.status === "paid" ? "Completed" : "Pending"} />
                      </td>
                      <td>
                        <button className="inline-flex items-center gap-1 text-xs text-[#f18200] border border-[#f18200] rounded px-2.5 py-1 hover:bg-blue-50">
                          <Download size={11} /> PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

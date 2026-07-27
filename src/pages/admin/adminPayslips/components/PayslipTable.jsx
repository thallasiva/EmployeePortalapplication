import React from "react";
import { Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Pagination from "../../../../components/Pagination";
import { formatINR } from "../../../../component/charts/InteractivePieChart";
import { MONTH_OPTIONS } from "../constants/payslipOptions";

const PayslipTable = React.memo(function PayslipTable({
  month,
  year,
  loading,
  pagination,
  downloadingId,
  onMarkPaid,
  onDownloadPdf,
}) {
  const navigate = useNavigate();
  const {
    paged: pagedPayslips,
    page, setPage, totalPages,
    from, to, total, pageSize, setPageSize,
  } = pagination;

  const monthLabel = MONTH_OPTIONS.find((m) => m.value === month)?.label;

  return (
    <div className="rounded-xl border border-[#dce3eb] bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-[15px] font-semibold text-[#334155]">
        Payslips for {monthLabel} {year}
      </h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading payslips...</p>
      ) : pagedPayslips.length === 0 ? (
        <p className="text-sm text-gray-500">
          No payslips generated for this month yet. Click "Generate All Employee Payslips" to create them.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2">Basic</th>
                <th className="px-3 py-2">HRA</th>
                <th className="px-3 py-2">Allowances</th>
                <th className="px-3 py-2">Gross</th>
                <th className="px-3 py-2">Deductions</th>
                <th className="px-3 py-2">Net Pay</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedPayslips.map((p) => (
                <tr key={p.payslip_id}>
                  <td className="px-3 py-2 font-medium text-gray-800">
                    {p.employee_name} <span className="text-gray-400">({p.emp_code})</span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{p.department_name || "—"}</td>
                  <td className="px-3 py-2">{formatINR(p.basic)}</td>
                  <td className="px-3 py-2">{formatINR(p.hra)}</td>
                  <td className="px-3 py-2">{formatINR(p.allowances)}</td>
                  <td className="px-3 py-2 font-medium text-emerald-600">{formatINR(p.gross_earnings)}</td>
                  <td className="px-3 py-2 text-rose-600">{formatINR(p.deductions)}</td>
                  <td className="px-3 py-2 font-semibold text-gray-800">{formatINR(p.net_pay)}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === "Paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => navigate(`/payslip/${p.payslip_id}/print`)}
                      className="text-xs font-semibold text-gray-500 hover:underline mr-3"
                    >
                      View / Print
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownloadPdf(p.payslip_id)}
                      disabled={downloadingId === p.payslip_id}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:underline mr-3 disabled:opacity-60"
                    >
                      <Download size={12} /> {downloadingId === p.payslip_id ? "Preparing…" : "Download PDF"}
                    </button>
                    {p.status !== "Paid" && (
                      <button
                        type="button"
                        onClick={() => onMarkPaid(p.payslip_id)}
                        className="text-xs font-semibold text-brand hover:underline"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={page} setPage={setPage} totalPages={totalPages}
            from={from} to={to} total={total}
            pageSize={pageSize} setPageSize={setPageSize}
          />
        </div>
      )}
    </div>
  );
});

export default PayslipTable;

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, TrendingDown, PiggyBank, FileText, Download } from "lucide-react";
import { calculatePayslip } from "../../../utils/payslipCalculations";
import { getCurrentPayslipMonthLabel } from "../../../lib/dateUtils";
import { getMyPayslips, getPayslipFull, generateMyPayslip, getMySalaryStructure } from "../../../api/payroll.api";
import { downloadPayslipPdf } from "../../../utils/payslipPdfGenerator";
import { errorToast } from "../../../utils/ToastControllers";
import PieChart, { formatINR } from "../../../component/charts/InteractivePieChart";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const Payslips = () => {
  const navigate = useNavigate();
  const monthLabel = getCurrentPayslipMonthLabel();

  const [basicSalary, setBasicSalary] = useState(0);
  const breakdown = useMemo(() => calculatePayslip(basicSalary), [basicSalary]);

  const [myPayslips, setMyPayslips] = useState([]);
  const [loadingPayslips, setLoadingPayslips] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadingCurrent, setDownloadingCurrent] = useState(false);

  // Determine the Basic salary that drives the on-screen breakdown charts.
  // Prefer the employee's salary structure (the live source of truth, kept
  // up to date by Admin/HR). Fall back to the current month's already
  // generated payslip if no salary structure is on file yet.
  useEffect(() => {
    let cancelled = false;

    getMySalaryStructure()
      .then((structure) => {
        if (cancelled) return;

        const structureBasic = Number(structure?.basic) || 0;
        if (structureBasic > 0) {
          setBasicSalary(structureBasic);
          return;
        }

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const currentPayslip = myPayslips.find(
          (p) => Number(p.month) === month && Number(p.year) === year
        );
        setBasicSalary(Number(currentPayslip?.basic) || 0);
      })
      .catch(() => {
        if (!cancelled) setBasicSalary(0);
      });

    return () => {
      cancelled = true;
    };
  }, [myPayslips]);

  const loadMyPayslips = () => {
    setLoadingPayslips(true);
    return getMyPayslips({ limit: 24 })
      .then(({ data }) => {
        setMyPayslips(data || []);
        return data || [];
      })
      .catch(() => {
        setMyPayslips([]);
        return [];
      })
      .finally(() => {
        setLoadingPayslips(false);
      });
  };

  useEffect(() => {
    loadMyPayslips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overviewData = [
    { label: "Net Pay", value: breakdown.netSalary, color: "#16a34a" },
    { label: "Deductions", value: breakdown.totalDeductions, color: "#dc2626" },
  ];

  const earningsData = [
    { label: "Basic Salary", value: breakdown.basic, color: "#2563eb" },
    { label: "HRA", value: breakdown.hra, color: "#0891b2" },
    { label: "Special Allowance", value: breakdown.specialAllowance, color: "#d97706" },
    { label: "LTA", value: breakdown.lta, color: "#4f46e5" },
    { label: "Telephone & Internet Allowance", value: breakdown.telephoneAndInternet, color: "#0d9488" },
    { label: "Medical Allowance", value: breakdown.medicalAllowance, color: "#db2777" },
    { label: "Conveyance Allowance", value: breakdown.conveyanceAllowance, color: "#059669" },
    { label: "Bonus", value: breakdown.bonus, color: "#65a30d" },
    { label: "Incentives", value: breakdown.incentives, color: "#ca8a04" },
    { label: "Arrears", value: breakdown.arrears, color: "#7c3aed" },
    { label: "Other Earnings", value: breakdown.otherEarnings, color: "#6b7280" },
  ];

  const deductionsData = [
    { label: "PF", value: breakdown.pf, color: "#d97706" },
    { label: "Professional Tax", value: breakdown.profTax, color: "#be123c" },
    { label: "Income Tax", value: breakdown.incomeTax, color: "#dc2626" },
  ];

  const handleDownloadPdf = async (payslipId) => {
    setDownloadingId(payslipId);
    try {
      const full = await getPayslipFull(payslipId);
      await downloadPayslipPdf(full);
    } catch (err) {
      errorToast(err?.response?.data?.message || err?.message || "Failed to generate the payslip PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  /**
   * Downloads the payslip for the current month. Always (re)generates it
   * first via the self-service endpoint - this is idempotent and ensures
   * the payslip reflects the employee's latest salary structure, even if
   * one was already generated earlier (e.g. before a salary update). Then
   * refreshes the "My Payslips" list so it shows the latest figures too.
   */
  const handleDownloadCurrent = async () => {
    setDownloadingCurrent(true);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const record = await generateMyPayslip({ month, year });
      await loadMyPayslips();

      const full = await getPayslipFull(record.payslip_id);
      await downloadPayslipPdf(full);
    } catch (err) {
      errorToast(err?.response?.data?.message || err?.message || "Failed to generate the payslip PDF.");
    } finally {
      setDownloadingCurrent(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">
      {/* HEADER */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-brand to-brand-600 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold">Payslips</h1>
            <p className="mt-0.5 text-sm text-white/80">Salary breakdown for {monthLabel}</p>
          </div>
          <button
            type="button"
            onClick={handleDownloadCurrent}
            disabled={downloadingCurrent}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand hover:bg-white/90 disabled:opacity-60 self-start"
          >
            <Download size={16} />
            {downloadingCurrent ? "Preparing…" : "Download Payslip"}
          </button>
        </div>

        {/* Summary cards */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/70">
              <Wallet size={14} />
              Gross Pay
            </div>
            <p className="mt-1 text-xl font-semibold">{formatINR(breakdown.totalEarnings)}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/70">
              <TrendingDown size={14} />
              Deductions
            </div>
            <p className="mt-1 text-xl font-semibold">{formatINR(breakdown.totalDeductions)}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/70">
              <PiggyBank size={14} />
              Net Pay
            </div>
            <p className="mt-1 text-xl font-semibold">{formatINR(breakdown.netSalary)}</p>
          </div>
        </div>
      </div>

      {/* SALARY OVERVIEW */}
      {/* <div className="mb-4 rounded-xl border border-[#dce3eb] bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-[15px] font-semibold text-[#334155]">Salary Overview</h2>
        <p className="mb-4 text-sm text-gray-500">
          Of your gross pay of <span className="font-semibold text-gray-700">{formatINR(breakdown.totalEarnings)}</span>, you take
          home <span className="font-semibold text-emerald-600">{formatINR(breakdown.netSalary)}</span> after{" "}
          <span className="font-semibold text-rose-600">{formatINR(breakdown.totalDeductions)}</span> in deductions. Hover over the
          chart or legend for details.
        </p>
        <PieChart data={overviewData} size={180} />
      </div> */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* EARNINGS BREAKDOWN */}
        <div className="rounded-xl border border-[#dce3eb] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-[15px] font-semibold text-[#334155]">Earnings Breakdown</h2>
          <PieChart data={earningsData} size={170} />
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm font-semibold">
            <span className="text-gray-700">Gross Pay</span>
            <span className="text-emerald-600">{formatINR(breakdown.totalEarnings)}</span>
          </div>
        </div>

        {/* DEDUCTIONS BREAKDOWN */}
        <div className="rounded-xl border border-[#dce3eb] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-[15px] font-semibold text-[#334155]">Deductions Breakdown</h2>
          <PieChart data={deductionsData} size={170} />
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-sm font-semibold">
            <span className="text-gray-700">Total Deductions</span>
            <span className="text-rose-600">{formatINR(breakdown.totalDeductions)}</span>
          </div>
        </div>
      </div>

      {/* MY PAYSLIPS — generated payslips, viewable/printable in the standard payslip layout */}
      <div className="mt-4 rounded-xl border border-[#dce3eb] bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-[15px] font-semibold text-[#334155]">My Payslips</h2>

        {loadingPayslips ? (
          <p className="text-sm text-gray-500">Loading payslips...</p>
        ) : myPayslips.length === 0 ? (
          <p className="text-sm text-gray-500">No payslips have been generated for you yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-3 py-2">Month</th>
                  <th className="px-3 py-2">Gross Earnings</th>
                  <th className="px-3 py-2">Deductions</th>
                  <th className="px-3 py-2">Net Pay</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myPayslips.map((p) => (
                  <tr key={p.payslip_id}>
                    <td className="px-3 py-2 font-medium text-gray-800">
                      {MONTH_NAMES[Number(p.month) - 1] || p.month} {p.year}
                    </td>
                    <td className="px-3 py-2 font-medium text-emerald-600">{formatINR(p.gross_earnings)}</td>
                    <td className="px-3 py-2 text-rose-600">{formatINR(p.deductions)}</td>
                    <td className="px-3 py-2 font-semibold text-gray-800">{formatINR(p.net_pay)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.status === "Paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => navigate(`/payslip/${p.payslip_id}/print`)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline mr-3"
                      >
                        <FileText size={14} /> View / Print
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(p.payslip_id)}
                        disabled={downloadingId === p.payslip_id}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:underline disabled:opacity-60"
                      >
                        <Download size={14} /> {downloadingId === p.payslip_id ? "Preparing…" : "Download PDF"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payslips;

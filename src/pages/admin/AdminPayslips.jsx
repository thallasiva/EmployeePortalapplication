import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Upload, X, Download } from "lucide-react";
import {
  listPayslips,
  importSalaryStructures,
  generateAllPayslips,
  markPayslipPaid,
  getPayslipFull,
} from "../../api/payroll.api";
import { formatINR } from "../../component/charts/InteractivePieChart";
import {
  parseSalaryStructureCsv,
  downloadSalaryStructureCsvTemplate,
} from "../../utils/salaryStructureImport";
import { downloadPayslipPdf } from "../../utils/payslipPdfGenerator";
import { successToast, errorToast } from "../../utils/ToastControllers";

const MONTH_OPTIONS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((label, idx) => ({ value: idx + 1, label }));

function getYearOptions() {
  const current = new Date().getFullYear();
  return [current - 1, current, current + 1];
}

function ImportSalaryStructureModal({ onClose, onImported }) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError("");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const { items, errors } = parseSalaryStructureCsv(String(reader.result || ""));
        setImporting(true);
        const result = await importSalaryStructures(items);
        const skippedCount = result?.skipped?.length || 0;
        const parts = [];
        if (result?.inserted) parts.push(`${result.inserted} created`);
        if (result?.updated) parts.push(`${result.updated} updated`);
        if (skippedCount || errors.length) parts.push(`${skippedCount + errors.length} skipped`);
        successToast(`Salary structures imported: ${parts.join(", ") || "no changes"}.`);
        onImported();
        onClose();
      } catch (err) {
        const message =
          err?.response?.data?.message || err?.message || "Failed to import salary structures.";
        setError(message);
        errorToast(message);
      } finally {
        setImporting(false);
      }
    };
    reader.onerror = () => {
      setError("Could not read the selected file.");
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="font-semibold text-gray-900">Import Salary Structures</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-gray-600">
            Upload a CSV with an <strong>Employee Code</strong> column and salary fields
            (<strong>Basic</strong>, <strong>HRA</strong>, <strong>Conveyance</strong>, <strong>CTC</strong>, etc.)
            plus an <strong>Effective From</strong> date (YYYY-MM-DD).
          </p>

          <button
            type="button"
            onClick={() => downloadSalaryStructureCsvTemplate()}
            className="text-sm font-medium text-brand hover:underline"
          >
            Download CSV template
          </button>

          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-8 text-center cursor-pointer hover:border-brand hover:bg-brand-50/40">
            <Upload size={24} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {fileName || "Click to choose a CSV file"}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
              disabled={importing}
            />
          </label>

          {importing && <p className="text-sm text-brand">Importing salary structures...</p>}
          {error && <p className="text-sm text-rose-600">{error}</p>}
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
}

function GenerateAllResultModal({ result, onClose }) {
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
}

const AdminPayslips = () => {
  const navigate = useNavigate();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadPayslips = () => {
    setLoading(true);
    listPayslips({ month, year, limit: 100 })
      .then(({ data }) => setPayslips(data || []))
      .catch(() => setPayslips([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPayslips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const handleGenerateAll = async () => {
    setGenerating(true);
    try {
      const result = await generateAllPayslips({ month, year });
      setGenerateResult(result);
      successToast(`Generated ${result.generated} payslip(s), emailed ${result.emailed}.`);
      loadPayslips();
    } catch (err) {
      errorToast(err?.response?.data?.message || err?.message || "Failed to generate payslips.");
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await markPayslipPaid(id);
      successToast("Payslip marked as paid.");
      loadPayslips();
    } catch (err) {
      errorToast(err?.response?.data?.message || err?.message || "Failed to update payslip.");
    }
  };

  const handleDownloadPdf = async (id) => {
    setDownloadingId(id);
    try {
      const full = await getPayslipFull(id);
      await downloadPayslipPdf(full);
    } catch (err) {
      errorToast(err?.response?.data?.message || err?.message || "Failed to generate the payslip PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-brand to-brand-600 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold">Payslips</h1>
            <p className="mt-0.5 text-sm text-white/80">
              Import salary structures, generate payslips and email them to employees.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white outline-none [&>option]:text-gray-800"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white outline-none [&>option]:text-gray-800"
            >
              {getYearOptions().map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25"
          >
            <Upload size={16} />
            Import Salary Structures (CSV)
          </button>
          <button
            type="button"
            onClick={handleGenerateAll}
            disabled={generating}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand hover:bg-white/90 disabled:opacity-60"
          >
            <Mail size={16} />
            {generating ? "Generating..." : "Generate All Employee Payslips"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#dce3eb] bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-[15px] font-semibold text-[#334155]">
          Payslips for {MONTH_OPTIONS.find((m) => m.value === month)?.label} {year}
        </h2>

        {loading ? (
          <p className="text-sm text-gray-500">Loading payslips...</p>
        ) : payslips.length === 0 ? (
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
                {payslips.map((p) => (
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
                        className="text-xs font-semibold text-gray-500 hover:underline mr-3"
                      >
                        View / Print
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(p.payslip_id)}
                        disabled={downloadingId === p.payslip_id}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:underline mr-3 disabled:opacity-60"
                      >
                        <Download size={12} /> {downloadingId === p.payslip_id ? "Preparing…" : "Download PDF"}
                      </button>
                      {p.status !== "Paid" && (
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(p.payslip_id)}
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
          </div>
        )}
      </div>

      {showImportModal && (
        <ImportSalaryStructureModal onClose={() => setShowImportModal(false)} onImported={loadPayslips} />
      )}

      {generateResult && (
        <GenerateAllResultModal result={generateResult} onClose={() => setGenerateResult(null)} />
      )}
    </div>
  );
};

export default AdminPayslips;

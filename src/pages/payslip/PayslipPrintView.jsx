import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { getPayslipFull } from "../../api/payroll.api";
import PayslipSheet from "./PayslipSheet";
import { downloadPayslipPdf } from "../../utils/payslipPdfGenerator";
import { errorToast } from "../../utils/ToastControllers";
import "./payslipPrint.css";

export default function PayslipPrintView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getPayslipFull(id)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.response?.data?.message || err?.message || "Failed to load payslip.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDownload = async () => {
    if (!data) return;
    setDownloading(true);
    try {
      await downloadPayslipPdf(data);
    } catch (err) {
      errorToast(err?.message || "Failed to generate the payslip PDF.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="payslip-print-loading">Loading payslip…</div>;
  if (error) return <div className="payslip-print-error">{error}</div>;
  if (!data) return null;

  return (
    <div className="payslip-print-page">
      <div className="payslip-print-toolbar">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
        >
          <Download size={16} /> {downloading ? "Preparing PDF…" : "Download PDF"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Printer size={16} /> Print / Save as PDF
        </button>
      </div>

      <PayslipSheet data={data} />
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import {
  listPayslips, generateAllPayslips, markPayslipPaid, getPayslipFull,
} from "../../../../api/payroll.api";
import { downloadPayslipPdf } from "../../../../utils/payslipPdfGenerator";
import { successToast, errorToast } from "../../../../utils/ToastControllers";

export function usePayslips(month, year) {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadPayslips = useCallback(() => {
    setLoading(true);
    listPayslips({ month, year, limit: 100 })
      .then(({ data }) => setPayslips(data || []))
      .catch(() => setPayslips([]))
      .finally(() => setLoading(false));
  }, [month, year]);

  useEffect(() => {
    loadPayslips();
  }, [loadPayslips]);

  const handleGenerateAll = useCallback(async () => {
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
  }, [month, year, loadPayslips]);

  const handleMarkPaid = useCallback(async (id) => {
    try {
      await markPayslipPaid(id);
      successToast("Payslip marked as paid.");
      loadPayslips();
    } catch (err) {
      errorToast(err?.response?.data?.message || err?.message || "Failed to update payslip.");
    }
  }, [loadPayslips]);

  const handleDownloadPdf = useCallback(async (id) => {
    setDownloadingId(id);
    try {
      const full = await getPayslipFull(id);
      await downloadPayslipPdf(full);
    } catch (err) {
      errorToast(err?.response?.data?.message || err?.message || "Failed to generate the payslip PDF.");
    } finally {
      setDownloadingId(null);
    }
  }, []);

  return {
    payslips,
    loading,
    generating,
    generateResult,
    setGenerateResult,
    downloadingId,
    loadPayslips,
    handleGenerateAll,
    handleMarkPaid,
    handleDownloadPdf,
  };
}

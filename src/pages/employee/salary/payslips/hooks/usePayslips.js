import { useState, useEffect, useMemo, useCallback } from "react";
import {
  getMyPayslips,
  getPayslipFull,
  generateMyPayslip,
  getMySalaryStructure
} from "../../../../../api/payroll.api";
import { getMyProfile } from "../../../../../api/employee.api";
import { downloadPayslipPdf } from "../../../../../utils/payslipPdfGenerator";
import { errorToast } from "../../../../../utils/ToastControllers";
import { getCurrentUser } from "../../../../../api/auth.api";

export function usePayslips() {
  const now = new Date();

  const [activeTab, setActiveTab] = useState("payslip");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [structure, setStructure] = useState(null);
  const [myPayslips, setMyPayslips] = useState([]);
  const [user, setUser] = useState(null);
  const [empProfile, setEmpProfile] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  const [showInfo, setShowInfo] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMySalaryStructure().catch(() => null),
      getMyPayslips({ limit: 36 }).then((r) => r?.data || r || []).catch(() => []),
      getCurrentUser().catch(() => null),
      getMyProfile().catch(() => null)
    ]).then(([s, p, u, profile]) => {
      setStructure(s);
      setMyPayslips(Array.isArray(p) ? p : []);
      setUser(u);
      setEmpProfile(profile);

      if (profile?.bankDetails) {
        setBankDetails(profile.bankDetails);
      }

      if (!s && profile) {
        const basicMonthly = Number(profile.base_salary) || 0;
        const ctcAnnual = Number(profile.ctc) || 0;
        if (basicMonthly > 0 || ctcAnnual > 0) {
          setStructure({
            basic: basicMonthly,
            ctc: ctcAnnual > 0 ? Math.round(ctcAnnual / 12) : undefined
          });
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  const currentPayslip = useMemo(
    () => myPayslips.find((p) => Number(p.month) === selectedMonth && Number(p.year) === selectedYear),
    [myPayslips, selectedMonth, selectedYear]
  );

  const monthOptions = useMemo(() => {
    const opts = new Map();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      opts.set(`${y}-${m}`, { month: m, year: y });
    }
    myPayslips.forEach((p) => {
      const key = `${p.year}-${p.month}`;
      opts.set(key, { month: Number(p.month), year: Number(p.year) });
    });
    return [...opts.values()].sort((a, b) => b.year - a.year || b.month - a.month);
  }, [myPayslips]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const record = await generateMyPayslip({ month: selectedMonth, year: selectedYear });
      const full = await getPayslipFull(record.payslip_id);
      await downloadPayslipPdf(full);
    } catch (err) {
      errorToast(err?.response?.data?.message || err?.message || "Download failed.");
    } finally {
      setDownloading(false);
    }
  }, [selectedMonth, selectedYear]);

  const handleMonthYearChange = useCallback((value) => {
    const [y, m] = value.split("-").map(Number);
    setSelectedYear(y);
    setSelectedMonth(m);
  }, []);

  return {
    activeTab,
    setActiveTab,
    selectedMonth,
    selectedYear,
    structure,
    currentPayslip,
    monthOptions,
    user,
    empProfile,
    bankDetails,
    showInfo,
    setShowInfo,
    downloading,
    loading,
    handleDownload,
    handleMonthYearChange
  };
}

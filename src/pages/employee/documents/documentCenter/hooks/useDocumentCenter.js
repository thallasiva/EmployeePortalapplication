import { useState, useEffect, useMemo, useCallback } from "react";
import { getMyDocuments, getMyJoiningDocs } from "../../../../../api/document.api";
import { downloadPayslip, viewPayslip } from "../../../../../utils/payslipDownload";
import { apiErrorToast, errorToast, successToast } from "../../../../../utils/ToastControllers";
import { VIEW, PAYSLIP_ROWS } from "../constants";
import { toJumpId, scrollElementIntoContainer } from "../utils";

export function useDocumentCenter() {
  const [view, setView] = useState(VIEW.HOME);
  const [docSectionOpen, setDocSectionOpen] = useState({ address: true, accounts: true });
  const [payslipYearOpen, setPayslipYearOpen] = useState({ 2026: true, 2025: false, 2024: false });
  const [payslipMonthOpen, setPayslipMonthOpen] = useState({ "Mar 2026": true });
  const [policyOpen, setPolicyOpen] = useState({ "information-security": true });
  const [policyDetailOpen, setPolicyDetailOpen] = useState({ "information-security": true });
  const [form16YearOpen, setForm16YearOpen] = useState({ "2025-26": true });
  const [formSectionOpen, setFormSectionOpen] = useState({ "tax-forms": true });
  const [letterSectionOpen, setLetterSectionOpen] = useState({ "pending-letters": true });

  const [myDocs, setMyDocs] = useState(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [joiningDocs, setJoiningDocs] = useState(null);

  useEffect(() => {
    if (view !== VIEW.DOCUMENTS || myDocs !== null) return;
    setDocsLoading(true);
    Promise.all([
      getMyDocuments({ limit: 200 }),
      getMyJoiningDocs().catch(() => null)
    ]).then(([docsRes, jd]) => {
      setMyDocs(docsRes?.data || []);
      setJoiningDocs(jd || null);
    }).catch((err) => {
      apiErrorToast(err, "load documents");
      setMyDocs([]);
    }).finally(() => setDocsLoading(false));
  }, [view, myDocs]);

  useEffect(() => {
    if (view !== VIEW.POLICIES || joiningDocs !== null) return;
    getMyJoiningDocs().then(setJoiningDocs).catch(() => {});
  }, [view, joiningDocs]);

  const docsByCategory = useMemo(() => {
    if (!myDocs) return {};
    const groups = {};
    myDocs.forEach((doc) => {
      const cat = doc.category_name || "General";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(doc);
    });
    return groups;
  }, [myDocs]);

  const payslipByYear = useMemo(() => ({
    "2026": PAYSLIP_ROWS.filter((row) => row.month.includes("2026")),
    "2025": PAYSLIP_ROWS.filter((row) => row.month.includes("2025")),
    "2024": []
  }), []);

  const scrollToJump = useCallback((label) => {
    const el = document.getElementById(toJumpId(label));
    if (el) scrollElementIntoContainer(el);
  }, []);

  const jumpToSection = useCallback((jumpId, expand) => {
    if (expand) expand();
    setTimeout(() => scrollToJump(jumpId), 0);
  }, [scrollToJump]);

  const handleViewPayslip = useCallback((row) => {
    try { viewPayslip(row); }
    catch (err) { apiErrorToast(err, "open payslip"); }
  }, []);

  const handleDownloadPayslip = useCallback(async (row) => {
    try {
      await downloadPayslip(row);
      successToast(`Downloaded ${row.file}`);
    } catch (err) { apiErrorToast(err, "download payslip"); }
  }, []);

  const togglePayslipMonth = useCallback((month) => {
    setPayslipMonthOpen((curr) => ({ ...curr, [month]: !curr[month] }));
  }, []);

  return {
    view, setView,
    docSectionOpen, setDocSectionOpen,
    payslipYearOpen, setPayslipYearOpen,
    payslipMonthOpen, togglePayslipMonth,
    policyOpen, setPolicyOpen,
    policyDetailOpen, setPolicyDetailOpen,
    form16YearOpen, setForm16YearOpen,
    formSectionOpen, setFormSectionOpen,
    letterSectionOpen, setLetterSectionOpen,
    myDocs, docsLoading, joiningDocs, docsByCategory, payslipByYear,
    scrollToJump, jumpToSection,
    handleViewPayslip, handleDownloadPayslip
  };
}

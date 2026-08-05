import React from "react";
import { Download, Loader2, FileText, ChevronDown } from "lucide-react";
import { usePayslips } from "./hooks/usePayslips";
import EmployeePanel from "./components/EmployeePanel";
import PayslipTab from "./components/PayslipTab";
import CtcPayslipTab from "./components/CtcPayslipTab";
import ReimbPayslipTab from "./components/ReimbPayslipTab";
import { TABS, MONTH_NAMES } from "./constants";

export default function Payslips() {
  const {
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
    handleMonthYearChange,
  } = usePayslips();

  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#94a3b8]">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-[14px]">Loading payslips…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* ── Page Header ── */}
      <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-[#1f2937]">Salary &amp; Payslips</h1>
          <p className="text-[13px] text-[#94a3b8] mt-0.5">
            View and download your monthly payslips &amp; CTC breakdown
          </p>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3">
          {/* Month selector */}
          <div className="relative">
            <select
              value={`${selectedYear}-${selectedMonth}`}
              onChange={(e) => handleMonthYearChange(e.target.value)}
              className="h-[38px] pl-3 pr-8 border border-[#d5dbe3] bg-white rounded-lg text-[13px] text-[#374151] outline-none focus:border-[#f18200] focus:ring-2 focus:ring-[#f18200]/10 appearance-none cursor-pointer"
            >
              {monthOptions.map(({ month, year }) => (
                <option key={`${year}-${month}`} value={`${year}-${month}`}>
                  {MONTH_NAMES[month - 1]} {year}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
          </div>

          {/* Download button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 h-[38px] px-5 bg-[#f18200] hover:bg-[#e07000] disabled:opacity-60 text-white rounded-lg text-[13px] font-bold transition-colors"
          >
            {downloading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {downloading ? "Downloading…" : "Download"}
          </button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="px-6 pb-4">
        <div className="flex gap-1 bg-white rounded-xl border border-[#e8eef5] p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`px-5 h-[36px] rounded-lg text-[13px] font-medium transition-all ${
                activeTab === t.key
                  ? "bg-[#f18200] text-white shadow-sm"
                  : "text-[#64748b] hover:text-[#1f2937]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="px-6 pb-8">
        <div className="flex gap-4 items-start">
          {/* Main payslip panel */}
          <div className="flex-1 bg-white border border-[#ffe0b2] rounded-xl overflow-hidden shadow-sm">
            {/* Panel header strip */}
            <div className="px-5 py-3 bg-[#fff8f0] border-b border-[#ffe0b2] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#f18200]/10 flex items-center justify-center shrink-0">
                <FileText size={15} color="#f18200" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#1f2937]">
                  {TABS.find((t) => t.key === activeTab)?.label ?? "Payslip"}
                </p>
                <p className="text-[11px] text-[#94a3b8]">{monthLabel}</p>
              </div>
              {!currentPayslip && activeTab !== "reimb" && (
                <span className="ml-auto text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                  Not yet generated
                </span>
              )}
            </div>

            <div className="p-5">
              {activeTab === "payslip" && (
                <PayslipTab payslip={currentPayslip} structure={structure} empProfile={empProfile} />
              )}
              {activeTab === "ctc" && (
                <CtcPayslipTab payslip={currentPayslip} structure={structure} empProfile={empProfile} />
              )}
              {activeTab === "reimb" && <ReimbPayslipTab />}
            </div>
          </div>

          {/* Sidebar panel */}
          <div className="flex flex-col gap-2">
            {!showInfo ? (
              <button
                onClick={() => setShowInfo(true)}
                className="h-[36px] px-4 bg-white border border-[#e8e1a0] rounded-lg text-[12px] font-semibold text-[#7b7b3b] hover:bg-[#fffbea] transition-colors whitespace-nowrap"
              >
                Show Info
              </button>
            ) : (
              <EmployeePanel
                user={user}
                payslip={currentPayslip}
                structure={structure}
                empProfile={empProfile}
                bankDetails={bankDetails}
                month={selectedMonth}
                year={selectedYear}
                onHide={() => setShowInfo(false)}
              />
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center mt-4 text-[12px] text-[#94a3b8]">
          Showing payslip for <strong className="text-[#64748b]">{monthLabel}</strong>
        </p>
      </div>
    </div>
  );
}

import React from "react";
import { Download, Loader2 } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
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
    handleMonthYearChange
  } = usePayslips();

  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  if (loading) {
    return (
      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#94a3b8" })}>
        <Loader2 size={20} className={cssClass({ marginRight: 8, animation: "spin 1s linear infinite" })} />
        Loading payslips…
      </div>
    );
  }

  return (
    <div className={cssClass({ background: "#f5f7fb", minHeight: "100vh", padding: 20 })}>
      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 })}>
        <div className={cssClass({ display: "flex", gap: 0 })}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={cssClass({
                padding: "8px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: activeTab === t.key ? "#f18200" : "#fff",
                color: activeTab === t.key ? "#fff" : "#555",
                border: "1px solid #d0dde8",
                borderRadius: t.key === "payslip" ? "6px 0 0 6px" : t.key === "reimb" ? "0 6px 6px 0" : "0",
                borderLeft: t.key !== "payslip" ? "none" : undefined
              })}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={cssClass({ display: "flex", alignItems: "center", gap: 10 })}>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className={cssClass({
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", background: "#f18200", color: "#fff",
              border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
              opacity: downloading ? 0.7 : 1
            })}
          >
            <Download size={14} />
            {downloading ? "…" : ""}
          </button>
          <select
            value={`${selectedYear}-${selectedMonth}`}
            onChange={(e) => handleMonthYearChange(e.target.value)}
            className={cssClass({ padding: "7px 12px", border: "1px solid #cdd5e0", borderRadius: 6, fontSize: 13, outline: "none", background: "#fff" })}
          >
            {monthOptions.map(({ month, year }) => (
              <option key={`${year}-${month}`} value={`${year}-${month}`}>
                {MONTH_NAMES[month - 1]} {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={cssClass({ display: "flex", gap: 16, alignItems: "flex-start" })}>
        <div className={cssClass({ flex: 1, background: "#fff", border: "1px solid #ffe0b2", borderRadius: 8, padding: 20 })}>
          {activeTab === "payslip" && (
            <PayslipTab payslip={currentPayslip} structure={structure} empProfile={empProfile} />
          )}
          {activeTab === "ctc" && (
            <CtcPayslipTab payslip={currentPayslip} structure={structure} empProfile={empProfile} />
          )}
          {activeTab === "reimb" && <ReimbPayslipTab />}
        </div>

        {!showInfo && (
          <p
            onClick={() => setShowInfo(true)}
            className={cssClass({ padding: "8px 14px", background: "#fff", border: "1px solid #e8e1a0", borderRadius: 6, fontSize: 12, fontWeight: 600, color: "#7b7b3b", cursor: "pointer", whiteSpace: "nowrap" })}
          >
            Show Info
          </p>
        )}

        {showInfo && (
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

      <div className={cssClass({ textAlign: "center", marginTop: 12, fontSize: 12, color: "#94a3b8" })}>
        Showing payslip for <strong>{monthLabel}</strong>
        {!currentPayslip && activeTab !== "reimb" && (
          <span className={cssClass({ color: "#f59e0b", marginLeft: 8 })}>
            · Payslip not yet generated for this month
          </span>
        )}
      </div>
    </div>
  );
}

import React, { useState, useCallback } from "react";
import { cssClass } from "../../../../utils/classStyles";
import { generateMyPayslip, getPayslipFull } from "../../../../api/payroll.api";
import { downloadPayslipPdf } from "../../../../utils/payslipPdfGenerator";
import { errorToast } from "../../../../utils/ToastControllers";
import { useDashboardData } from "./hooks/useDashboardData";
import { useAttendance } from "./hooks/useAttendance";
import ProfileHeader from "./components/ProfileHeader";
import SummaryTiles from "./components/SummaryTiles";
import AttendanceCard from "./components/AttendanceCard";
import PayslipCard from "./components/PayslipCard";
import SalaryComponentsCard from "./components/SalaryComponentsCard";
import LeaveBalanceCard from "./components/LeaveBalanceCard";
import HolidayCard from "./components/HolidayCard";
import QuickAccessCard from "./components/QuickAccessCard";
import ITDeclarationCard from "./components/ITDeclarationCard";
import POICard from "./components/POICard";

export default function Dashboard() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [showSal, setShowSal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const {
    user, holidays, leaveBalance, todayAtt, setTodayAtt, monthAtt, loading, sal, payslipLabel,
  } = useDashboardData({ month, year });

  const { checkIn, checkOut, elapsed, workHours, checkingIn, checkingOut, handleCheckIn, handleCheckOut, checkinLocation, checkoutLocation } =
    useAttendance({ todayAtt, setTodayAtt });

  // Derived employee info
  const empName = user
    ? `${user.first_name || user.name || ""}${user.last_name ? " " + user.last_name : ""}`.trim()
    : "";
  const empCode = user?.emp_code || user?.employee_code || "—";
  const designation = user?.emp_job_title || user?.designation || "—";
  const department = user?.department_name || "—";
  const joinDate = user?.emp_joining_date
    ? new Date(user.emp_joining_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
  const initials = empName
    ? empName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  // Derived payroll stats
  const paidDays = sal.fromPayslip ? sal.paidDays : sal.basic > 0 ? 26 : 0;
  const workDays = sal.fromPayslip ? sal.workingDays : sal.basic > 0 ? 26 : 0;
  const lopDays = sal.fromPayslip ? sal.lopDays : 0;
  const presentDays = monthAtt?.present_days ?? monthAtt?.presentDays ?? 0;
  const todayLabel = now.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const rec = await generateMyPayslip({ month, year });
      const full = await getPayslipFull(rec.payslip_id);
      await downloadPayslipPdf(full);
    } catch (err) {
      errorToast(err?.response?.data?.message || "Download failed.");
    } finally {
      setDownloading(false);
    }
  }, [month, year]);

  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f0f4f8", padding: 20 })}>
      <ProfileHeader
        loading={loading} initials={initials} empName={empName} empCode={empCode}
        designation={designation} department={department} joinDate={joinDate}
        payslipLabel={payslipLabel} checkIn={checkIn} checkOut={checkOut}
        elapsed={elapsed} checkingIn={checkingIn} checkingOut={checkingOut}
        handleCheckIn={handleCheckIn} handleCheckOut={handleCheckOut} todayAtt={todayAtt} checkinLocation={checkinLocation} checkoutLocation={checkoutLocation}
      />

      <SummaryTiles
        loading={loading} showSal={showSal} sal={sal}
        paidDays={paidDays} workDays={workDays} lopDays={lopDays} presentDays={presentDays}
      />

      <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 18 })}>
        <AttendanceCard
          loading={loading} todayAtt={todayAtt} checkIn={checkIn} checkOut={checkOut}
          elapsed={elapsed} workHours={workHours} checkingIn={checkingIn} checkingOut={checkingOut}
          handleCheckIn={handleCheckIn} handleCheckOut={handleCheckOut} todayLabel={todayLabel} checkinLocation={checkinLocation} checkoutLocation={checkoutLocation}
        />
        <PayslipCard
          loading={loading} sal={sal} showSal={showSal} setShowSal={setShowSal}
          downloading={downloading} handleDownload={handleDownload}
        />
        {sal.basic > 0 && (
          <SalaryComponentsCard sal={sal} showSal={showSal} setShowSal={setShowSal} />
        )}
        <LeaveBalanceCard loading={loading} leaveBalance={leaveBalance} />
        <HolidayCard loading={loading} holidays={holidays} />
        <QuickAccessCard />
        <ITDeclarationCard />
        <POICard />
      </div>

      <div className={cssClass({ marginTop: 36, display: "flex", justifyContent: "center", gap: 20, fontSize: 12, color: "#94a3b8" })}>
        <span>Privacy Policy</span><span>|</span><span>Terms of Service</span>
      </div>
    </div>
  );
}

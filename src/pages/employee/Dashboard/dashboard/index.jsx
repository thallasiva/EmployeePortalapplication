import React, { useCallback, useMemo, useState } from "react";
import { generateMyPayslip, getPayslipFull } from "../../../../api/payroll.api";
import { downloadPayslipPdf } from "../../../../utils/payslipPdfGenerator";
import { apiErrorToast } from "../../../../utils/ToastControllers";
import { useDashboardData } from "./hooks/useDashboardData";
import { useAttendance } from "./hooks/useAttendance";
import ProfileHeader from "./components/ProfileHeader";
import SummaryTiles from "./components/SummaryTiles";
import AttendanceCard from "./components/AttendanceCard";
import MonthlyAttendanceCard from "./components/MonthlyAttendanceCard";
import AttendanceTrendCard from "./components/AttendanceTrendCard";
import PayslipCard from "./components/PayslipCard";
import LeaveBalanceCard from "./components/LeaveBalanceCard";
import HolidayCard from "./components/HolidayCard";
import QuickAccessCard from "./components/QuickAccessCard";
import AnnouncementsCard from "./components/AnnouncementsCard";

const rowsFrom = (value) => Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [];
const attendanceStatus = (row) => String(row.status || "").toLowerCase().replace(/[ -]/g, "_");
const minutesFrom = (value) => {
  if (typeof value === "number") return Math.round(value * 60);
  const raw = String(value || "").trim();
  const clock = raw.match(/^(\d+):(\d{1,2})$/);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
  const decimal = Number(raw);
  return Number.isFinite(decimal) ? Math.round(decimal * 60) : 0;
};
const formatDuration = (minutes) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;

export default function Dashboard() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const [showSal, setShowSal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { user, holidays, leaveBalance, todayAtt, setTodayAtt, monthAtt, loading, sal, payslipLabel } = useDashboardData({ month, year });
  const { checkIn, checkOut, elapsed, workHours, checkingIn, checkingOut, handleCheckIn, handleCheckOut, checkinLocation, checkoutLocation } = useAttendance({ todayAtt, setTodayAtt });

  const empName = user ? `${user.first_name || user.name || ""}${user.last_name ? ` ${user.last_name}` : ""}`.trim() : "";
  const empCode = user?.emp_code || user?.employee_code || "—";
  const designation = user?.emp_job_title || user?.designation || "—";
  const department = user?.department_name || "—";
  const joinDate = user?.emp_joining_date ? new Date(user.emp_joining_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const initials = empName ? empName.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2) : "?";
  const attendanceRows = useMemo(() => rowsFrom(monthAtt), [monthAtt]);
  const presentDays = useMemo(() => attendanceRows.filter((row) => ["present", "late", "half_day", "halfday", "p:a"].includes(attendanceStatus(row))).length, [attendanceRows]);
  const paidDays = sal.fromPayslip ? sal.paidDays : presentDays;
  const workDays = sal.fromPayslip ? sal.workingDays : Math.max(presentDays, attendanceRows.length);
  const monthlyMinutes = useMemo(() => attendanceRows.reduce((total, row) => total + minutesFrom(row.work_hours), 0), [attendanceRows]);
  const monthlyHours = monthlyMinutes ? formatDuration(monthlyMinutes) : "—";
  const availableLeaveDays = useMemo(() => leaveBalance.reduce((total, item) => total + Number(item.available ?? item.balance ?? Math.max(0, Number(item.total_days ?? item.total ?? item.annual_quota ?? 0) - Number(item.used_days ?? item.used ?? 0))), 0), [leaveBalance]);
  const completion = useMemo(() => {
    const provided = parseInt(user?.profile_completion ?? user?.profileCompletion, 10);
    if (Number.isFinite(provided)) return Math.max(0, Math.min(100, provided));
    const fields = [user?.first_name || user?.name, user?.last_name, user?.email || user?.personal_email, user?.phone || user?.mobile, user?.emp_job_title || user?.designation, user?.department_name, user?.emp_joining_date];
    return Math.round(fields.filter(Boolean).length / fields.length * 100);
  }, [user]);
  const photo = user?.profile_photo_url || user?.profile_photo || user?.avatar_url || user?.profile_image_url || user?.photo_url;
  const office = user?.office_name || user?.office_location || user?.location;
  const todayLabel = now.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const record = await generateMyPayslip({ month, year });
      const full = await getPayslipFull(record.payslip_id);
      await downloadPayslipPdf(full);
    } catch (error) {
      apiErrorToast(error, "Download failed.");
    } finally {
      setDownloading(false);
    }
  }, [month, year]);

  return (
    <main className="min-h-full bg-slate-50 p-3 sm:p-4">
      <ProfileHeader loading={loading} initials={initials} empName={empName} empCode={empCode} designation={designation} department={department} joinDate={joinDate} photo={photo} office={office} completion={completion} />
      <SummaryTiles loading={loading} showSal={showSal} setShowSal={setShowSal} sal={sal} paidDays={paidDays} workDays={workDays} monthlyHours={monthlyHours} leaveDays={availableLeaveDays} />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <AttendanceCard loading={loading} todayAtt={todayAtt} checkIn={checkIn} checkOut={checkOut} elapsed={elapsed} workHours={workHours} checkingIn={checkingIn} checkingOut={checkingOut} handleCheckIn={handleCheckIn} handleCheckOut={handleCheckOut} todayLabel={todayLabel} checkinLocation={checkinLocation} checkoutLocation={checkoutLocation} />
        <MonthlyAttendanceCard rows={attendanceRows} loading={loading} />
        <LeaveBalanceCard loading={loading} leaveBalance={leaveBalance} />
        <QuickAccessCard onDownload={handleDownload} downloading={downloading} />
      </div>
      <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <AttendanceTrendCard />
        <PayslipCard loading={loading} sal={sal} downloading={downloading} handleDownload={handleDownload} payslipLabel={payslipLabel} />
        <HolidayCard loading={loading} holidays={holidays} />
        <AnnouncementsCard holidays={holidays} hasPayslip={sal.fromPayslip} checkedIn={Boolean(checkIn && !checkOut)} />
      </div>
    </main>
  );
}

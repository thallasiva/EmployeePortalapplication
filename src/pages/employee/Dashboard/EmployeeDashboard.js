import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, FileText, AlertCircle, Users, Download } from 'lucide-react';
import { getCurrentPayslipMonthLabel, getLoggedInUser } from '../../../lib/dateUtils';
import { getShiftForUser } from '../../../data/auth';
import { calculatePayslip } from '../../../utils/payslipCalculations';
import { listHolidays } from '../../../api/holiday.api';
import { downloadPayslip } from '../../../utils/payslipDownload';
import PieChart, { formatINR } from '../../../component/charts/InteractivePieChart';
import ShiftDashboard from './ShiftDashboard';

const QUICK_LINKS = [
  { label: 'CTC Payslip', to: '/employee/payroll/payslips' },
  { label: 'Reimbursement Payslip', to: '/employee/payroll/reimbursements' },
  { label: 'IT Statement', to: '/employee/payroll/it-statement' },
  { label: 'IT Declaration', to: '/employee/payroll/it-declaration' },
  { label: 'Proof of Investment', to: '/employee/payroll/claims' },
];

/** Demo monthly CTC used to derive the payslip pie chart on the dashboard. */
const MONTHLY_SALARY = 45000;

const EmployeeDashboard = () => {
  const payslipMonthLabel = getCurrentPayslipMonthLabel();
  const user = getLoggedInUser();
  const shift = getShiftForUser(user);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };
   const greeting = getGreeting();

  const breakdown = calculatePayslip(MONTHLY_SALARY);
  const payslipOverview = [
    { label: "Net Pay", value: breakdown.netSalary, color: "#16a34a" },
    { label: "Deductions", value: breakdown.totalDeductions, color: "#dc2626" },
  ];

  const [showSalary, setShowSalary] = useState(false);

  const handleDownloadPayslip = () => {
    downloadPayslip({
      month: payslipMonthLabel,
      text: `Payslip for ${payslipMonthLabel} - Gross Pay ${formatINR(breakdown.totalEarnings)}, Net Pay ${formatINR(
        breakdown.netSalary
      )}`,
      file: `Payslip-${payslipMonthLabel.replace(/\s+/g, "-")}.pdf`,
    });
  };

  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [holidaysLoading, setHolidaysLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const years = Array.from(new Set([now.getFullYear(), now.getFullYear() + 1]));

    Promise.all(years.map((year) => listHolidays({ year, limit: 200 })))
      .then((results) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = results
          .flatMap(({ data }) => data || [])
          .map((row) => ({ ...row, dateObj: new Date(row.holiday_date) }))
          .filter((row) => !Number.isNaN(row.dateObj.getTime()) && row.dateObj >= today)
          .sort((a, b) => a.dateObj - b.dateObj)
          .slice(0, 4);

        setUpcomingHolidays(upcoming);
      })
      .catch(() => setUpcomingHolidays([]))
      .finally(() => setHolidaysLoading(false));
  }, []);

  return (
    <div>
      {/* <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{getGreeting()}</h1>
      </div> */}

      <ShiftDashboard shiftId={shift} greeting={greeting}/>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center">
          <div className="mb-4">
            <CheckCircle className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Review</h3>
          <p className="text-gray-600 text-center text-sm">Hurrah! You&apos;ve nothing to review.</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Upcoming Holidays</h3>
            <Link to="/employee/leave/holiday-calendar" className="text-brand">
              →
            </Link>
          </div>
          <div className="space-y-3">
            {holidaysLoading ? (
              <p className="text-sm text-gray-400">Loading holidays...</p>
            ) : upcomingHolidays.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming holidays scheduled.</p>
            ) : (
              upcomingHolidays.map((holiday) => (
                <div key={holiday.holiday_id}>
                  <p className="font-medium text-gray-800">
                    {holiday.dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {holiday.dateObj.toLocaleDateString("en-US", { weekday: "long" })} - {holiday.holiday_name}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Payslip</h3>
            <Link to="/employee/payroll/payslips" className="text-brand text-sm font-medium">
              View →
            </Link>
          </div>

          <PieChart data={payslipOverview} size={140} />

          <div className="space-y-2 text-sm mt-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Gross Pay</span>
              <span className="font-medium text-gray-800">{showSalary ? formatINR(breakdown.totalEarnings) : "•••••"}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Deduction</span>
              <span className="font-medium text-gray-800">{showSalary ? formatINR(breakdown.totalDeductions) : "•••••"}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Net Pay</span>
              <span className="font-medium text-gray-800">{showSalary ? formatINR(breakdown.netSalary) : "•••••"}</span>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleDownloadPayslip}
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-brand font-medium text-sm border border-brand rounded py-2 hover:bg-brand-50"
            >
              <Download size={14} />
              Download
            </button>
            <button
              type="button"
              onClick={() => setShowSalary((prev) => !prev)}
              className="flex-1 text-brand font-medium text-sm border border-brand rounded py-2 hover:bg-brand-50"
            >
              {showSalary ? "Hide Salary" : "Show Salary"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">{payslipMonthLabel}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Access</h3>
          <div className="space-y-3">
            {QUICK_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="block text-brand hover:text-brand-700 text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-400">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">IT Declaration</h3>
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-1" />
            <p className="text-sm text-gray-700">
              Hurry! Your IT declaration is awaiting. Please submit it before the window gets closed.
            </p>
          </div>
          <Link
            to="/employee/payroll/it-declaration"
            className="block w-full text-center border border-brand text-brand font-medium py-2 rounded hover:bg-brand-50"
          >
            Declare
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">POI</h3>
          <div className="flex flex-col items-center justify-center py-4">
            <FileText className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-700 text-center mb-4">
              Hold on! You can submit your Proof of Investments (POI) once released.
            </p>
            <Link
              to="/employee/payroll/claims"
              className="border border-brand text-brand font-medium px-6 py-2 rounded hover:bg-brand-50"
            >
              Track
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Hiring</h3>
          <div className="flex flex-col items-center justify-center py-4">
            <Users className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-700 text-center">
              All good! You have no pending tasks.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-4 text-sm text-gray-500">
        <span>Privacy Policy</span>
        <span>|</span>
        <span>Terms of Service</span>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

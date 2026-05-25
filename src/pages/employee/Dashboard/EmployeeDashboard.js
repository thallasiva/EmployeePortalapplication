import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, FileText, AlertCircle, Users } from 'lucide-react';
import { getCurrentPayslipMonthLabel } from '../../../lib/dateUtils';

const QUICK_LINKS = [
  { label: 'CTC Payslip', to: '/employee/payroll/payslips' },
  { label: 'Reimbursement Payslip', to: '/employee/payroll/reimbursements' },
  { label: 'IT Statement', to: '/employee/payroll/it-statement' },
  { label: 'IT Declaration', to: '/employee/payroll/it-declaration' },
  { label: 'Proof of Investment', to: '/employee/payroll/claims' },
];

const EmployeeDashboard = () => {
  const payslipMonthLabel = getCurrentPayslipMonthLabel();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{getGreeting()}</h1>
      </div>

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
            <div>
              <p className="font-medium text-gray-800">27 May</p>
              <p className="text-sm text-gray-600">Wednesday</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">02 Jun</p>
              <p className="text-sm text-gray-600">Tuesday - Telangana Formation Day</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">14 Sep</p>
              <p className="text-sm text-gray-600">Monday - Vinayaka Chavithi</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">02 Oct</p>
              <p className="text-sm text-gray-600">Friday - Gandhi Jayanthi</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Payslip</h3>
          <div className="flex justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120" aria-hidden>
                <circle cx="60" cy="60" r="54" fill="none" stroke="#e0e0e0" strokeWidth="8" />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#f18200"
                  strokeWidth="8"
                  strokeDasharray="169.65 169.65"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-sm text-gray-600">Paid Days</p>
                <p className="text-2xl font-bold text-gray-800">30</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Gross Pay</span>
              <span>•••••</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Deduction</span>
              <span>•••••</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-gray-600">Net Pay</span>
              <span>•••••</span>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" className="flex-1 text-brand font-medium text-sm border border-brand rounded py-2 hover:bg-brand-50">
              Download
            </button>
            <button type="button" className="flex-1 text-brand font-medium text-sm border border-brand rounded py-2 hover:bg-brand-50">
              Show Salary
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

import React, { useState } from 'react';
import { CheckCircle, Calendar, Download, FileText, AlertCircle, Users, MessageSquare } from 'lucide-react';
import { getCurrentPayslipMonthLabel } from '../../../lib/dateUtils';

const EmployeeDashboard = () =>
{
    const [showSalary, setShowSalary] = useState(false);
    const payslipMonthLabel = getCurrentPayslipMonthLabel();

    const getGreeting = () =>
    {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800">{getGreeting()}</h1>
                {/* <p className="text-gray-600 mt-2">"Life is 10% what happens to us and 90% how we react to it." - Dennis P. Kimbro</p> */}
            </div>

            {/* Banner */}
            

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Review Card */}
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center">
                    <div className="mb-4">
                        <CheckCircle className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Review</h3>
                    <p className="text-gray-600 text-center text-sm">Hurrah! You've nothing to review.</p>
                </div>

                {/* Upcoming Holidays */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Upcoming Holidays</h3>
                        <span className="text-brand">→</span>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="font-medium text-gray-800">27 May</p>
                            <p className="text-sm text-gray-600">Wednesday</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-800">02 Jun</p>
                            <p className="text-sm text-gray-600">Tuesday - Telanagana Formation Day</p>
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

                {/* Payslip */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Payslip</h3>
                    <div className="flex justify-center mb-6">
                        <div className="relative w-32 h-32">
                            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="54"
                                    fill="none"
                                    stroke="#e0e0e0"
                                    strokeWidth="8"
                                />
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="54"
                                    fill="none"
                                    stroke="#1e40af"
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
                        <button className="flex-1 text-brand font-medium text-sm border border-brand rounded py-2 hover:bg-brand-50">
                            Download
                        </button>
                        <button className="flex-1 text-brand font-medium text-sm border border-brand rounded py-2 hover:bg-brand-50">
                            Show Salary
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">{payslipMonthLabel}</p>
                </div>

                {/* Quick Access */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Access</h3>
                    <div className="space-y-3">
                        <a href="#" className="block text-brand hover:text-brand-700 text-sm font-medium">
                            CTC Payslip
                        </a>
                        <a href="#" className="block text-brand hover:text-brand-700 text-sm font-medium">
                            Reimbursement Payslip
                        </a>
                        <a href="#" className="block text-brand hover:text-brand-700 text-sm font-medium">
                            IT Statement
                        </a>
                        <a href="#" className="block text-brand hover:text-brand-700 text-sm font-medium">
                            YTD Reports
                        </a>
                        <a href="#" className="block text-brand hover:text-brand-700 text-sm font-medium">
                            Loan Statement
                        </a>
                    </div>
                </div>

                {/* IT Declaration */}
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-400">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">IT Declaration</h3>
                    <div className="flex items-start gap-3 mb-4">
                        <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-1" />
                        <p className="text-sm text-gray-700">
                            Hurry! Your IT declaration is awaiting. Please submit it before the window gets closed.
                        </p>
                    </div>
                    <button className="w-full border border-brand text-brand font-medium py-2 rounded hover:bg-brand-50">
                        Declare
                    </button>
                </div>

                {/* POI - Proof of Investments */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">POI</h3>
                    <div className="flex flex-col items-center justify-center py-6">
                        <FileText className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-sm text-gray-700 text-center mb-4">
                            Hold on! You can submit your Proof of Investments (POI) once released.
                        </p>
                        <button className="border border-brand text-brand font-medium px-6 py-2 rounded hover:bg-brand-50">
                            Track
                        </button>
                    </div>
                </div>

                {/* Hiring */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Hiring</h3>
                    <div className="flex flex-col items-center justify-center py-6">
                        <Users className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-sm text-gray-700 text-center">
                            All good! You have no pending tasks.
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-12 flex justify-center gap-6 text-sm text-gray-600">
                <a href="#" className="hover:text-gray-800">Privacy Policy</a>
                <span>|</span>
                <a href="#" className="hover:text-gray-800">Terms of Service</a>
            </div>
        </div>
    );
};

export default EmployeeDashboard;



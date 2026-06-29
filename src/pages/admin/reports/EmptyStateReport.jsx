import React from "react";
import { ReportPageHeader } from "../../../component/reports/ReportsLayout";

const CONFIGS = {
  expense: {
    title: "Expense Report",
    icon: "💳",
    description: "Track and manage employee expense claims, reimbursements, and approvals.",
    features: ["Submit expense claims", "Upload receipts", "Approval workflows", "Category-wise summaries"],
  },
  invoice: {
    title: "Invoice Report",
    icon: "🧾",
    description: "Manage client invoices, billing cycles, and payment tracking.",
    features: ["Invoice generation", "Client billing", "Payment status", "Revenue tracking"],
  },
  payment: {
    title: "Payment Report",
    icon: "💰",
    description: "Monitor payment transactions, vendor payments, and reconciliation.",
    features: ["Payment history", "Vendor payouts", "Bank reconciliation", "Transaction logs"],
  },
};

export default function EmptyStateReport({ type }) {
  const config = CONFIGS[type];
  if (!config) return null;

  return (
    <div className="report-page">
      <ReportPageHeader title={config.title} />
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="text-6xl mb-4">{config.icon}</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">{config.title} Coming Soon</h2>
        <p className="text-sm text-gray-400 max-w-sm mb-8">{config.description}</p>
        <div className="bg-white border border-gray-100 rounded-xl p-6 max-w-sm w-full shadow-sm text-left">
          <p className="text-[12px] font-semibold text-gray-500 uppercase mb-3">Planned Features</p>
          <ul className="space-y-2">
            {config.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-[13px] text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f18200] shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[12px] text-gray-300 mt-6">Contact your administrator to enable this module.</p>
      </div>
    </div>
  );
}

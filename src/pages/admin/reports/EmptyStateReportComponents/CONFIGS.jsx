import React from "react";
import { CreditCard, Receipt, Wallet } from "lucide-react";
const CONFIGS = {
  expense: {
    title: "Expense Report",
    icon: <CreditCard size={48} />,
    description: "Track and manage employee expense claims, reimbursements, and approvals.",
    features: ["Submit expense claims", "Upload receipts", "Approval workflows", "Category-wise summaries"]
  },
  invoice: {
    title: "Invoice Report",
    icon: <Receipt size={48} />,
    description: "Manage client invoices, billing cycles, and payment tracking.",
    features: ["Invoice generation", "Client billing", "Payment status", "Revenue tracking"]
  },
  payment: {
    title: "Payment Report",
    icon: <Wallet size={48} />,
    description: "Monitor payment transactions, vendor payments, and reconciliation.",
    features: ["Payment history", "Vendor payouts", "Bank reconciliation", "Transaction logs"]
  }
};
export { CONFIGS };

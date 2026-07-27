import React from "react";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

export const RESIGN_REASONS = [
  "Better Opportunity", "Personal Reasons", "Higher Studies", "Health Issues",
  "Relocation", "Retirement", "Family Commitment", "Salary Dissatisfaction",
  "Work Environment", "Other",
];

export const STATUS_CFG = {
  pending:   { bg: "#fff7ed", border: "#f18200", color: "#c2410c", icon: <Clock size={16} />,        label: "Resignation Pending Review" },
  accepted:  { bg: "#f0fdf4", border: "#22c55e", color: "#15803d", icon: <CheckCircle2 size={16} />, label: "Resignation Accepted" },
  rejected:  { bg: "#fef2f2", border: "#ef4444", color: "#dc2626", icon: <XCircle size={16} />,      label: "Resignation Rejected" },
  withdrawn: { bg: "#f8fafc", border: "#94a3b8", color: "#64748b", icon: <XCircle size={16} />,      label: "Resignation Withdrawn" },
};

export const SIDEBAR = [
  { id: "personal",   label: "Personal" },
  { id: "statutory",  label: "Accounts & Statutory" },
  { id: "family",     label: "Family" },
  { id: "employment", label: "Employment & Job" },
  { id: "assets",     label: "Assets" },
];

export const JUMP_LINKS = {
  personal:   ["Profile", "Personal", "Address", "Education"],
  statutory:  ["Bank Account", "PF Account", "Passport and Visa", "Other IDs"],
  family:     [],
  employment: ["Employment", "Job"],
  assets:     ["Access card details"],
};

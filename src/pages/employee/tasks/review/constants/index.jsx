import React from "react";
import {
  CheckCircle2, XCircle, Hourglass, ListFilter,
  Clock, Settings, Briefcase, Calendar, MailOpen, DollarSign,
} from "lucide-react";

export const STATUS_CONFIG = {
  approved:  { bg: "#dcfce7", color: "#15803d", border: "#22c55e", icon: <CheckCircle2 size={12} /> },
  rejected:  { bg: "#fee2e2", color: "#dc2626", border: "#ef4444", icon: <XCircle size={12} /> },
  pending:   { bg: "#fef9c3", color: "#ca8a04", border: "#facc15", icon: <Hourglass size={12} /> },
  cancelled: { bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1", icon: <XCircle size={12} /> },
  Approved:  { bg: "#dcfce7", color: "#15803d", border: "#22c55e", icon: <CheckCircle2 size={12} /> },
  Rejected:  { bg: "#fee2e2", color: "#dc2626", border: "#ef4444", icon: <XCircle size={12} /> },
  Pending:   { bg: "#fef9c3", color: "#ca8a04", border: "#facc15", icon: <Hourglass size={12} /> },
  Cancelled: { bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1", icon: <XCircle size={12} /> },
};

export const sc = (s) => STATUS_CONFIG[s || "pending"] || STATUS_CONFIG["pending"];

export const RESIGN_STATUS_CONFIG = {
  pending:     { bg: "#fef9c3", color: "#ca8a04", border: "#facc15" },
  rm_approved: { bg: "#dbeafe", color: "#1d4ed8", border: "#60a5fa" },
  rm_rejected: { bg: "#fee2e2", color: "#dc2626", border: "#ef4444" },
  accepted:    { bg: "#dcfce7", color: "#15803d", border: "#22c55e" },
  rejected:    { bg: "#fee2e2", color: "#dc2626", border: "#ef4444" },
  withdrawn:   { bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1" },
};

export const TICKET_STATUS_CONFIG = {
  open:          { bg: "#dbeafe", color: "#1d4ed8", border: "#60a5fa" },
  "in-progress": { bg: "#fef9c3", color: "#b45309", border: "#fcd34d" },
  pending:       { bg: "#fef9c3", color: "#ca8a04", border: "#facc15" },
  Forwarded:     { bg: "#ede9fe", color: "#6d28d9", border: "#a78bfa" },
  resolved:      { bg: "#dcfce7", color: "#15803d", border: "#22c55e" },
  closed:        { bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1" },
  Approved:      { bg: "#dcfce7", color: "#15803d", border: "#22c55e" },
  Rejected:      { bg: "#fee2e2", color: "#dc2626", border: "#ef4444" },
  Reopened:      { bg: "#fff7ed", color: "#c2410c", border: "#fb923c" },
};

export const SECTION_ICONS = {
  attendance:         <Clock size={12} />,
  "custom-workflows": <Settings size={12} />,
  empinfo:            <Briefcase size={12} />,
  leave:              <Calendar size={12} />,
  letter:             <MailOpen size={12} />,
  payroll:            <DollarSign size={12} />,
};

export const TABS = [
  { key: "all",     label: "All",     icon: <ListFilter size={13} /> },
  { key: "pending", label: "Pending", icon: <Hourglass size={13} /> },
  { key: "decided", label: "Decided", icon: <CheckCircle2 size={13} /> },
];

export const showTabs = (dataType) =>
  ["leave-decisions", "regularization", "resignations", "helpdesk"].includes(dataType);

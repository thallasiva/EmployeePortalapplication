import React from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export const STATUS_CONFIG = {
  Approved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", icon: <CheckCircle2 size={12} /> },
  Pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-400", icon: <Clock size={12} /> },
  Rejected: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", dot: "bg-red-500", icon: <XCircle size={12} /> }
};

export const CLAIM_TYPES = ["Mobile / Internet", "Fuel", "LTA", "Medical", "Food", "Conveyance"];

export const HISTORY = [
  { date: "01 Jun 2026", type: "Mobile / Internet", amount: 1500, status: "Approved" },
  { date: "15 May 2026", type: "Fuel", amount: 2500, status: "Pending" },
  { date: "10 Apr 2026", type: "LTA", amount: 5000, status: "Approved" }
];

export const ENTITLEMENT_COLORS = ["#f18200", "#6366f1", "#10b981", "#3b82f6", "#a855f7"];

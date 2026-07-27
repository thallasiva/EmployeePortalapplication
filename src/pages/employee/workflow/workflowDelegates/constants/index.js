import React from "react";
import {
  FileOutput, Clock, ClipboardList, Award, UserCheck,
  CheckCircle2, AlertCircle, Timer,
} from "lucide-react";

export const WORKFLOWS = [
  {
    id: "leave",
    label: "Leave Requests",
    desc: "Approve / reject employee leave applications",
    icon: <FileOutput size={18} />,
    color: "#f18200",
    bg: "#fff7ed",
  },
  {
    id: "attendance",
    label: "Attendance Regularization",
    desc: "Review and approve attendance correction requests",
    icon: <Clock size={18} />,
    color: "#6366f1",
    bg: "#eef2ff",
  },
  {
    id: "timesheet",
    label: "Timesheet Approvals",
    desc: "Approve weekly timesheets and extra-work requests",
    icon: <ClipboardList size={18} />,
    color: "#10b981",
    bg: "#f0fdf4",
  },
  {
    id: "appraisal",
    label: "Appraisal Reviews",
    desc: "Review and submit appraisal feedback for direct reports",
    icon: <Award size={18} />,
    color: "#a855f7",
    bg: "#faf5ff",
  },
  {
    id: "resignation",
    label: "Resignation Approvals",
    desc: "Acknowledge and process resignation requests",
    icon: <UserCheck size={18} />,
    color: "#ef4444",
    bg: "#fef2f2",
  },
];

export const STATUS_STYLE = {
  active: { bg: "#f0fdf4", color: "#16a34a", label: "Active", icon: <CheckCircle2 size={11} /> },
  upcoming: { bg: "#fff7ed", color: "#c2410c", label: "Upcoming", icon: <Timer size={11} /> },
  expired: { bg: "#f8fafc", color: "#94a3b8", label: "Expired", icon: <AlertCircle size={11} /> },
};

import React from "react";
import { FileOutput, Clock, ClipboardList, Award, UserCheck } from "lucide-react";
const WORKFLOWS = [{
  id: "leave",
  label: "Leave Requests",
  desc: "Approve / reject employee leave applications",
  icon: <FileOutput size={18} />,
  color: "#e87500",
  bg: "#fff7ed"
}, {
  id: "attendance",
  label: "Attendance Regularization",
  desc: "Review and approve attendance correction requests",
  icon: <Clock size={18} />,
  color: "#e87500",
  bg: "#fff7ed"
}, {
  id: "timesheet",
  label: "Timesheet Approvals",
  desc: "Approve weekly timesheets and extra-work requests",
  icon: <ClipboardList size={18} />,
  color: "#10b981",
  bg: "#f0fdf4"
}, {
  id: "appraisal",
  label: "Appraisal Reviews",
  desc: "Review and submit appraisal feedback for direct reports",
  icon: <Award size={18} />,
  color: "#a855f7",
  bg: "#faf5ff"
}, {
  id: "resignation",
  label: "Resignation Approvals",
  desc: "Acknowledge and process resignation requests",
  icon: <UserCheck size={18} />,
  color: "#ef4444",
  bg: "#fef2f2"
}];
export { WORKFLOWS };

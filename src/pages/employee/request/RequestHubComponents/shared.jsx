import { Calendar, Clock, Home, Shield, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
// ── Static sample data ────────────────────────────────────────────────────────
// ── Static sample data ────────────────────────────────────────────────────────
const REQUESTS = [{
  id: 1,
  type: "leave",
  icon: Calendar,
  label: "Leave Request",
  title: "Casual Leave",
  date: "2026-07-28",
  status: "Approved",
  detail: "1 day · Jul 28"
}, {
  id: 2,
  type: "regularization",
  icon: Clock,
  label: "Attendance Regularization",
  title: "Regularization – Jul 25",
  date: "2026-07-25",
  status: "Pending",
  detail: "Worked 4h 20m"
}, {
  id: 3,
  type: "wfh",
  icon: Home,
  label: "Work From Home",
  title: "WFH Request",
  date: "2026-07-22",
  status: "Approved",
  detail: "Full day"
}, {
  id: 4,
  type: "permission",
  icon: Shield,
  label: "Permission",
  title: "Early exit – doctor visit",
  date: "2026-07-18",
  status: "Rejected",
  detail: "2h early exit"
}, {
  id: 5,
  type: "leave",
  icon: Calendar,
  label: "Leave Request",
  title: "Sick Leave",
  date: "2026-07-10",
  status: "Approved",
  detail: "1 day · Jul 10"
}, {
  id: 6,
  type: "regularization",
  icon: Clock,
  label: "Attendance Regularization",
  title: "Regularization – Jul 08",
  date: "2026-07-08",
  status: "Approved",
  detail: "Worked 5h 10m"
}, {
  id: 7,
  type: "wfh",
  icon: Home,
  label: "Work From Home",
  title: "WFH Request",
  date: "2026-07-05",
  status: "Pending",
  detail: "Half day – PM"
}, {
  id: 8,
  type: "other",
  icon: FileText,
  label: "Other Request",
  title: "Letter of Employment",
  date: "2026-06-30",
  status: "Approved",
  detail: "Requested document"
}];
const TABS = [{
  key: "all",
  label: "All",
  count: REQUESTS.length
}, {
  key: "leave",
  label: "Leave",
  count: REQUESTS.filter(r => r.type === "leave").length
}, {
  key: "regularization",
  label: "Regularization",
  count: REQUESTS.filter(r => r.type === "regularization").length
}, {
  key: "wfh",
  label: "Work From Home",
  count: REQUESTS.filter(r => r.type === "wfh").length
}, {
  key: "permission",
  label: "Permission",
  count: REQUESTS.filter(r => r.type === "permission").length
}, {
  key: "other",
  label: "Other",
  count: REQUESTS.filter(r => r.type === "other").length
}];
const STATUS_CONFIG = {
  Approved: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  Pending: {
    icon: AlertCircle,
    color: "text-amber-500",
    bg: "bg-amber-50 text-amber-700 border-amber-200"
  },
  Rejected: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50 text-red-700 border-red-200"
  }
};
const TYPE_COLORS = {
  leave: "bg-blue-50 text-blue-600",
  regularization: "bg-orange-50 text-[#e87500]",
  wfh: "bg-purple-50 text-purple-600",
  permission: "bg-teal-50 text-teal-600",
  other: "bg-slate-50 text-slate-600"
};
const SUMMARY_STATS = [{
  label: "Total Requests",
  value: REQUESTS.length,
  color: " text-[#e87500]",
  bg: "bg-white"
}, {
  label: "Approved",
  value: REQUESTS.filter(r => r.status === "Approved").length,
  color: "text-emerald-600",
  bg: "bg-emerald-50"
}, {
  label: "Pending",
  value: REQUESTS.filter(r => r.status === "Pending").length,
  color: "text-amber-600",
  bg: "bg-amber-50"
}, {
  label: "Rejected",
  value: REQUESTS.filter(r => r.status === "Rejected").length,
  color: "text-red-500",
  bg: "bg-red-50"
}];
export { REQUESTS, TABS, STATUS_CONFIG, TYPE_COLORS, SUMMARY_STATS };

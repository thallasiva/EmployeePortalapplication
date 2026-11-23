import React from "react";
import { Users, LayoutDashboard, ClipboardList, UserPlus, User, Clock, TreePalm, FilePen, ChartColumn, Tag, Timer, Wallet, TrendingUp, FileText, Download, CircleCheck, Target, Briefcase, MessagesSquare, Star, FileStack, FolderOpen, Ticket, Rocket, Link2, Building2, BriefcaseBusiness, Forward, ShieldCheck, Settings, Wrench, Mail, Bell, Palette, Lock } from "lucide-react";
const MENU_TREE = [{
  id: "dashboard",
  label: "Dashboard",
  icon: <LayoutDashboard size={16} />,
  children: []
}, {
  id: "employees",
  label: "Employees",
  icon: <Users size={16} />,
  children: [{
    id: "emp-list",
    label: "Employee List",
    icon: <ClipboardList size={14} />
  }, {
    id: "emp-create",
    label: "Create Employee",
    icon: <UserPlus size={14} />
  }, {
    id: "emp-detail",
    label: "Employee Details",
    icon: <User size={14} />
  }]
}, {
  id: "attendance",
  label: "Attendance",
  icon: <Clock size={16} />,
  children: []
}, {
  id: "leave",
  label: "Leave Management",
  icon: <TreePalm size={16} />,
  children: [{
    id: "leave-req",
    label: "Leave Requests",
    icon: <FilePen size={14} />
  }, {
    id: "leave-bal",
    label: "Leave Balances",
    icon: <ChartColumn size={14} />
  }, {
    id: "leave-type",
    label: "Leave Types",
    icon: <Tag size={14} />
  }]
}, {
  id: "timesheets",
  label: "Timesheets",
  icon: <Timer size={16} />,
  children: []
}, {
  id: "payroll",
  label: "Payroll",
  icon: <Wallet size={16} />,
  children: [{
    id: "pay-overview",
    label: "Overview",
    icon: <TrendingUp size={14} />
  }, {
    id: "pay-payslips",
    label: "Payslips",
    icon: <FileText size={14} />
  }, {
    id: "pay-ytd",
    label: "YTD Reports",
    icon: <ChartColumn size={14} />
  }, {
    id: "pay-inputs",
    label: "Payroll Inputs",
    icon: <Download size={14} />
  }, {
    id: "pay-comply",
    label: "Compliance",
    icon: <CircleCheck size={14} />
  }]
}, {
  id: "recruitment",
  label: "Recruitment",
  icon: <Target size={16} />,
  children: [{
    id: "rec-jobs",
    label: "Job Postings",
    icon: <Briefcase size={14} />
  }, {
    id: "rec-cands",
    label: "Candidates",
    icon: <User size={14} />
  }, {
    id: "rec-inter",
    label: "Interviews",
    icon: <MessagesSquare size={14} />
  }]
}, {
  id: "performance",
  label: "Performance",
  icon: <Star size={16} />,
  children: []
}, {
  id: "reports",
  label: "Reports",
  icon: <FileStack size={16} />,
  children: []
}, {
  id: "documents",
  label: "Documents",
  icon: <FolderOpen size={16} />,
  children: []
}, {
  id: "helpdesk",
  label: "Helpdesk",
  icon: <Ticket size={16} />,
  children: []
}, {
  id: "onboarding",
  label: "Onboarding",
  icon: <Rocket size={16} />,
  children: []
}, {
  id: "workflow",
  label: "Workflow & Hierarchy",
  icon: <Link2 size={16} />,
  children: [{
    id: "wf-org",
    label: "Org Hierarchy",
    icon: <Building2 size={14} />
  }, {
    id: "wf-mgrs",
    label: "Reporting Managers",
    icon: <BriefcaseBusiness size={14} />
  }, {
    id: "wf-deleg",
    label: "Delegation",
    icon: <Forward size={14} />
  }]
}, {
  id: "role-mgmt",
  label: "Role Management",
  icon: <ShieldCheck size={16} />,
  children: []
}, {
  id: "settings",
  label: "Settings",
  icon: <Settings size={16} />,
  children: [{
    id: "set-gen",
    label: "General Settings",
    icon: <Wrench size={14} />
  }, {
    id: "set-email",
    label: "Email Configuration",
    icon: <Mail size={14} />
  }, {
    id: "set-notif",
    label: "Notification Settings",
    icon: <Bell size={14} />
  }, {
    id: "set-audit",
    label: "Audit Logs",
    icon: <ClipboardList size={14} />
  }]
}, {
  id: "form-builder",
  label: "Form Builder",
  icon: <FilePen size={16} />,
  children: []
}, {
  id: "report-builder",
  label: "Report Builder",
  icon: <ChartColumn size={16} />,
  children: []
}, {
  id: "dash-builder",
  label: "Dashboard Builder",
  icon: <Palette size={16} />,
  children: []
}, {
  id: "menu-perm",
  label: "Menu Permissions",
  icon: <Lock size={16} />,
  children: []
}, {
  id: "notif-center",
  label: "Notification Center",
  icon: <Bell size={16} />,
  children: []
}];
// Build default: Admin=all, others restricted
export { MENU_TREE };

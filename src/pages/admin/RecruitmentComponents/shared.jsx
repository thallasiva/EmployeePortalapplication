import { LayoutDashboard, Briefcase, Users, CalendarCheck, FileCheck, BarChart3, Bot } from "lucide-react";
const TABS = {
  1: [{
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard
  }, {
    key: "jobs",
    label: "Jobs",
    icon: Briefcase
  }, {
    key: "candidates",
    label: "Candidates",
    icon: Users
  }, {
    key: "interviews",
    label: "Interviews",
    icon: CalendarCheck
  }, {
    key: "offers",
    label: "Offers",
    icon: FileCheck
  },
  // { key: "onboarding", label: "Onboarding", icon: CheckSquare },
  {
    key: "reports",
    label: "Reports",
    icon: BarChart3
  }, {
    key: "ai-interview",
    label: "AI Interview",
    icon: Bot
  }],
  3: [{
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard
  }, {
    key: "jobs",
    label: "Jobs",
    icon: Briefcase
  }, {
    key: "candidates",
    label: "Candidates",
    icon: Users
  }, {
    key: "interviews",
    label: "Interviews",
    icon: CalendarCheck
  }, {
    key: "offers",
    label: "Offers",
    icon: FileCheck
  },
  //  { key: "onboarding", label: "Onboarding", icon: CheckSquare }
  {
    key: "ai-interview",
    label: "AI Interview",
    icon: Bot
  }],
  4: [{
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard
  }, {
    key: "jobs",
    label: "Jobs",
    icon: Briefcase
  }, {
    key: "candidates",
    label: "Candidates",
    icon: Users
  }],
  5: [{
    key: "dashboard",
    label: "My Dashboard",
    icon: LayoutDashboard
  }, {
    key: "jobs",
    label: "My Jobs",
    icon: Briefcase
  }, {
    key: "candidates",
    label: "Candidates",
    icon: Users
  }, {
    key: "interviews",
    label: "Interviews",
    icon: CalendarCheck
  }, {
    key: "ai-interview",
    label: "AI Interview",
    icon: Bot
  }]
};
export { TABS };

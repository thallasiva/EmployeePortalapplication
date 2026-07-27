import {
  BarChart2, GitBranch, UserCheck, AlertTriangle,
  ArrowRightLeft, Shield, History,
} from "lucide-react";

export const BRAND = "#f18200";
export const BL = "#fff8f0";

export const TABS = [
  { key: "overview", label: "Overview", icon: BarChart2 },
  { key: "hierarchy", label: "Org Hierarchy", icon: GitBranch },
  { key: "managers", label: "Reporting Managers", icon: UserCheck },
  { key: "unassigned", label: "Unassigned", icon: AlertTriangle },
  { key: "transfer", label: "Manager Transfer", icon: ArrowRightLeft },
  { key: "delegation", label: "Delegation", icon: Shield },
  { key: "history", label: "Audit History", icon: History },
];

export const URL_TAB_MAP = {
  org: "hierarchy",
  managers: "managers",
  transfer: "transfer",
  delegation: "delegation",
  audit: "history",
  unassigned: "unassigned",
  overview: "overview",
};

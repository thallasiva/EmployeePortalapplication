import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import
{
  Home,
  Users,
  Building,
  Calendar,
  LogOut,
  Settings,
  Headphones,
  FileOutput,

  UserPen,
  Proportions,
  Radio,
  LayoutGrid,
  ClipboardList,
  HandCoins,
  SquareCheck,
  UserRoundPlus,
  BookOpen,
  UserRound,
  Info,
  Layers,
  GitBranch,
  Clock,
  ChevronDown,
  ChevronRight,
  FileText,
  Network,
  IdCard,
  Award,
  UserSearch,
} from "lucide-react";
import { getStoredUser, isAdmin, isReportingManager, isRecruitmentRole, isRecruiterLead, ROLE_ADMIN, logoutUser } from "../data/auth";
import { getAppraisalCycle } from "../api/appraisal.api";

const BRAND_NAME = "NAT IT";

const isPathActive = (pathname, link, search = "") =>
{
  if (!link) return false;
  // Split query string from link
  const [linkPath, linkQuery] = link.split("?");
  const normalized = pathname.replace(/\/$/, "") || "/";
  const target = linkPath.replace(/\/$/, "") || "/";

  if (
    target === "/dashboard" ||
    target === "/employee/home" ||
    target === "/employee/engage" ||
    target === "/manager"
  )
  {
    return normalized === target && (!linkQuery || search.includes(linkQuery));
  }

  const pathMatch = normalized === target || normalized.startsWith(`${target}/`);
  // If the link has a query param (e.g. ?tab=balances), also match that
  if (linkQuery) return pathMatch && search.includes(linkQuery);
  return pathMatch;
};

export const Sidebar = ({ open }) =>
{
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [expanded, setExpanded] = useState(null);

  const user = getStoredUser();
  const role = user?.role ?? ROLE_ADMIN;

  const [appraisalActive, setAppraisalActive] = useState(false);
  useEffect(() =>
  {
    if (!isAdmin(user))
    {
      getAppraisalCycle()
        .then(cycle => setAppraisalActive(cycle?.status === "active"))
        .catch(() => setAppraisalActive(false));
    }
  }, [pathname]);

  const adminItems = [
    // ── Core ──────────────────────────────────────────────
    {
      label: "Dashboard",
      icon: <Home size={20} />,
      navigationLink: "/dashboard",
    },
    {
      label: "Employees",
      icon: <Users size={20} />,
      navigationLink: "/dashboard/employee",
    },
    // ── Time & Attendance ──────────────────────────────────
    {
      label: "Attendance",
      icon: <Clock size={20} />,
      navigationLink: "/dashboard/attendance",
    },
    {
      label: "Leave",
      icon: <FileOutput size={20} />,
      children: [
        { label: "Leave Requests", navigationLink: "/dashboard/leave?tab=requests" },
        { label: "Leave Balances", navigationLink: "/dashboard/leave?tab=balances" },
        { label: "Leave Types", navigationLink: "/dashboard/leave?tab=types" },
      ],
    },
    {
      label: "Timesheets",
      icon: <Clock size={20} />,
      navigationLink: "/dashboard/timesheets",
    },
    {
      label: "Calendar",
      icon: <Calendar size={20} />,
      navigationLink: "/dashboard/calendar",
    },
    // ── Compensation ───────────────────────────────────────
    {
      label: "Payroll",
      icon: <FileText size={20} />,
      navigationLink: "/dashboard/payroll",
    },
    {
      label: "Payroll Inputs",
      icon: <HandCoins size={20} />,
      children: [
        { label: "Salary Structures", navigationLink: "/dashboard/payroll/salary" },
        { label: "Salary Revisions", navigationLink: "/dashboard/payroll/setup?tab=revision" },
        { label: "Income Tax", navigationLink: "/dashboard/it-declaration" },
        { label: "Reimbursement", navigationLink: "/dashboard/payroll/ytd?tab=reimb" },
        { label: "Loan & Advances", navigationLink: "/employee/payroll/loans" },
        { label: "Employee LOP Days", navigationLink: "/dashboard/payroll/inputs?tab=lop" },
        { label: "Overtime Register", navigationLink: "/dashboard/payroll/inputs?tab=overtime" },
        { label: "Arrears", navigationLink: "/dashboard/payroll/inputs?tab=arrears" },
        { label: "Final Settlement", navigationLink: "/dashboard/payroll/inputs?tab=settlement" },
        { label: "Stop Salary Processing", navigationLink: "/dashboard/payroll/inputs?tab=stop" },
      ],
    },
    {
      label: "Verify",
      icon: <BookOpen size={20} />,
      children: [
        { label: "Quick Salary Statement", navigationLink: "/dashboard/payroll/statement?tab=quick" },
        { label: "Payroll Statement", navigationLink: "/dashboard/payroll/statement?tab=statement" },
        { label: "CTC Payslip", navigationLink: "/dashboard/payroll/statement?tab=ctc" },
        { label: "Payroll Differences", navigationLink: "/dashboard/payroll/statement?tab=diff" },
      ],
    },
    {
      label: "Published Info",
      icon: <BookOpen size={20} />,
      children: [
        { label: "Payslip", navigationLink: "/dashboard/payroll/payslips" },
        { label: "CTC Payslip", navigationLink: "/dashboard/payroll/statement?tab=ctc" },
        { label: "YTD Summary", navigationLink: "/dashboard/payroll/ytd?tab=ytd" },
        { label: "PF YTD Statement", navigationLink: "/dashboard/payroll/ytd?tab=pf-ytd" },
        { label: "Reimbursement Statement", navigationLink: "/dashboard/payroll/ytd?tab=reimb" },
        { label: "Loan Statement", navigationLink: "/employee/payroll/loans" },
        { label: "IT Statement", navigationLink: "/employee/payroll/it-statement" },
        { label: "IT Declaration", navigationLink: "/dashboard/it-declaration" },
      ],
    },
    {
      label: "Payroll Admin",
      icon: <Layers size={20} />,
      children: [
        { label: "Form 16", navigationLink: "/dashboard/payroll/tax-forms?tab=form16" },
        { label: "Form 24Q", navigationLink: "/dashboard/payroll/tax-forms?tab=form24q" },
        { label: "Employee IT Declaration", navigationLink: "/dashboard/it-declaration" },
        { label: "PAN Status", navigationLink: "/dashboard/payroll/compliance?tab=pan" },
        { label: "Revision Planner", navigationLink: "/dashboard/payroll/setup?tab=revision" },
        { label: "Remittances", navigationLink: "/dashboard/payroll/compliance?tab=remittances" },
        { label: "Payroll Release", navigationLink: "/dashboard/payroll/compliance?tab=release" },
        { label: "POI Overview", navigationLink: "/dashboard/payroll/tax-forms?tab=poi" },
        { label: "PF KYC Mapping", navigationLink: "/dashboard/payroll/compliance?tab=pf-kyc" },
      ],
    },
    {
      label: "Payroll Setup",
      icon: <Layers size={20} />,
      children: [
        { label: "Salary Components", navigationLink: "/dashboard/payroll/setup?tab=components" },
        { label: "Payroll Settings", navigationLink: "/dashboard/payroll/setup?tab=settings" },
      ],
    },
    // ── People Ops ─────────────────────────────────────────
    {
      label: "Onboarding",
      icon: <UserRoundPlus size={20} />,
      navigationLink: "/dashboard/onboarding",
    },
    {
      label: "Appraisal",
      icon: <Award size={20} strokeWidth={1.75} />,
      navigationLink: "/dashboard/performance",
    },
    {
      label: "Resignations",
      icon: <LogOut size={20} strokeWidth={1.75} />,
      navigationLink: "/dashboard/resignations",
    },
    // ── Recruitment ────────────────────────────────────────
    {
      label: "Recruitment",
      icon: <UserSearch size={20} strokeWidth={1.75} />,
      navigationLink: "/dashboard/recruitment",
    },
    // ── Reporting & Docs ───────────────────────────────────
    {
      label: "Reports",
      icon: <Proportions size={20} />,
      navigationLink: "/dashboard/report",
    },
    {
      label: "Documents",
      icon: <BookOpen size={20} />,
      navigationLink: "/dashboard/documents",
    },
    // ── Support & Config ───────────────────────────────────
    {
      label: "Helpdesk",
      icon: <Headphones size={20} />,
      navigationLink: "/dashboard/helpdesk",
    },
    {
      label: "Company",
      icon: <Building size={20} />,
      navigationLink: "/dashboard/company",
    },
    {
      label: "Workflow & Hierarchy",
      icon: <Network size={20} />,
      children: [
        { label: "Org Hierarchy", navigationLink: "/dashboard/workflow-delegation" },
        { label: "Reporting Managers", navigationLink: "/dashboard/workflow-delegation" },
        { label: "Manager Transfer", navigationLink: "/dashboard/workflow-delegation" },
        { label: "Delegation", navigationLink: "/dashboard/workflow-delegation" },
        { label: "Audit History", navigationLink: "/dashboard/workflow-delegation" },
      ],
    },
    {
      label: "Settings",
      icon: <Settings size={20} />,
      navigationLink: "/dashboard/settings",
    },
    {
      label: "Profile",
      icon: <UserPen size={20} />,
      navigationLink: "/dashboard/profile",
    },
  ];

  const teamOverviewItem = {
    label: "Team Overview",
    icon: <Users size={20} strokeWidth={1.75} />,
    navigationLink: "/manager",
  };

  // Hiring sidebar for Recruiter Team Lead — full management access
  const hiringItemTL = {
    label: "Recruitment",
    icon: <UserRoundPlus size={20} strokeWidth={1.75} />,
    badge: "New",
    children: [
      { label: "Dashboard",   navigationLink: "/recruiter/recruitment?page=dashboard" },
      { label: "Jobs",        navigationLink: "/recruiter/recruitment?page=jobs" },
      { label: "Candidates",  navigationLink: "/recruiter/recruitment?page=candidates" },
      { label: "Interviews",  navigationLink: "/recruiter/recruitment?page=interviews" },
      { label: "Offers",      navigationLink: "/recruiter/recruitment?page=offers" },
      { label: "Onboarding",  navigationLink: "/recruiter/recruitment?page=onboarding" },
      { label: "Reports",     navigationLink: "/recruiter/recruitment?page=reports" },
    ],
  };

  // Hiring sidebar for Recruiter — limited to own tasks
  const hiringItemRecruiter = {
    label: "Recruitment",
    icon: <UserRoundPlus size={20} strokeWidth={1.75} />,
    badge: "New",
    children: [
      { label: "My Dashboard",  navigationLink: "/recruiter/recruitment?page=dashboard" },
      { label: "My Jobs",       navigationLink: "/recruiter/recruitment?page=jobs" },
      { label: "Candidates",    navigationLink: "/recruiter/recruitment?page=candidates" },
      { label: "Interviews",    navigationLink: "/recruiter/recruitment?page=interviews" },
    ],
  };

  const employeeItems = [
    // ── Core ──────────────────────────────────────────────
    {
      label: "Home",
      icon: <Home size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/home",
    },
    {
      label: "My Info",
      icon: <IdCard size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/my-info",
    },
    // ── Time & Attendance ──────────────────────────────────
    {
      label: "Attendance",
      icon: <SquareCheck size={20} strokeWidth={1.75} />,
      children: [
        { label: "Attendance Info", navigationLink: "/employee/attendance/daily" },
        { label: "My Regularizations", navigationLink: "/employee/attendance/regularizations" },
        { label: "Monthly Attendance", navigationLink: "/employee/attendance/monthly" },
        { label: "Shift Roster", navigationLink: "/employee/attendance/shifts" },
      ],
    },
    {
      label: "Leave",
      icon: <Calendar size={20} strokeWidth={1.75} />,
      children: [
        { label: "Leave Balance", navigationLink: "/employee/leave/balance" },
        { label: "Apply Leave", navigationLink: "/employee/leave/apply" },
        { label: "Leave Calendar", navigationLink: "/employee/leave/calendar" },
        { label: "Holiday Calendar", navigationLink: "/employee/leave/holiday-calendar" },
      ],
    },
    // ── Compensation ───────────────────────────────────────
    {
      label: "Salary",
      icon: <HandCoins size={20} strokeWidth={1.75} />,
      children: [
        { label: "Payslips", navigationLink: "/employee/payroll/payslips" },
        { label: "Salary Revision", navigationLink: "/employee/payroll/salary-revision" },
        { label: "IT Declaration", navigationLink: "/employee/payroll/it-declaration" },
        { label: "Proof of Investment", navigationLink: "/employee/payroll/claims" },
        { label: "IT Statement", navigationLink: "/employee/payroll/it-statement" },
        { label: "YTD Reports", navigationLink: "/employee/payroll/ytd-reports" },
        { label: "Reimbursements", navigationLink: "/employee/payroll/reimbursements" },
        { label: "Loans and Advances", navigationLink: "/employee/payroll/loans" },
      ],
    },
    // ── Performance & Tasks ────────────────────────────────
    // Appraisal only shown when admin has an active rollout
    ...(appraisalActive ? [{
      label: "Appraisal",
      icon: <Award size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/appraisal",
    }] : []),
    {
      label: "To Do",
      icon: <ClipboardList size={20} strokeWidth={1.75} />,
      children: [
        { label: "Tasks", navigationLink: "/employee/todo/tasks" },
        { label: "Review", navigationLink: "/employee/todo/review" },
      ],
    },
    // ── People & Org ───────────────────────────────────────
    {
      label: "People",
      icon: <UserRound size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/people",
    },
    {
      label: "Organization Chart",
      icon: <Network size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/org-chart",
    },
    {
      label: "Engage",
      icon: <Radio size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/engage",
    },
    {
      label: "My Worklife",
      icon: <LayoutGrid size={20} strokeWidth={1.75} />,
      children: [
        { label: "Kudos", navigationLink: "/employee/worklife/kudos" },
        { label: "Feedback", navigationLink: "/employee/worklife/feedback" },
      ],
    },
    // ── Docs & Requests ────────────────────────────────────
    {
      label: "Document Center",
      icon: <BookOpen size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/documents",
    },
    {
      label: "Helpdesk",
      icon: <Headphones size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/helpdesk",
    },
    {
      label: "Request Hub",
      icon: <Layers size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/request-hub",
    },
    // ── Career & Exit ──────────────────────────────────────
    {
      label: "Hiring",
      icon: <UserRoundPlus size={20} strokeWidth={1.75} />,
      badge: "New",
      children: [
        { label: "Internal Jobs", navigationLink: "/employee/hiring" },
      ],
    },
    {
      label: "Resignation",
      icon: <LogOut size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/resignation",
    },
    // ── Config ─────────────────────────────────────────────
    {
      label: "Workflow Delegates",
      icon: <GitBranch size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/workflow-delegates",
    },
  ];

  // Build role-aware hiring entry for recruiter roles
  const hiringEntry = isRecruiterLead(user) ? hiringItemTL : hiringItemRecruiter;

  // Replace the plain "Hiring" entry in employeeItems with the role-expanded one for recruiters
  // For recruiter roles: Recruitment goes first, then remaining employee items
  const employeeItemsWithoutHiring = employeeItems.filter(item => item.label !== "Hiring");
  const employeeItemsForRecruiters = [hiringEntry, ...employeeItemsWithoutHiring];

  const items = isAdmin(user)
    ? adminItems
    : isReportingManager(user)
      ? [teamOverviewItem, ...employeeItems]
      : isRecruitmentRole(user)
        ? employeeItemsForRecruiters
        : employeeItems;
  const toggleAccordion = (index) =>
  {
    setExpanded(expanded === index ? null : index);
  };

  const handleLogout = () =>
  {
    logoutUser();
    navigate("/login");
  };

  useEffect(() =>
  {
    const activeIndex = items.findIndex(
      (item) =>
        item.children &&
        item.children.some((child) =>
          isPathActive(pathname, child.navigationLink, search)
        )
    );
    if (activeIndex >= 0)
    {
      setExpanded(activeIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- items derived from role
  }, [pathname, search, role]);

  const menuItemClass = (active, childActive = false) =>
    [
      "sidebar-menu-item",
      active ? "sidebar-menu-item-active" : "",
      childActive && !active ? "sidebar-menu-item-parent-active" : "",
      !open ? "justify-center px-2" : "",
      "cursor-pointer",
    ]
      .filter(Boolean)
      .join(" ");

  const childItemClass = (active) =>
    [
      "sidebar-child-item",
      active ? "sidebar-child-item-active" : "",
      "cursor-pointer",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <aside className={[
      "relative flex h-screen shrink-0 flex-col border-r border-[#f0f0f0] bg-white font-sans transition-[width] duration-200 ease-in-out",
      open ? "w-[248px]" : "w-[68px]",
    ].join(" ")}>

      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div className={[
        "flex min-h-[68px] items-center gap-2.5 border-b border-[#f5f5f5]",
        open ? "justify-start px-4 py-3" : "justify-center px-3.5 py-3",
      ].join(" ")}>
        
        {/* Fallback if logo fails to load */}
        <img
            src="https://www.natit.in/assets/images/logo.png"
            alt="logo"
          />
       
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2.5">
        {items.map((item, index) =>
        {
          const childActive = item.children?.some((child) =>
            isPathActive(pathname, child.navigationLink, search)
          );

          if (!item.children)
          {
            const active = isPathActive(pathname, item.navigationLink, search);
            return (
              <div key={index} className={menuItemClass(active)}
                onClick={() => navigate(item.navigationLink)}
                title={!open ? item.label : undefined}
              >
                <span className={[
                  "flex shrink-0",
                  active ? "text-white" : "text-gray-400",
                ].join(" ")}>
                  {React.cloneElement(item.icon, { size: 18 })}
                </span>
                {open && (
                  <>
                    <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="shrink-0 rounded-full bg-red-500 px-1.5 py-px text-[9px] font-bold tracking-wide text-white">{item.badge}</span>
                    )}
                  </>
                )}
              </div>
            );
          }

          return (
            <div key={index}>
              <div className={menuItemClass(false, childActive)}
                onClick={() => toggleAccordion(index)}
                title={!open ? item.label : undefined}
              >
                <span className={[
                  "flex shrink-0",
                  childActive ? "text-brand-500" : "text-gray-400",
                ].join(" ")}>
                  {React.cloneElement(item.icon, { size: 18 })}
                </span>
                {open && (
                  <>
                    <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="shrink-0 rounded-full bg-red-500 px-1.5 py-px text-[9px] font-bold text-white">{item.badge}</span>
                    )}
                    {expanded === index
                      ? <ChevronDown size={14} className="shrink-0 text-gray-400" />
                      : <ChevronRight size={14} className="shrink-0 text-gray-400" />}
                  </>
                )}
              </div>

              {expanded === index && open && (
                <div className="ml-3 mt-0.5 flex flex-col gap-px border-l-2 border-brand-100 pl-3">
                  {item.children.map((child, childIndex) =>
                  {
                    const isChildActive = isPathActive(pathname, child.navigationLink, search);
                    return (
                      <div key={childIndex} className={childItemClass(isChildActive)}
                        onClick={() =>
                        {
                          const [p, q] = child.navigationLink.split("?");
                          navigate(q ? `${p}?${q}` : p);
                        }}
                      >
                        {child.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── User footer ───────────────────────────────────────────────────── */}
      <div className="border-t border-[#f5f5f5] px-2 py-2.5">

        <button type="button"
          className={[
            "flex w-full items-center gap-2.5 rounded px-2 py-2 text-sm font-semibold text-red-500 transition hover:bg-rose-50",
            open ? "justify-start px-2.5" : "justify-center",
          ].join(" ")}
          onClick={handleLogout} title={!open ? "Logout" : undefined}>
          <LogOut size={17} />
          {open && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
};

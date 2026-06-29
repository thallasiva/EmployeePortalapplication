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
} from "lucide-react";
import { getStoredUser, isAdmin, isReportingManager, ROLE_ADMIN, logoutUser } from "../data/auth";
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

  // Appraisal menu is only visible when admin has rolled out an active cycle.
  // Re-check on every route change so disabling a cycle hides the tab immediately.
  const [appraisalActive, setAppraisalActive] = useState(false);
  useEffect(() => {
    if (!isAdmin(user)) {
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
        { label: "Leave Types",    navigationLink: "/dashboard/leave?tab=types" },
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
        { label: "Salary Structures",       navigationLink: "/dashboard/payroll/salary" },
        { label: "Salary Revisions",        navigationLink: "/dashboard/payroll/setup?tab=revision" },
        { label: "Income Tax",              navigationLink: "/dashboard/it-declaration" },
        { label: "Reimbursement",           navigationLink: "/dashboard/payroll/ytd?tab=reimb" },
        { label: "Loan & Advances",         navigationLink: "/employee/payroll/loans" },
        { label: "Employee LOP Days",       navigationLink: "/dashboard/payroll/inputs?tab=lop" },
        { label: "Overtime Register",       navigationLink: "/dashboard/payroll/inputs?tab=overtime" },
        { label: "Arrears",                 navigationLink: "/dashboard/payroll/inputs?tab=arrears" },
        { label: "Final Settlement",        navigationLink: "/dashboard/payroll/inputs?tab=settlement" },
        { label: "Stop Salary Processing",  navigationLink: "/dashboard/payroll/inputs?tab=stop" },
      ],
    },
    {
      label: "Verify",
      icon: <BookOpen size={20} />,
      children: [
        { label: "Quick Salary Statement",  navigationLink: "/dashboard/payroll/statement?tab=quick" },
        { label: "Payroll Statement",       navigationLink: "/dashboard/payroll/statement?tab=statement" },
        { label: "CTC Payslip",             navigationLink: "/dashboard/payroll/statement?tab=ctc" },
        { label: "Payroll Differences",     navigationLink: "/dashboard/payroll/statement?tab=diff" },
      ],
    },
    {
      label: "Published Info",
      icon: <BookOpen size={20} />,
      children: [
        { label: "Payslip",                 navigationLink: "/dashboard/payroll/payslips" },
        { label: "CTC Payslip",             navigationLink: "/dashboard/payroll/statement?tab=ctc" },
        { label: "YTD Summary",             navigationLink: "/dashboard/payroll/ytd?tab=ytd" },
        { label: "PF YTD Statement",        navigationLink: "/dashboard/payroll/ytd?tab=pf-ytd" },
        { label: "Reimbursement Statement", navigationLink: "/dashboard/payroll/ytd?tab=reimb" },
        { label: "Loan Statement",          navigationLink: "/employee/payroll/loans" },
        { label: "IT Statement",            navigationLink: "/employee/payroll/it-statement" },
        { label: "IT Declaration",          navigationLink: "/dashboard/it-declaration" },
      ],
    },
    {
      label: "Payroll Admin",
      icon: <Layers size={20} />,
      children: [
        { label: "Form 16",                 navigationLink: "/dashboard/payroll/tax-forms?tab=form16" },
        { label: "Form 24Q",                navigationLink: "/dashboard/payroll/tax-forms?tab=form24q" },
        { label: "Employee IT Declaration", navigationLink: "/dashboard/it-declaration" },
        { label: "PAN Status",              navigationLink: "/dashboard/payroll/compliance?tab=pan" },
        { label: "Revision Planner",        navigationLink: "/dashboard/payroll/setup?tab=revision" },
        { label: "Remittances",             navigationLink: "/dashboard/payroll/compliance?tab=remittances" },
        { label: "Payroll Release",         navigationLink: "/dashboard/payroll/compliance?tab=release" },
        { label: "POI Overview",            navigationLink: "/dashboard/payroll/tax-forms?tab=poi" },
        { label: "PF KYC Mapping",          navigationLink: "/dashboard/payroll/compliance?tab=pf-kyc" },
      ],
    },
    {
      label: "Payroll Setup",
      icon: <Layers size={20} />,
      children: [
        { label: "Salary Components",       navigationLink: "/dashboard/payroll/setup?tab=components" },
        { label: "Payroll Settings",        navigationLink: "/dashboard/payroll/setup?tab=settings" },
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
        { label: "Org Hierarchy",      navigationLink: "/dashboard/workflow-delegation" },
        { label: "Reporting Managers", navigationLink: "/dashboard/workflow-delegation" },
        { label: "Manager Transfer",   navigationLink: "/dashboard/workflow-delegation" },
        { label: "Delegation",         navigationLink: "/dashboard/workflow-delegation" },
        { label: "Audit History",      navigationLink: "/dashboard/workflow-delegation" },
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

  // const managerTimesheetItem = {
  //   label: "Timesheets",
  //   icon: <Clock size={20} strokeWidth={1.75} />,
  //   navigationLink: "/manager/timesheets",
  // };



  const managerHelpdeskItem = {
    label: "Helpdesk",
    icon: <Headphones size={20} strokeWidth={1.75} />,
    navigationLink: "/manager/helpdesk",
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
        { label: "Attendance Info",    navigationLink: "/employee/attendance/daily" },
        { label: "My Regularizations", navigationLink: "/employee/attendance/regularizations" },
        { label: "Monthly Attendance", navigationLink: "/employee/attendance/monthly" },
        { label: "Shift Roster",       navigationLink: "/employee/attendance/shifts" },
      ],
    },
    {
      label: "Leave",
      icon: <Calendar size={20} strokeWidth={1.75} />,
      children: [
        { label: "Leave Balance",    navigationLink: "/employee/leave/balance" },
        { label: "Apply Leave",      navigationLink: "/employee/leave/apply" },
        { label: "Leave Calendar",   navigationLink: "/employee/leave/calendar" },
        { label: "Holiday Calendar", navigationLink: "/employee/leave/holiday-calendar" },
      ],
    },
    // ── Compensation ───────────────────────────────────────
    {
      label: "Salary",
      icon: <HandCoins size={20} strokeWidth={1.75} />,
      children: [
        { label: "Payslips",           navigationLink: "/employee/payroll/payslips" },
        { label: "Salary Revision",    navigationLink: "/employee/payroll/salary-revision" },
        { label: "IT Declaration",     navigationLink: "/employee/payroll/it-declaration" },
        { label: "Proof of Investment",navigationLink: "/employee/payroll/claims" },
        { label: "IT Statement",       navigationLink: "/employee/payroll/it-statement" },
        { label: "YTD Reports",        navigationLink: "/employee/payroll/ytd-reports" },
        { label: "Reimbursements",     navigationLink: "/employee/payroll/reimbursements" },
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
        { label: "Tasks",  navigationLink: "/employee/todo/tasks" },
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
        { label: "Kudos",    navigationLink: "/employee/worklife/kudos" },
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

  const items = isAdmin(user)
    ? adminItems
    : isReportingManager(user)
      ? [teamOverviewItem, managerHelpdeskItem, ...employeeItems]
      : employeeItems;

  // managerTimesheetItem, ,

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
    ]
      .filter(Boolean)
      .join(" ");

  const childItemClass = (active) =>
    [
      "sidebar-child-item",
      active ? "sidebar-child-item-active" : "",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <aside style={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "#fff",
      borderRight: "1px solid #f0f0f0",
      transition: "width .25s cubic-bezier(.4,0,.2,1)",
      width: open ? 248 : 68,
      flexShrink: 0,
      fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif",
    }}>

      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: open ? "12px 16px" : "12px 14px",
        borderBottom: "1px solid #f5f5f5",
        minHeight: 68, gap: 10,
        justifyContent: open ? "flex-start" : "center",
      }}>
        {open ? (
          /* Expanded — full logo image */
          <img
            src="https://www.natit.in/assets/images/logo.png"
            alt="NAT IT"
            style={{ height: 44, maxWidth: 160, objectFit: "contain" }}
            onError={e => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : (
          /* Collapsed — small logo icon */
          <img
            src="https://www.natit.in/assets/images/logo.png"
            alt="NAT IT"
            style={{ width: 36, height: 36, objectFit: "contain" }}
            onError={e => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        )}
        {/* Fallback if logo fails to load */}
        <div style={{
          display: "none", width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: "linear-gradient(135deg,#f18200,#fb923c)",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(241,130,0,.35)",
        }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: -1 }}>N</span>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map((item, index) => {
          const childActive = item.children?.some((child) =>
            isPathActive(pathname, child.navigationLink, search)
          );

          if (!item.children) {
            const active = isPathActive(pathname, item.navigationLink, search);
            return (
              <div key={index} className={menuItemClass(active)}
                onClick={() => navigate(item.navigationLink)}
                title={!open ? item.label : undefined}
                style={{ minHeight: 38 }}>
                <span style={{ flexShrink: 0, color: active ? "#fff" : "#9ca3af", display: "flex" }}>
                  {React.cloneElement(item.icon, { size: 18 })}
                </span>
                {open && (
                  <>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span style={{
                        flexShrink: 0, fontSize: 9, fontWeight: 700, letterSpacing: ".04em",
                        padding: "1px 6px", borderRadius: 999, background: "#ef4444", color: "#fff"
                      }}>{item.badge}</span>
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
                style={{ minHeight: 38 }}>
                <span style={{ flexShrink: 0, color: childActive ? "#f18200" : "#9ca3af", display: "flex" }}>
                  {React.cloneElement(item.icon, { size: 18 })}
                </span>
                {open && (
                  <>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span style={{
                        flexShrink: 0, fontSize: 9, fontWeight: 700,
                        padding: "1px 6px", borderRadius: 999, background: "#ef4444", color: "#fff"
                      }}>{item.badge}</span>
                    )}
                    {expanded === index
                      ? <ChevronDown size={14} style={{ flexShrink: 0, color: "#9ca3af" }}/>
                      : <ChevronRight size={14} style={{ flexShrink: 0, color: "#9ca3af" }}/>}
                  </>
                )}
              </div>

              {expanded === index && open && (
                <div style={{ marginTop: 2, marginLeft: 12, paddingLeft: 12, borderLeft: "2px solid #ffedd5", display: "flex", flexDirection: "column", gap: 1 }}>
                  {item.children.map((child, childIndex) => {
                    const isChildActive = isPathActive(pathname, child.navigationLink, search);
                    return (
                      <div key={childIndex} className={childItemClass(isChildActive)}
                        onClick={() => {
                          const [p, q] = child.navigationLink.split("?");
                          navigate(q ? `${p}?${q}` : p);
                        }}
                        style={{ paddingLeft: 10, minHeight: 30 }}>
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
      <div style={{ padding: "10px 8px", borderTop: "1px solid #f5f5f5" }}>
        {/* {open && user && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 10px", borderRadius: 10, background: "#fafafa",
            marginBottom: 6, border: "1px solid #f0f0f0",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg,#f18200,#fb923c)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: "#fff",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name || "User"}
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "capitalize" }}>
                {user.role || "Admin"}
              </div>
            </div>
          </div>
        )} */}
        <button type="button"
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: open ? "8px 10px" : "8px", borderRadius: 8,
            justifyContent: open ? "flex-start" : "center",
            color: "#ef4444", fontSize: 12, fontWeight: 600,
            transition: "background .15s", cursor: "pointer",
            background: "none", border: "none",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#fff1f2"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
          onClick={handleLogout} title={!open ? "Logout" : undefined}>
          <LogOut size={17}/>
          {open && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
};
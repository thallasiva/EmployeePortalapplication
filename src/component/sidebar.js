import { useEffect, useState } from "react";
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

  const adminItems = [
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
    {
      label: "Company",
      icon: <Building size={20} />,
      navigationLink: "/dashboard/company",
    },
    {
      label: "Calendar",
      icon: <Calendar size={20} />,
      navigationLink: "/dashboard/calendar",
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
      label: "Attendance",
      icon: <Clock size={20} />,
      navigationLink: "/dashboard/attendance",
    },
    {
      label: "Documents",
      icon: <BookOpen size={20} />,
      navigationLink: "/dashboard/documents",
    },
    {
      label: "Reports",
      icon: <Proportions size={20} />,
      navigationLink: "/dashboard/report",
    },
    {
      label: "Payroll",
      icon: <FileText size={20} />,
      children: [
        { label: "Salary", navigationLink: "/dashboard/payroll" },
        { label: "Payslips", navigationLink: "/dashboard/payroll/payslips" },
        {
          label: "IT Declaration",
          // icon: <FileText size={20} strokeWidth={1.75} />,
          navigationLink: "/dashboard/it-declaration",
        },
      ],
    },
    {
      label: "Timesheets",
      icon: <Clock size={20} />,
      navigationLink: "/dashboard/timesheets",
    },
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
    {
      label: "Helpdesk",
      icon: <Headphones size={20} />,
      navigationLink: "/dashboard/helpdesk",
    },
    {
      label: "Settings",
      icon: <Settings size={20} />,
      navigationLink: "/dashboard/settings",
    },
    {
      label: "Workflow Delegates",
      icon: <GitBranch size={20} />,
      navigationLink: "/employee/workflow-delegates",
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

  const managerTimesheetItem = {
    label: "Timesheets",
    icon: <Clock size={20} strokeWidth={1.75} />,
    navigationLink: "/manager/timesheets",
  };

  const managerDelegatesItem = {
    label: "Workflow Delegates",
    icon: <GitBranch size={20} strokeWidth={1.75} />,
    navigationLink: "/employee/workflow-delegates",
  };

  const managerHelpdeskItem = {
    label: "Helpdesk",
    icon: <Headphones size={20} strokeWidth={1.75} />,
    navigationLink: "/manager/helpdesk",
  };

  const employeeItems = [
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
    {
      label: "To do",
      icon: <ClipboardList size={20} strokeWidth={1.75} />,
      children: [
        { label: "Tasks", navigationLink: "/employee/todo/tasks" },
        { label: "Review", navigationLink: "/employee/todo/review" },
      ],
    },
    {
      label: "Appraisal",
      icon: <Award size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/appraisal",
    },
    {
      label: "Resignation",
      icon: <LogOut size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/resignation",
    },
    {
      label: "Salary",
      icon: <HandCoins size={20} strokeWidth={1.75} />,
      children: [
        { label: "Payslips", navigationLink: "/employee/payroll/payslips" },
        { label: "YTD Reports", navigationLink: "/employee/payroll/ytd-reports" },
        { label: "IT Statement", navigationLink: "/employee/payroll/it-statement" },
        { label: "IT Declaration", navigationLink: "/employee/payroll/it-declaration" },
        { label: "Loans and Advances", navigationLink: "/employee/payroll/loans" },
        { label: "Reimbursements", navigationLink: "/employee/payroll/reimbursements" },
        { label: "Proof of Investment", navigationLink: "/employee/payroll/claims" },
        { label: "Salary Revision", navigationLink: "/employee/payroll/salary-revision" },
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
    {
      label: "Attendance",
      icon: <SquareCheck size={20} strokeWidth={1.75} />,
      children: [
        { label: "Attendance Info", navigationLink: "/employee/attendance/daily" },
        {
          label: "My Regularizations",
          navigationLink: "/employee/attendance/regularizations",
        },
        { label: "Monthly Attendance", navigationLink: "/employee/attendance/monthly" },
        { label: "Shift Roster", navigationLink: "/employee/attendance/shifts" },
      ],
    },
    {
      label: "Hiring",
      icon: <UserRoundPlus size={20} strokeWidth={1.75} />,
      badge: "New",
      children: [
        { label: "Internal Jobs", navigationLink: "/employee/hiring" },
      ],
    },
    {
      label: "Document Center",
      icon: <BookOpen size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/documents",
    },
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
      label: "Helpdesk",
      icon: <Info size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/helpdesk",
    },
    {
      label: "Request Hub",
      icon: <Layers size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/request-hub",
    },
  ];

  const items = isAdmin(user)
    ? adminItems
    : isReportingManager(user)
      ? [teamOverviewItem, managerTimesheetItem, managerHelpdeskItem, managerDelegatesItem, ...employeeItems]
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
    <aside
      className={`relative flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 ${open ? "w-64" : "w-[4.5rem]"
        }`}
    >
      {/* Logo */}
      <div className="flex items-start justify-start px-3 py-3 border-b border-gray-100 min-h-[4.5rem]">
        {open ? (
          <>
            <img
              src="https://www.natit.in/assets/images/logo.png"
              alt="NAT IT"
              style={{ height: 40, maxWidth: 140, objectFit: "contain" }}
              onError={e => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <div style={{ display: "none", flexDirection: "column", alignItems: "flex-start" }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>NAT <span style={{ color: "#f18200" }}>IT</span></span>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>HR PORTAL</span>
            </div>
          </>
        ) : (
          <img
            src="https://www.natit.in/assets/images/logo.png"
            alt="NAT IT"
            style={{ height: 32, width: 32, objectFit: "contain" }}
            onError={e => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {items.map((item, index) =>
        {
          const childActive = item.children?.some((child) =>
            isPathActive(pathname, child.navigationLink, search)
          );

          if (!item.children)
          {
            const active = isPathActive(pathname, item.navigationLink, search);
            return (
              <div
                key={index}
                className={menuItemClass(active)}
                onClick={() => navigate(item.navigationLink)}
                title={!open ? item.label : undefined}
              >
                <span className={active ? "text-white" : "text-gray-500"}>
                  {item.icon}
                </span>
                {open && (
                  <>
                    <span className="truncate flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="shrink-0 text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded bg-red-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          }

          return (
            <div key={index}>
              <div
                className={menuItemClass(false, childActive)}
                onClick={() => toggleAccordion(index)}
                title={!open ? item.label : undefined}
              >
                <span
                  className={
                    childActive ? "text-brand" : "text-gray-500"
                  }
                >
                  {item.icon}
                </span>
                {open && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="shrink-0 text-[10px] font-normal  tracking-wide px-1  rounded bg-red-500 text-white">
                        {item.badge}
                      </span>
                    )}
                    {expanded === index ? (
                      <ChevronDown size={16} className="shrink-0 text-gray-400" />
                    ) : (
                      <ChevronRight size={16} className="shrink-0 text-gray-400" />
                    )}
                  </>
                )}
              </div>

              {expanded === index && open && (
                <div className="mt-1 ml-3 pl-3 border-l-2 border-brand-100 space-y-0.5">
                  {item.children.map((child, childIndex) =>
                  {
                    const childActive = isPathActive(
                      pathname,
                      child.navigationLink,
                      search
                    );
                    return (
                      <div
                        key={childIndex}
                        className={childItemClass(childActive)}
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

      <div className="p-3 border-t border-gray-100">
        <button
          type="button"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ${!open ? "justify-center" : ""
            }`}
          onClick={handleLogout}
          title={!open ? "Logout" : undefined}
        >
          <LogOut size={20} />
          {open && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  Building,
  Calendar,
  LogOut,
  Settings,
  FileOutput,
  UserStar,
  UserPen,
  Proportions,
  ChartNoAxesGantt,
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
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { getStoredUser, isAdmin, ROLE_ADMIN } from "../data/auth";

const BRAND_NAME = "NAT IT";

const isPathActive = (pathname, link) => {
  if (!link) return false;
  const normalized = pathname.replace(/\/$/, "") || "/";
  const target = link.replace(/\/$/, "") || "/";

  if (
    target === "/dashboard" ||
    target === "/employee/home" ||
    target === "/employee/engage"
  ) {
    return normalized === target;
  }


  return normalized === target || normalized.startsWith(`${target}/`);
};

export const Sidebar = ({ open }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
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
      navigationLink: "/dashboard/leave",
    },
    {
      label: "Review",
      icon: <UserStar size={20} />,
      navigationLink: "/dashboard/review",
    },
    {
      label: "Report",
      icon: <Proportions size={20} />,
      navigationLink: "/dashboard/report",
    },
    {
      label: "Manage",
      icon: <ChartNoAxesGantt size={20} />,
      navigationLink: "/dashboard/manage",
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

  const employeeItems = [
    {
      label: "Home",
      icon: <Home size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/home",
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
      label: "Salary",
      icon: <HandCoins size={20} strokeWidth={1.75} />,
      children: [
        { label: "Payslips", navigationLink: "/employee/payroll/payslips" },
        { label: "IT Declaration", navigationLink: "/employee/payroll/it-declaration" },
        { label: "IT Statement", navigationLink: "/employee/payroll/it-statement" },
        { label: "Reimbursements", navigationLink: "/employee/payroll/reimbursements" },
        { label: "Proof of Investment", navigationLink: "/employee/payroll/claims" },
        { label: "Loans", navigationLink: "/employee/payroll/loans" },
        { label: "YTD Reports", navigationLink: "/employee/payroll/ytd-reports" },
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
        { label: "Overview", navigationLink: "/employee/hiring" },
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
      label: "Helpdesk",
      icon: <Info size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/helpdesk",
    },
    {
      label: "Request Hub",
      icon: <Layers size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/request-hub",
    },
    {
      label: "Workflow Delegates",
      icon: <GitBranch size={20} strokeWidth={1.75} />,
      navigationLink: "/employee/workflow-delegates",
    },
  ];

  const items = isAdmin(user) ? adminItems : employeeItems;

  const toggleAccordion = (index) => {
    setExpanded(expanded === index ? null : index);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    const activeIndex = items.findIndex(
      (item) =>
        item.children &&
        item.children.some((child) =>
          isPathActive(pathname, child.navigationLink)
        )
    );
    if (activeIndex >= 0) {
      setExpanded(activeIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- items derived from role
  }, [pathname, role]);

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
      className={`relative flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 ${
        open ? "w-64" : "w-[4.5rem]"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 min-h-[4.5rem]">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-sm shadow-sm">
          N
        </div>
        {open && (
          <div className="min-w-0">
            <p className="text-lg font-bold text-gray-900 tracking-tight leading-tight">
              {BRAND_NAME}
            </p>
            <p className="text-xs text-gray-500 font-medium">HR Portal</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {items.map((item, index) => {
          const childActive = item.children?.some((child) =>
            isPathActive(pathname, child.navigationLink)
          );

          if (!item.children) {
            const active = isPathActive(pathname, item.navigationLink);
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
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-red-500 text-white">
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
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-red-500 text-white">
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
                  {item.children.map((child, childIndex) => {
                    const childActive = isPathActive(
                      pathname,
                      child.navigationLink
                    );
                    return (
                      <div
                        key={childIndex}
                        className={childItemClass(childActive)}
                        onClick={() => navigate(child.navigationLink)}
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
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ${
            !open ? "justify-center" : ""
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

import { useEffect, useState } from "react";
import { Briefcase, Calendar, FileText, Settings, Star, User, Wallet } from "lucide-react";
import { getStoredUser } from "../../data/auth";
import { getCurrentUser } from "../../api/auth.api";
import { getEmployee } from "../../api/employee.api";
import { getDepartmentName } from "../../utils/employeeDisplay";
import { avatarDataUri } from "../../lib/placeholders";
import EmployeeProfile from "./EmployeeProfile";
import DetailsScreen from "./EmployeeDetailsProfile";
import { EmployeeDocument } from "./EmployeeDocument";
import PayrollReports from "./PayrollReports";
import ReviewForm from "./ReviewForm";
import SettingsForm from "./SettingsForm";
import TimeOff from "./TimeOff";
import "./adminProfile.css";

const TABS = [
  { id: "employment", label: "Employment", icon: Briefcase },
  { id: "details",    label: "Details",    icon: User },
  { id: "documents",  label: "Documents",  icon: FileText },
  { id: "payroll",    label: "Payroll",    icon: Wallet },
  { id: "timeoff",    label: "Time Off",   icon: Calendar },
  { id: "reviews",    label: "Reviews",    icon: Star },
  { id: "settings",   label: "Settings",   icon: Settings },
];

export default function Profile() {
  const storedUser = getStoredUser();
  const [active, setActive] = useState("employment");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // 1. Fetch /auth/me for the freshest user record
        const me = await getCurrentUser();

        // 2. If the user has an employee_id, fetch full employee record for dept/team/joining info
        let emp = null;
        if (me?.employee_id) {
          emp = await getEmployee(me.employee_id).catch(() => null);
        }

        setProfile({ me, emp });
      } catch {
        // Fall back to stored session data
        setProfile({ me: storedUser, emp: null });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const me  = profile?.me  || storedUser || {};
  const emp = profile?.emp || {};

  const displayName  = [emp.first_name, emp.last_name].filter(Boolean).join(" ") || me.name || me.email || "Admin User";
  const email        = emp.email        || me.email        || "—";
  const jobTitle     = emp.emp_job_title || me.role_name   || "Administrator";
  const department   = getDepartmentName(emp) || "—";
  const team         = emp.team_name    || emp.assigned_member || "—";
  const office       = emp.office       || "Head Office";
  const memberSince  = emp.emp_joining_date
    ? new Date(emp.emp_joining_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : me.created_at
      ? new Date(me.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : "—";
  const status       = emp.employee_status || "Active";
  const avatarSeed   = emp.employee_id || me.user_id || displayName.length || 1;

  const renderTab = () => {
    switch (active) {
      case "employment": return <EmployeeProfile />;
      case "details":    return <DetailsScreen />;
      case "documents":  return <EmployeeDocument />;
      case "payroll":    return <PayrollReports />;
      case "timeoff":    return <TimeOff />;
      case "reviews":    return <ReviewForm />;
      case "settings":   return <SettingsForm />;
      default:           return null;
    }
  };

  return (
    <div className="admin-profile">
      <div>
        <p className="admin-profile__breadcrumb">Home / Profile</p>
        <h1 className="admin-profile__page-title">My Profile</h1>
      </div>

      <section className="admin-profile__hero">
        <div className="admin-profile__cover">
          <button type="button" className="admin-profile__cover-btn">Edit Cover</button>
        </div>

        <div className="admin-profile__body">
          <div className="admin-profile__identity">
            {loading ? (
              <div className="admin-profile__avatar" style={{ background: "#f3f4f6" }} />
            ) : (
              <img className="admin-profile__avatar" src={avatarDataUri(avatarSeed, 80)} alt={displayName} />
            )}
            <div>
              <h2 className="admin-profile__name">{loading ? "Loading…" : displayName}</h2>
              <p className="admin-profile__role">{jobTitle}</p>
              <p className="admin-profile__email">{email}</p>
            </div>
          </div>
          <div className="admin-profile__badges">
            <span className={`admin-profile__badge ${status === "Active" ? "admin-profile__badge--active" : "admin-profile__badge--dept"}`}>
              {status}
            </span>
            {department !== "—" && (
              <span className="admin-profile__badge admin-profile__badge--dept">{department}</span>
            )}
          </div>
        </div>

        <div className="admin-profile__stats">
          <div className="admin-profile__stat">
            <p className="admin-profile__stat-value">{office}</p>
            <p className="admin-profile__stat-label">Office</p>
          </div>
          <div className="admin-profile__stat">
            <p className="admin-profile__stat-value">{team}</p>
            <p className="admin-profile__stat-label">Team</p>
          </div>
          <div className="admin-profile__stat">
            <p className="admin-profile__stat-value">{department}</p>
            <p className="admin-profile__stat-label">Department</p>
          </div>
          <div className="admin-profile__stat">
            <p className="admin-profile__stat-value">{memberSince}</p>
            <p className="admin-profile__stat-label">Member Since</p>
          </div>
        </div>
      </section>

      <nav className="admin-profile__tabs-wrap" aria-label="Profile sections">
        <div className="admin-profile__tabs">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} type="button"
                className={`admin-profile__tab ${active === tab.id ? "active" : ""}`}
                onClick={() => setActive(tab.id)}>
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="admin-profile__content">{renderTab()}</div>
    </div>
  );
}

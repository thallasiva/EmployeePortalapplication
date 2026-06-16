import { useState } from "react";
import {
  Briefcase,
  Calendar,
  FileText,
  Settings,
  Star,
  User,
  Wallet,
} from "lucide-react";
import { getStoredUser } from "../../data/auth";
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
  { id: "details", label: "Details", icon: User },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "payroll", label: "Payroll", icon: Wallet },
  { id: "timeoff", label: "Time Off", icon: Calendar },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "settings", label: "Settings", icon: Settings },
];

const ADMIN_PROFILE = {
  department: "Human Resources",
  team: "Administration",
  office: "Head Office",
  memberSince: "Jan 2024",
  jobTitle: "Super Admin",
};

export default function Profile() {
  const user = getStoredUser();
  const [active, setActive] = useState("employment");

  const displayName = user?.name || "Admin User";
  const email = user?.email || "admin@yopmail.com";

  const renderTab = () => {
    switch (active) {
      case "employment":
        return <EmployeeProfile />;
      case "details":
        return <DetailsScreen />;
      case "documents":
        return <EmployeeDocument />;
      case "payroll":
        return <PayrollReports />;
      case "timeoff":
        return <TimeOff />;
      case "reviews":
        return <ReviewForm />;
      case "settings":
        return <SettingsForm />;
      default:
        return null;
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
          <button type="button" className="admin-profile__cover-btn">
            Edit Cover
          </button>
        </div>

        <div className="admin-profile__body">
          <div className="admin-profile__identity">
            <img
              className="admin-profile__avatar"
              src={avatarDataUri(displayName.length, 80)}
              alt={displayName}
            />
            <div>
              <h2 className="admin-profile__name">{displayName}</h2>
              <p className="admin-profile__role">{ADMIN_PROFILE.jobTitle}</p>
              <p className="admin-profile__email">{email}</p>
            </div>
          </div>
          <div className="admin-profile__badges">
            <span className="admin-profile__badge admin-profile__badge--active">
              Active
            </span>
            <span className="admin-profile__badge admin-profile__badge--dept">
              {ADMIN_PROFILE.department}
            </span>
          </div>
        </div>

        <div className="admin-profile__stats">
          <div className="admin-profile__stat">
            <p className="admin-profile__stat-value">{ADMIN_PROFILE.office}</p>
            <p className="admin-profile__stat-label">Office</p>
          </div>
          <div className="admin-profile__stat">
            <p className="admin-profile__stat-value">{ADMIN_PROFILE.team}</p>
            <p className="admin-profile__stat-label">Team</p>
          </div>
          <div className="admin-profile__stat">
            <p className="admin-profile__stat-value">{ADMIN_PROFILE.department}</p>
            <p className="admin-profile__stat-label">Department</p>
          </div>
          <div className="admin-profile__stat">
            <p className="admin-profile__stat-value">{ADMIN_PROFILE.memberSince}</p>
            <p className="admin-profile__stat-label">Member Since</p>
          </div>
        </div>
      </section>

      <nav className="admin-profile__tabs-wrap" aria-label="Profile sections">
        <div className="admin-profile__tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`admin-profile__tab ${active === tab.id ? "active" : ""}`}
                onClick={() => setActive(tab.id)}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="admin-profile__content">{renderTab()}</div>
    </div>
  );
}

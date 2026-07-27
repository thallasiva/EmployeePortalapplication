import { useEffect, useState } from "react";
import {
  Briefcase, Calendar, FileText, Settings, Star, User, Wallet,
  MapPin, Phone, Globe, Mail, Building2 } from
"lucide-react";
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

import TimeOff from "./TimeOff";
import "./adminProfile.css";import { cssClass, joinClasses } from "../../utils/classStyles";

const TABS = [
{ id: "employment", label: "Employment", icon: Briefcase },
{ id: "details", label: "Details", icon: User },
{ id: "documents", label: "Documents", icon: FileText },
{ id: "payroll", label: "Payroll", icon: Wallet },
{ id: "timeoff", label: "Time Off", icon: Calendar },
{ id: "reviews", label: "Reviews", icon: Star }];




const NAT_SOFT = {
  name: "Nat Soft",
  address: "Plot No. 42, Tech Park Road, Madhapur",
  city: "Hyderabad, Telangana – 500081",
  phone: "+91 40 2345 6789",
  email: "hr@natsoft.in",
  web: "www.natsoft.in"
};

export default function Profile() {
  const storedUser = getStoredUser();
  const [active, setActive] = useState("employment");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const me = await getCurrentUser();
        let emp = null;
        if (me?.employee_id) {
          emp = await getEmployee(me.employee_id).catch(() => null);
        }
        setProfile({ me, emp });
      } catch {
        setProfile({ me: storedUser, emp: null });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const me = profile?.me || storedUser || {};
  const emp = profile?.emp || {};

  const displayName = [emp.first_name, emp.last_name].filter(Boolean).join(" ") || me.name || me.email || "Admin User";
  const email = emp.email || me.email || "—";
  const jobTitle = emp.emp_job_title || me.role_name || "Administrator";
  const shift = emp.shift || "General";
  const status = emp.employee_status || "Active";
  const avatarSeed = emp.employee_id || me.user_id || displayName.length || 1;
  const initial = displayName.charAt(0).toUpperCase();

  const renderTab = () => {
    switch (active) {
      case "employment":return <EmployeeProfile />;
      case "details":return <DetailsScreen />;
      case "documents":return <EmployeeDocument />;
      case "payroll":return <PayrollReports />;
      case "timeoff":return <TimeOff />;
      case "reviews":return <ReviewForm />;

      default:return null;
    }
  };

  return (
    <div className="admin-profile">
      {}
      <div>
        <p className="admin-profile__breadcrumb">Home / Profile</p>
        <h1 className="admin-profile__page-title">My Profile</h1>
      </div>

      {}
      <section className="admin-profile__hero">

        {}
        <div className="admin-profile__cover">
          {}
          <div className={cssClass({
            position: "absolute", right: -40, top: -40,
            width: 220, height: 220, borderRadius: "50%",
            background: "rgba(255,255,255,.08)"
          })} />
          <div className={cssClass({
            position: "absolute", right: 60, bottom: -60,
            width: 160, height: 160, borderRadius: "50%",
            background: "rgba(255,255,255,.06)"
          })} />
          <div className={cssClass({
            position: "absolute", left: 200, top: -30,
            width: 100, height: 100, borderRadius: "50%",
            background: "rgba(255,255,255,.05)"
          })} />

          {}
          <div className={cssClass({
            position: "absolute", bottom: 16, right: 20,
            display: "flex", alignItems: "center", gap: 8
          })}>
            <div className={cssClass({
              background: "rgba(255,255,255,.15)", backdropFilter: "blur(6px)",
              borderRadius: 8, padding: "6px 14px",
              fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-.01em",
              fontFamily: "'Plus Jakarta Sans','Inter',sans-serif"
            })}>
              {NAT_SOFT.name}
            </div>
          </div>

          <button type="button" className="admin-profile__cover-btn">Edit Cover</button>
        </div>

        {}
        <div className="admin-profile__body">
          <div className="admin-profile__identity">
            {loading ?
            <div className={joinClasses("admin-profile__avatar", cssClass({ background: "#f3f4f6" }))} /> :

            <div className={joinClasses("admin-profile__avatar", cssClass({
              background: "linear-gradient(135deg,#f18200,#fb923c)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 900, color: "#fff",
              fontFamily: "'Plus Jakarta Sans','Inter',sans-serif"
            }))}>
                {initial}
              </div>
            }
            <div>
              <h2 className="admin-profile__name">{loading ? "Loading…" : displayName}</h2>
              <p className="admin-profile__role">{jobTitle}</p>
              <p className="admin-profile__email">{email}</p>
            </div>
          </div>

          {}
          <div className="admin-profile__badges">
            <span className={cssClass({
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700,
              background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0"
            })}>
              <span className={cssClass({ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" })} />
              {status}
            </span>
            <span className={cssClass({
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700,
              background: "#fff8f0", color: "#f18200", border: "1px solid #fed7aa"
            })}>
              {shift.charAt(0).toUpperCase() + shift.slice(1)} Shift
            </span>
          </div>
        </div>

        {}
        <div className={cssClass({ padding: "0 1.5rem 1.5rem" })}>
          <div className={cssClass({
            display: "grid", gridTemplateColumns: "1fr auto",
            gap: 16, alignItems: "stretch",
            background: "linear-gradient(135deg,#fff8f0 0%,#fff 100%)",
            border: "1.5px solid #fed7aa", borderRadius: 14,
            padding: "18px 22px",
            boxShadow: "0 2px 12px rgba(241,130,0,.08)"
          })}>
            {}
            <div className={cssClass({ display: "flex", gap: 16, alignItems: "flex-start" })}>
              {}
              <div className={cssClass({
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: "linear-gradient(135deg,#f18200,#fb923c)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(241,130,0,.3)"
              })}>
                <Building2 size={22} color="#fff" />
              </div>

              <div>
                {}
                <div className={cssClass({ fontSize: 10, fontWeight: 800, color: "#f18200",
                  textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 3 })}>
                  Head Office
                </div>

                {}
                <div className={cssClass({
                  fontSize: 18, fontWeight: 900, color: "#111827",
                  fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
                  letterSpacing: "-.02em", lineHeight: 1.1
                })}>
                  {NAT_SOFT.name}
                </div>

                {}
                <div className={cssClass({ display: "flex", alignItems: "flex-start", gap: 5, marginTop: 8 })}>
                  <MapPin size={13} color="#f18200" className={cssClass({ marginTop: 2, flexShrink: 0 })} />
                  <div>
                    <div className={cssClass({ fontSize: 12, color: "#374151", fontWeight: 500, lineHeight: 1.5 })}>
                      {NAT_SOFT.address}
                    </div>
                    <div className={cssClass({ fontSize: 12, color: "#6b7280", lineHeight: 1.5 })}>
                      {NAT_SOFT.city}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div className={cssClass({
              display: "flex", flexDirection: "column", gap: 8,
              paddingLeft: 22, borderLeft: "1px solid #fed7aa",
              justifyContent: "center", minWidth: 200
            })}>
              <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
                <div className={cssClass({ width: 28, height: 28, borderRadius: 7, background: "#fff8f0",
                  border: "1px solid #fed7aa", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0 })}>
                  <Phone size={12} color="#f18200" />
                </div>
                <span className={cssClass({ fontSize: 12, color: "#374151", fontWeight: 500 })}>
                  {NAT_SOFT.phone}
                </span>
              </div>
              <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
                <div className={cssClass({ width: 28, height: 28, borderRadius: 7, background: "#fff8f0",
                  border: "1px solid #fed7aa", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0 })}>
                  <Mail size={12} color="#f18200" />
                </div>
                <span className={cssClass({ fontSize: 12, color: "#374151", fontWeight: 500 })}>
                  {NAT_SOFT.email}
                </span>
              </div>
              <div className={cssClass({ display: "flex", alignItems: "center", gap: 8 })}>
                <div className={cssClass({ width: 28, height: 28, borderRadius: 7, background: "#fff8f0",
                  border: "1px solid #fed7aa", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0 })}>
                  <Globe size={12} color="#f18200" />
                </div>
                <span className={cssClass({ fontSize: 12, color: "#f18200", fontWeight: 600 })}>
                  {NAT_SOFT.web}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {}
      <nav className="admin-profile__tabs-wrap" aria-label="Profile sections">
        <div className="admin-profile__tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} type="button"
              className={`admin-profile__tab ${active === tab.id ? "active" : ""}`}
              onClick={() => setActive(tab.id)}>
                <Icon size={15} /> {tab.label}
              </button>);

          })}
        </div>
      </nav>

      <div className="admin-profile__content">{renderTab()}</div>
    </div>);

}

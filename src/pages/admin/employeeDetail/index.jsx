import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BriefcaseBusiness,
  CreditCard,
  Landmark,
  MapPin,
  UserRound,
  WalletCards,
} from "lucide-react";
import { cssClass, joinClasses } from "../../../utils/classStyles";
import "../../../component/employee/employee.css";
import { useEmployeeDetail } from "./hooks/useEmployeeDetail";
import HeaderBar from "./components/HeaderBar";
import EmployeeHeroCard from "./components/EmployeeHeroCard";
import PersonalSection from "./components/PersonalSection";
import EmploymentSection from "./components/EmploymentSection";
import CompensationSection from "./components/CompensationSection";
import StatutorySection from "./components/StatutorySection";
import BankSection from "./components/BankSection";
import ContactSection from "./components/ContactSection";
import StickyFooter from "./components/StickyFooter";
import { BRAND } from "./constants";

const DETAIL_SECTIONS = [
  { id: "personal", label: "Personal", icon: UserRound },
  { id: "employment", label: "Employment", icon: BriefcaseBusiness },
  { id: "compensation", label: "Compensation", icon: WalletCards },
  { id: "statutory", label: "Statutory & ID", icon: Landmark },
  { id: "bank", label: "Bank details", icon: CreditCard },
  { id: "contact", label: "Contact", icon: MapPin },
];

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("personal");
  const {
    employee, loading, saving, editMode,
    form, bankForm, contForm,
    formErrors, touched,
    departments, managers,
    compBreakdown,
    set, setB, setC, touch,
    handleCtcChange,
    enterEdit, cancelEdit, handleSave,
  } = useEmployeeDetail(id);
  if (loading) {
    return (
      <div className={cssClass({ display: "flex", justifyContent: "center", padding: 60 })}>
        <div className={cssClass({ width: 40, height: 40, border: `3px solid ${BRAND}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" })} />
      </div>
    );
  }
  if (!employee) {
    return <div className={cssClass({ textAlign: "center", padding: 60, color: "#6b7280" })}>Employee not found.</div>;
  }
  const bd = employee.bankDetails || {};
  const ci = employee.contactInfo || {};
  const sections = {
    personal: <PersonalSection employee={employee} editMode={editMode} form={form} set={set} />,
    employment: <EmploymentSection employee={employee} editMode={editMode} form={form} formErrors={formErrors} touched={touched} set={set} touch={touch} departments={departments} managers={managers} />,
    compensation: <CompensationSection employee={employee} editMode={editMode} form={form} formErrors={formErrors} touched={touched} set={set} touch={touch} handleCtcChange={handleCtcChange} compBreakdown={compBreakdown} />,
    statutory: <StatutorySection employee={employee} editMode={editMode} form={form} formErrors={formErrors} touched={touched} set={set} touch={touch} />,
    bank: <BankSection bd={bd} editMode={editMode} bankForm={bankForm} setB={setB} />,
    contact: <ContactSection ci={ci} editMode={editMode} contForm={contForm} setC={setC} />,
  };
  const saveAndFocusErrors = async () => {
    const result = await handleSave();
    if (!result || typeof result !== "object") return;
    const invalidFields = Object.keys(result);
    if (invalidFields.some((field) => ["ctc", "base_salary"].includes(field))) {
      setActiveSection("compensation");
    } else if (invalidFields.some((field) => ["department_id", "emp_job_title", "emp_joining_date", "employee_type", "employee_status", "emp_exit_date"].includes(field))) {
      setActiveSection("employment");
    } else if (invalidFields.includes("aadhaar_number")) {
      setActiveSection("statutory");
    } else {
      setActiveSection("personal");
    }
  };
  return (
    <div className={joinClasses("emp-wizard", cssClass({ maxWidth: "none", margin: "0 auto", padding: "24px 16px" }))}>
      <HeaderBar editMode={editMode} saving={saving} onBack={() => navigate(-1)} onEdit={enterEdit} onCancel={cancelEdit} onSave={saveAndFocusErrors} />
      <EmployeeHeroCard employee={employee} editMode={editMode} form={form} formErrors={formErrors} touched={touched} set={set} touch={touch} />
      <div className="emp-wizard__card">
        <div className="emp-detail-tabs" role="group" aria-label="Employee details sections">
          {DETAIL_SECTIONS.map(({ id: sectionId, label, icon: Icon }) => (
            <button
              key={sectionId}
              type="button"
              className={`emp-detail-tab${activeSection === sectionId ? " is-active" : ""}`}
              aria-pressed={activeSection === sectionId}
              aria-controls="employee-detail-panel"
              onClick={() => setActiveSection(sectionId)}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div id="employee-detail-panel" className="emp-detail-panel" aria-live="polite">
          {sections[activeSection]}
        </div>
      </div>
      {editMode && <StickyFooter saving={saving} formErrors={formErrors} onCancel={cancelEdit} onSave={saveAndFocusErrors} />}
    </div>
  );
}

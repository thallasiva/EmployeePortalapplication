import React from "react";
import { useNavigate, useParams } from "react-router-dom";
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

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

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

  return (
    <div className={joinClasses("emp-wizard", cssClass({ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }))}>
      <HeaderBar editMode={editMode} saving={saving} onBack={() => navigate(-1)} onEdit={enterEdit} onCancel={cancelEdit} onSave={handleSave} />
      <EmployeeHeroCard employee={employee} editMode={editMode} form={form} formErrors={formErrors} touched={touched} set={set} touch={touch} />
      <div className="emp-wizard__card">
        <PersonalSection employee={employee} editMode={editMode} form={form} set={set} />
        <EmploymentSection employee={employee} editMode={editMode} form={form} formErrors={formErrors} touched={touched} set={set} touch={touch} departments={departments} managers={managers} />
        <CompensationSection employee={employee} editMode={editMode} form={form} formErrors={formErrors} touched={touched} set={set} touch={touch} handleCtcChange={handleCtcChange} compBreakdown={compBreakdown} />
        <StatutorySection employee={employee} editMode={editMode} form={form} formErrors={formErrors} touched={touched} set={set} touch={touch} />
        <BankSection bd={bd} editMode={editMode} bankForm={bankForm} setB={setB} />
        <ContactSection ci={ci} editMode={editMode} contForm={contForm} setC={setC} />
      </div>
      {editMode && <StickyFooter saving={saving} formErrors={formErrors} onCancel={cancelEdit} onSave={handleSave} />}
    </div>
  );
}

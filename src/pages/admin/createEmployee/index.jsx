import React from "react";
import "../../../component/employee/employee.css";
import SuccessModal from "../../../component/SuccessModal";
import { useCreateEmployee } from "./hooks/useCreateEmployee";
import WizardStepper from "./components/WizardStepper";
import WizardFooter from "./components/WizardFooter";
import StepPersonal from "./components/StepPersonal";
import StepEmployment from "./components/StepEmployment";
import StepCompensation from "./components/StepCompensation";
import StepBankStatutory from "./components/StepBankStatutory";
import StepReview from "./components/StepReview";

export default function CreateEmployee() {
  const {
    step,
    departments,
    members,
    values,
    errors,
    showSuccessModal,
    submitting,
    setField,
    goNext,
    goPrev,
    handleSubmit,
    navigate,
    setShowSuccessModal,
  } = useCreateEmployee();

  return (
    <div>
      <div className="emp-wizard__header">
        <h1>Add New Employee</h1>
        <p>Complete all steps to add a new employee to the organization.</p>
      </div>

      <WizardStepper step={step} />

      <div className="emp-wizard__card">
        {step === 0 && (
          <StepPersonal values={values} errors={errors} setField={setField} />
        )}
        {step === 1 && (
          <StepEmployment
            values={values}
            errors={errors}
            setField={setField}
            departments={departments}
            members={members}
          />
        )}
        {step === 2 && (
          <StepCompensation values={values} errors={errors} setField={setField} />
        )}
        {step === 3 && (
          <StepBankStatutory values={values} setField={setField} />
        )}
        {step === 4 && (
          <StepReview values={values} departments={departments} members={members} />
        )}
      </div>

      <WizardFooter
        step={step}
        submitting={submitting}
        onPrev={goPrev}
        onNext={goNext}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/dashboard/employee")}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        title="Success!"
        message="Employee created successfully."
        okLabel="Ok"
        onConfirm={() => navigate("/dashboard/employee")}
        onClose={() => navigate("/dashboard/employee")}
      />
    </div>
  );
}

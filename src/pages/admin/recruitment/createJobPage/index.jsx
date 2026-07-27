import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCreateJobForm } from "./hooks/useCreateJobForm";
import JobFormFields from "./components/JobFormFields";
import RecruiterSelector from "./components/RecruiterSelector";
import FormActions from "./components/FormActions";

export default function CreateJobPage() {
  const navigate = useNavigate();
  const {
    form,
    submitting,
    recruiters,
    isValid,
    handleChange,
    toggleRecruiter,
    resetForm,
    handleSubmit,
  } = useCreateJobForm();

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-[Inter,system-ui,sans-serif]">
      <div className="bg-[#f18200] px-8 py-[15px] text-center text-[19px] font-bold text-white shadow-[0_2px_6px_rgba(0,0,0,0.12)]">
        Create Job Request
      </div>

      <div className="px-8 pt-[14px]">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 bg-transparent p-0 text-[13px] font-semibold text-[#f18200] cursor-pointer border-0"
        >
          <ArrowLeft size={14} /> Back to Job Requests
        </button>
      </div>

      <div className="px-8 pb-10 pt-4">
        <div className="rounded-[10px] border border-gray-200 bg-white px-8 py-7 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <div className="mb-5 rounded-lg border-l-[3px] border-[#f18200] bg-[#fff7ed] px-3.5 py-2.5 text-[13px] text-[#92400e]">
            Fields marked <strong>*</strong> are mandatory.
          </div>

          <form onSubmit={handleSubmit}>
            <JobFormFields form={form} onChange={handleChange} />
            <RecruiterSelector
              recruiters={recruiters}
              assignedRecruiters={form.assignedRecruiters}
              onToggle={toggleRecruiter}
            />
            <FormActions isValid={isValid} submitting={submitting} onReset={resetForm} />
          </form>
        </div>
      </div>
    </div>
  );
}

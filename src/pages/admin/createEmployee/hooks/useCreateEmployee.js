import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createEmployee } from "../../../../api/employee.api";
import { listDepartments } from "../../../../api/department.api";
import { getManagers } from "../../../../api/orgHierarchy.api";
import { getErrorMessage } from "../../../../api/client";
import { apiErrorToast, errorToast } from "../../../../utils/ToastControllers";
import { INITIAL_VALUES, STEPS } from "../constants";
import { validateStep } from "../utils";

export function useCreateEmployee() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState([]);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listDepartments()
      .then(setDepartments)
      .catch((err) => apiErrorToast(err, "Failed to load departments"));
    getManagers()
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch((err) => apiErrorToast(err, "Failed to load managers"));
  }, []);

  const setField = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  const goNext = useCallback(() => {
    const stepErrors = validateStep(step, values);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [step, values]);

  const goPrev = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  const handleSubmit = useCallback(async () => {
    const allErrors = {
      ...validateStep(0, values),
      ...validateStep(1, values),
      ...validateStep(2, values),
    };
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setStep(0);
      return;
    }

    setSubmitting(true);
    try {
      await createEmployee({
        emp_code: values.employee_id,
        biometric_id: values.biometric_id || undefined,
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        mobile: values.mobile,
        department_id: Number(values.department_id),
        emp_job_title: values.emp_job_title,
        reporting_to: values.reporting_to === "none" ? null : Number(values.reporting_to),
        emp_joining_date: values.emp_joining_date,
        date_of_confirmation: values.date_of_confirmation || undefined,
        contract_end_date: values.contract_end_date || undefined,
        employee_type: values.employee_type,
        project_cost_centre: values.project_cost_centre || undefined,
        previous_designation: values.previous_designation || undefined,
        previous_employer: values.previous_employer || undefined,
        total_exp_before_joining: values.total_exp_before_joining
          ? Number(values.total_exp_before_joining)
          : undefined,
        bgv_status: values.bgv_status || undefined,
        assigned_member: values.assigned_member || undefined,
        ctc: values.ctc,
        benefits_plan: values.benefits_plan,
        role_id: Number(values.role) || 2,
        gender: values.gender || undefined,
        dob: values.dob || undefined,
        actual_dob: values.actual_dob || undefined,
        marital_status: values.marital_status || undefined,
        father_name: values.father_name || undefined,
        spouse_name: values.spouse_name || undefined,
        aadhaar_number: values.aadhaar_number || undefined,
        aadhaar_name: values.aadhaar_name || undefined,
        aadhaar_enrolment_number: values.aadhaar_enrolment_number || undefined,
        pan_number: values.pan_number || undefined,
        uan_number: values.uan_number || undefined,
        educational_qualification: values.educational_qualification || undefined,
        access_card_number: values.access_card_number || undefined,
        access_card_from_date: values.access_card_from_date || undefined,
        access_card_to_date: values.access_card_to_date || undefined,
        pf_number: values.pf_number || undefined,
        pf_join_date: values.pf_join_date || undefined,
        esi_number: values.esi_number || undefined,
        contactInfo: {
          contact_name: values.contact_name || undefined,
          contact_city: values.contact_city || undefined,
          contact_country: values.contact_country || undefined,
          personal_email: values.personal_email || undefined,
          alternate_mobile: values.alternate_mobile || undefined,
          emergency_contact_name: values.emergency_contact_name || undefined,
          emergency_contact_phone: values.emergency_contact_phone || undefined,
          permanent_address_line1: values.permanent_address_line1 || undefined,
          permanent_address_line2: values.permanent_address_line2 || undefined,
          permanent_address_line3: values.permanent_address_line3 || undefined,
        },
        bankDetails: {
          bank_name: values.bank_name || undefined,
          account_number: values.account_number || undefined,
          account_type: values.account_type || undefined,
          bank_branch: values.bank_branch || undefined,
          dd_payable_at: values.dd_payable_at || undefined,
          ifsc_code: values.ifsc_code || undefined,
          account_holder_name: values.account_holder_name || undefined,
          payment_type: values.payment_type || undefined,
          pan_number: values.pan_number || undefined,
          uan_number: values.uan_number || undefined,
        },
      });
      setShowSuccessModal(true);
    } catch (err) {
      apiErrorToast(err, "Failed to create employee");
    } finally {
      setSubmitting(false);
    }
  }, [values]);

  return {
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
  };
}

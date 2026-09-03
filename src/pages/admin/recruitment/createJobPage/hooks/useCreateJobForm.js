import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createJob, assignRecruiters, listRecruiters, getErrorMessage } from "../../../../../api/recruitment.api";
import { apiErrorToast, successToast, errorToast } from "../../../../../utils/ToastControllers";
import { BLANK } from "../constants/formConstants";

export function useCreateJobForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(BLANK);
  const [submitting, setSubmitting] = useState(false);
  const [recruiters, setRecruiters] = useState([]);

  useEffect(() => {
    listRecruiters()
      .then((rows) => setRecruiters(rows ?? []))
      .catch(() => {});
  }, []);

  const handleChange = useCallback((e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }, []);

  const toggleRecruiter = useCallback((id) => {
    setForm((f) => ({
      ...f,
      assignedRecruiters: f.assignedRecruiters.includes(id)
        ? f.assignedRecruiters.filter((r) => r !== id)
        : [...f.assignedRecruiters, id],
    }));
  }, []);

  const resetForm = useCallback(() => setForm(BLANK), []);

  const isValid = useMemo(
    () =>
      !!(
        form.title &&
        form.client &&
        form.positionType &&
        form.jobIdManual &&
        form.billRate &&
        form.payRate &&
        form.jobStatus &&
        form.businessUnit &&
        form.vacancies &&
        form.country &&
        form.skillSet &&
        form.description
      ),
    [form]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!isValid || submitting) return;
      setSubmitting(true);
      try {
        const job = await createJob({
          title: form.title,
          client: form.client,
          companyDept: form.companyDept || null,
          jobIdManual: form.jobIdManual,
          billRate: Number(form.billRate),
          billCurrency: form.billCurrency,
          billPeriod: form.billPeriod,
          payRate: Number(form.payRate),
          payCurrency: form.payCurrency,
          payPeriod: form.payPeriod,
          positionType: form.positionType,
          vacancies: Number(form.vacancies),
          city: form.city || null,
          country: form.country,
          experienceLevel: form.experienceLevel,
          jobStatus: form.jobStatus,
          businessUnit: form.businessUnit,
          assignmentStatus: form.assignmentStatus,
          opportunityPhone: form.opportunityPhone || null,
          skillSet: form.skillSet,
          description: form.description,
        });

        if (form.assignedRecruiters.length && job?.job_req_id) {
          try {
            await assignRecruiters(job.job_req_id, form.assignedRecruiters);
          } catch {}
        }
        successToast("Job request created successfully");
        navigate(-1);
      } catch (err) {
        apiErrorToast(err, "create job request");
      } finally {
        setSubmitting(false);
      }
    },
    [form, isValid, submitting, navigate]
  );

  return {
    form,
    submitting,
    recruiters,
    isValid,
    handleChange,
    toggleRecruiter,
    resetForm,
    handleSubmit,
  };
}

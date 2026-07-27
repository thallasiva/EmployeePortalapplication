import { useEffect, useMemo, useState, useCallback } from "react";
import { getEmployee, updateEmployee, updateBankDetails, updateContactInfo } from "../../../../api/employee.api";
import { getManagers } from "../../../../api/orgHierarchy.api";
import { listDepartments } from "../../../../api/department.api";
import { calculatePayslip } from "../../PayRollForm";
import { getErrorMessage } from "../../../../api/client";
import { errorToast, successToast } from "../../../../utils/ToastControllers";
import { employeeSchema } from "../constants";
import { toDateInput, cleanForm } from "../utils";

export function useEmployeeDetail(id) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({});
  const [bankForm, setBankForm] = useState({});
  const [contForm, setContForm] = useState({});

  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);

  const compBreakdown = useMemo(
    () => calculatePayslip(Number(form.base_salary) || 0),
    [form.base_salary]
  );

  const set = useCallback(
    (key) => (val) => {
      setForm((f) => {
        const next = { ...f, [key]: val };
        if (touched[key]) {
          employeeSchema
            .validateAt(key, next)
            .then(() => setFormErrors((e) => { const n = { ...e }; delete n[key]; return n; }))
            .catch((err) => setFormErrors((e) => ({ ...e, [key]: err.message })));
        }
        return next;
      });
    },
    [touched]
  );

  const setB = useCallback(
    (key) => (val) => setBankForm((f) => ({ ...f, [key]: val })),
    []
  );

  const setC = useCallback(
    (key) => (val) => setContForm((f) => ({ ...f, [key]: val })),
    []
  );

  const touch = useCallback(
    (key) => () => {
      setTouched((t) => ({ ...t, [key]: true }));
      employeeSchema
        .validateAt(key, form)
        .then(() => setFormErrors((e) => { const n = { ...e }; delete n[key]; return n; }))
        .catch((err) => setFormErrors((e) => ({ ...e, [key]: err.message })));
    },
    [form]
  );

  const handleCtcChange = useCallback(
    (annualCtc) => {
      set("ctc")(annualCtc);
      if (!annualCtc || Number(annualCtc) <= 0) { set("base_salary")(""); return; }
      const approxBasic = Math.round(Number(annualCtc) / 12 / 2.1);
      set("base_salary")(String(approxBasic));
    },
    [set]
  );

  useEffect(() => {
    setLoading(true);
    getEmployee(id)
      .then((data) => setEmployee(data))
      .catch((err) => errorToast(getErrorMessage(err, "Failed to load employee")))
      .finally(() => setLoading(false));
  }, [id]);

  const loadDropdowns = useCallback(async () => {
    try {
      const [depts, mgrs] = await Promise.all([listDepartments(), getManagers()]);
      setDepartments(
        (Array.isArray(depts) ? depts : []).map((d) => ({
          value: String(d.department_id),
          label: d.department_name,
        }))
      );
      setManagers(
        (Array.isArray(mgrs) ? mgrs : [])
          .filter((m) => String(m.employee_id) !== String(id))
          .map((m) => ({
            value: String(m.employee_id),
            label: m.full_name + (m.designation_name ? ` — ${m.designation_name}` : ""),
          }))
      );
    } catch {}
  }, [id]);

  const enterEdit = useCallback(() => {
    if (!employee) return;
    const e = employee;
    const b = e.bankDetails || {};
    const c = e.contactInfo || {};
    setForm({
      first_name: e.first_name || "", last_name: e.last_name || "",
      email: e.email || "", mobile: e.mobile || "",
      gender: e.gender || "", dob: toDateInput(e.dob),
      marital_status: e.marital_status || "", father_name: e.father_name || "",
      spouse_name: e.spouse_name || "", blood_group: e.blood_group || "",
      department_id: String(e.department_id || ""), emp_job_title: e.emp_job_title || "",
      reporting_to: String(e.reporting_to || ""),
      emp_joining_date: toDateInput(e.emp_joining_date),
      employee_type: e.employee_type || "Full-Time",
      employee_status: e.employee_status || "Active",
      emp_exit_date: toDateInput(e.emp_exit_date), location: e.location || "",
      ctc: e.ctc || "", base_salary: e.base_salary || "",
      benefits_plan: e.benefits_plan || "",
      aadhaar_number: e.aadhaar_number || "", aadhaar_name: e.aadhaar_name || "",
      aadhaar_enrolment_number: e.aadhaar_enrolment_number || "",
      pf_number: e.pf_number || "", pf_join_date: toDateInput(e.pf_join_date),
      esi_number: e.esi_number || "",
      access_card_number: e.access_card_number || "",
      access_card_from_date: toDateInput(e.access_card_from_date),
      access_card_to_date: toDateInput(e.access_card_to_date),
    });
    setBankForm({
      bank_name: b.bank_name || "", account_number: b.account_number || "",
      account_type: b.account_type || "", bank_branch: b.bank_branch || "",
      ifsc_code: b.ifsc_code || "", dd_payable_at: b.dd_payable_at || "",
      account_holder_name: b.account_holder_name || "", payment_type: b.payment_type || "",
      pan_number: b.pan_number || "", uan_number: b.uan_number || "",
    });
    setContForm({
      contact_name: c.contact_name || "", personal_email: c.personal_email || "",
      alternate_mobile: c.alternate_mobile || "", contact_city: c.contact_city || "",
      contact_country: c.contact_country || "",
      emergency_contact_name: c.emergency_contact_name || "",
      emergency_contact_phone: c.emergency_contact_phone || "",
      permanent_address_line1: c.permanent_address_line1 || "",
      permanent_address_line2: c.permanent_address_line2 || "",
      permanent_address_line3: c.permanent_address_line3 || "",
    });
    setFormErrors({});
    setTouched({});
    loadDropdowns();
    setEditMode(true);
  }, [employee, loadDropdowns]);

  const cancelEdit = useCallback(() => {
    setFormErrors({});
    setTouched({});
    setEditMode(false);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await employeeSchema.validate(form, { abortEarly: false });
      setFormErrors({});
    } catch (yupErr) {
      const errors = {};
      const allTouched = {};
      yupErr.inner.forEach((e) => { errors[e.path] = e.message; allTouched[e.path] = true; });
      setFormErrors(errors);
      setTouched((t) => ({ ...t, ...allTouched }));
      errorToast(`Please fix ${yupErr.inner.length} validation error${yupErr.inner.length > 1 ? "s" : ""} before saving`);
      return;
    }
    setSaving(true);
    try {
      const dateFields = ["dob", "emp_joining_date", "emp_exit_date", "pf_join_date", "access_card_from_date", "access_card_to_date"];
      await updateEmployee(id, cleanForm(form, dateFields));
      await updateBankDetails(id, bankForm);
      await updateContactInfo(id, contForm);
      const fresh = await getEmployee(id);
      setEmployee(fresh);
      setEditMode(false);
      setFormErrors({});
      setTouched({});
      successToast("Employee updated successfully");
    } catch (err) {
      errorToast(getErrorMessage(err, "Failed to update employee"));
    } finally {
      setSaving(false);
    }
  }, [form, bankForm, contForm, id]);

  return {
    employee, loading, saving, editMode,
    form, bankForm, contForm,
    formErrors, touched,
    departments, managers,
    compBreakdown,
    set, setB, setC, touch,
    handleCtcChange,
    enterEdit, cancelEdit, handleSave,
  };
}

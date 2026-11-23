import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, UserRoundPlus } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { getRolesForSelect, getCompaniesForSelect, getDepartmentsForSelect, getDesignationsForSelect } from "../../data/auth";
import { register as registerApi } from "../../api/auth.api";
import { apiErrorToast, successToast } from "../../utils/ToastControllers";
import AuthShell from "../../component/auth/AuthShell";
import { inputClassName, labelClassName } from "./shared";
import { Field } from "./Field";
import { SelectField } from "./SelectField";
import { FormSection } from "./FormSection";
const Register = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [roles, setRoles] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const genderOptions = [{
    label: "Male",
    value: "Male"
  }, {
    label: "Female",
    value: "Female"
  }, {
    label: "Other",
    value: "Others"
  }];
  useEffect(() => {
    setRoles(getRolesForSelect());
    setCompanies(getCompaniesForSelect());
    setDepartments(getDepartmentsForSelect());
  }, []);
  const formik = useFormik({
    initialValues: {
      company_id: "",
      first_name: "",
      last_name: "",
      username: "",
      email: "",
      mobile: "",
      department: "",
      designation: "",
      role: "",
      gender: "",
      address: "",
      password: "",
      confirmPassword: ""
    },
    validationSchema: Yup.object({
      company_id: Yup.string().required("Choose a company"),
      first_name: Yup.string().required("First name is required"),
      last_name: Yup.string().required("Last name is required"),
      username: Yup.string().required("Job title is required"),
      email: Yup.string().email("Enter a valid email").required("Email is required"),
      mobile: Yup.string().required("Mobile number is required"),
      department: Yup.string().required("Choose a department"),
      designation: Yup.string().required("Choose a designation"),
      role: Yup.string().required("Choose a role"),
      gender: Yup.string().required("Choose a gender"),
      address: Yup.string().required("Address is required"),
      password: Yup.string().required("Password is required"),
      confirmPassword: Yup.string().oneOf([Yup.ref("password")], "Passwords must match").required("Confirm your password")
    }),
    onSubmit: async (values, {
      setSubmitting
    }) => {
      try {
        await registerApi({
          email: values.email,
          password: values.password,
          firstName: values.first_name,
          lastName: values.last_name,
          mobile: values.mobile,
          roleId: Number(values.role) || 2,
          departmentId: values.department ? Number(values.department) : null,
          designationId: values.designation ? Number(values.designation) : null,
          empJobTitle: values.username || undefined
        });
        successToast("Registration successful. You can now sign in.");
        navigate("/login");
      } catch (err) {
        apiErrorToast(err, "Registration failed");
      } finally {
        setSubmitting(false);
      }
    }
  });
  const updateDesignations = department => {
    formik.setFieldValue("designation", "");
    setDesignations(department ? getDesignationsForSelect(department.value) : []);
  };
  return <AuthShell wide contentClassName="py-2">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <UserRoundPlus size={21} aria-hidden="true" />
        </div>
        <div>
          <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-orange-600">Get started</p>
          <h2 className="text-[1.45rem] font-extrabold tracking-[-0.02em]  text-[#e87500]">Create your account</h2>
          <p className="mt-1 text-[0.84rem] text-slate-500">Set up your profile to access the HRMS workspace.</p>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">
        <FormSection title="Account details" description="Your name and the best way to reach you.">
          <div className="grid gap-x-4 gap-y-3.5 sm:grid-cols-2">
            <SelectField label="Company" name="company_id" options={companies} formik={formik} />
            <Field label="Job title" name="username" formik={formik} autoComplete="organization-title" />
            <Field label="First name" name="first_name" formik={formik} autoComplete="given-name" />
            <Field label="Last name" name="last_name" formik={formik} autoComplete="family-name" />
            <Field label="Work email" name="email" formik={formik} type="email" autoComplete="email" />
            <Field label="Mobile number" name="mobile" formik={formik} type="tel" autoComplete="tel" />
          </div>
        </FormSection>

        <FormSection title="Work profile" description="Choose the team and access role for your account.">
          <div className="grid gap-x-4 gap-y-3.5 sm:grid-cols-2">
            <SelectField label="Department" name="department" options={departments} formik={formik} onChange={updateDesignations} />
            <SelectField label="Designation" name="designation" options={designations} formik={formik} />
            <SelectField label="Role" name="role" options={roles} formik={formik} />
            <SelectField label="Gender" name="gender" options={genderOptions} formik={formik} />
            <div className="sm:col-span-2">
              <label htmlFor="address" className={labelClassName}>Address</label>
              <textarea id="address" name="address" rows={2} value={formik.values.address} onChange={formik.handleChange} onBlur={formik.handleBlur} aria-invalid={Boolean(formik.touched.address && formik.errors.address)} className={`${inputClassName} resize-y ${formik.touched.address && formik.errors.address ? "border-red-400 bg-red-50/50" : ""}`} />
              {formik.touched.address && formik.errors.address && <p role="alert" className="mt-1 text-[0.76rem] text-red-600">{formik.errors.address}</p>}
            </div>
          </div>
        </FormSection>

        <FormSection title="Secure your account" description="Use a strong password that you don't use elsewhere.">
          <div className="grid gap-x-4 gap-y-3.5 sm:grid-cols-2">
            <Field label="Password" name="password" formik={formik} type="password" autoComplete="new-password" />
            <Field label="Confirm password" name="confirmPassword" formik={formik} type="password" autoComplete="new-password" />
          </div>
        </FormSection>

        <button type="submit" data-keep-button-style disabled={formik.isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-orange-500 to-orange-700 px-4 py-3 text-[0.92rem] font-bold tracking-[0.02em] text-white shadow-[0_6px_20px_rgba(232,117,0,0.22)] transition hover:-translate-y-px hover:shadow-[0_12px_28px_rgba(232,117,0,0.3)] disabled:cursor-not-allowed disabled:opacity-60">
          {formik.isSubmitting ? "Creating account…" : <>Create account <ArrowRight size={16} aria-hidden="true" /></>}
        </button>
      </form>

      <p className="mt-5 text-center text-[0.84rem] text-slate-500">
        Already have an account?{" "}
        <button type="button" onClick={() => navigate("/login")} className="font-bold text-orange-600 hover:text-orange-700">
          Sign in
        </button>
      </p>
    </AuthShell>;
};
export { Register };

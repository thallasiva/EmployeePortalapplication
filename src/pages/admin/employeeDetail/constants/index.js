import * as Yup from "yup";

export const BRAND = "#f18200";

export const baseInp = (hasErr) => ({
  border: `1px solid ${hasErr ? "#dc2626" : "#d1d5db"}`,
  borderRadius: 7,
  padding: "7px 10px",
  fontSize: 13,
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
  background: hasErr ? "#fff5f5" : "#fff",
  transition: "border-color .15s",
});

export const inp = baseInp(false);

export const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

export const MARITAL_OPTIONS = [
  { value: "Single", label: "Single" },
  { value: "Married", label: "Married" },
  { value: "Divorced", label: "Divorced" },
  { value: "Widowed", label: "Widowed" },
];

export const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
  (v) => ({ value: v, label: v })
);

export const EMPLOYEE_TYPE_OPTIONS = ["Full-Time", "Part-Time", "Contract", "Intern"].map(
  (v) => ({ value: v, label: v })
);

export const EMPLOYEE_STATUS_OPTIONS = ["Active", "Inactive", "Resigned", "Terminated"].map(
  (v) => ({ value: v, label: v })
);

export const ACCOUNT_TYPE_OPTIONS = ["Savings", "Current", "Salary"].map(
  (v) => ({ value: v, label: v })
);

export const PAYMENT_TYPE_OPTIONS = ["NEFT", "RTGS", "IMPS", "Cheque", "Cash"].map(
  (v) => ({ value: v, label: v })
);

export const employeeSchema = Yup.object({
  first_name: Yup.string().trim().required("First name is required"),
  last_name: Yup.string().nullable(),
  email: Yup.string().trim().email("Enter a valid email").required("Email is required"),
  mobile: Yup.string()
    .trim()
    .matches(/^[0-9+\s\-()]{7,15}$/, "Enter a valid mobile number")
    .required("Mobile is required"),
  gender: Yup.string().nullable(),
  dob: Yup.string().nullable(),
  marital_status: Yup.string().nullable(),
  blood_group: Yup.string().nullable(),
  department_id: Yup.string().required("Department is required"),
  emp_job_title: Yup.string().trim().required("Job title is required"),
  emp_joining_date: Yup.string().required("Date of joining is required"),
  employee_type: Yup.string().required("Employee type is required"),
  employee_status: Yup.string().required("Employee status is required"),
  emp_exit_date: Yup.string()
    .nullable()
    .test("exit-after-join", "Leaving date must be after joining date", function (val) {
      const { emp_joining_date } = this.parent;
      if (!val || !emp_joining_date) return true;
      return val > emp_joining_date;
    }),
  ctc: Yup.number().typeError("CTC must be a number").nullable().min(0, "CTC cannot be negative"),
  base_salary: Yup.number()
    .typeError("Base salary must be a number")
    .nullable()
    .min(0, "Base salary cannot be negative"),
  aadhaar_number: Yup.string().nullable().matches(/^[0-9]{12}$|^$/, "Aadhaar must be 12 digits"),
  pf_number: Yup.string().nullable(),
  esi_number: Yup.string().nullable(),
});

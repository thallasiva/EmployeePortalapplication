import { useFormik } from "formik";
import * as Yup from "yup";
import { useEffect, useState } from "react";
import {
    getRolesForSelect,
    getCompaniesForSelect,
    getDepartmentsForSelect,
    getDesignationsForSelect,
    registerUser,
} from "../data/auth";

/* ================= INPUT ================= */
const Input = ({ label, name, type = "text", formik }) => (
    <div className="w-1/2 px-2 mb-4">
        <label className="block text-sm text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            name={name}
            value={formik.values[name]}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full border rounded-lg px-4 py-2"
        />
        {formik.touched[name] && formik.errors[name] && (
            <p className="text-red-500 text-sm">{formik.errors[name]}</p>
        )}
    </div>
);

/* ================= TEXTAREA ================= */
const Textarea = ({ label, name, formik }) => (
    <div className="w-1/2 px-2 mb-4">
        <label className="block text-sm text-gray-700 mb-1">{label}</label>
        <textarea
            name={name}
            value={formik.values[name]}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full border rounded-lg px-4 py-2"
            rows={4}
        />
        {formik.touched[name] && formik.errors[name] && (
            <p className="text-red-500 text-sm">{formik.errors[name]}</p>
        )}
    </div>
);

/* ================= SELECT ================= */
const Select = ({ label, name, options, formik, onChange }) => (
    <div className="w-1/2 px-2 mb-4">
        <label className="block text-sm text-gray-700 mb-1">{label}</label>

        <select
            name={name}
            value={formik.values[name]}
            onChange={(e) =>
            {
                formik.handleChange(e);

                const selectedOption = options.find(
                    (opt) => String(opt.value) === String(e.target.value)
                );

                if (onChange)
                {
                    onChange(selectedOption);
                }
            }}
            onBlur={formik.handleBlur}
            className="w-full border rounded-lg px-4 py-2"
        >
            <option value="">Select</option>
            {options.map((opt) => (
                <option key={opt.id} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>

        {formik.touched[name] && formik.errors[name] && (
            <p className="text-red-500 text-sm">{formik.errors[name]}</p>
        )}
    </div>
);

/* ================= MAIN COMPONENT ================= */
const Register = () =>
{
    const [getCompiness, setCompiness] = useState([]);
    const [rolesList, setRolesList] = useState([]);
    const [getdesignationList, setdesignationList] = useState([]);
    const [getdepartmentList, setdepartmentList] = useState([]);

    const genderOptions = [
        { id: 1, label: "Male", value: "Male" },
        { id: 2, label: "Female", value: "Female" },
        { id: 2, label: "Others", value: "Others" },

    ];

    useEffect(() =>
    {
        setRolesList(getRolesForSelect());
        setCompiness(getCompaniesForSelect());
        setdepartmentList(getDepartmentsForSelect());
    }, []);

    const designationApi = (departmentId) =>
    {
        setdesignationList(getDesignationsForSelect(departmentId));
    };

    /* ================= HANDLE DEPARTMENT ================= */
    const handleDepartmentChange = (selectedOption) =>
    {
        if (selectedOption)
        {
            formik.setFieldValue("designation", "");
            designationApi(selectedOption.value);
        }
    };

    /* ================= FORMIK ================= */
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
            confirmPassword: "",
        },

        validationSchema: Yup.object({
            company_id: Yup.string().required(),
            first_name: Yup.string().required(),
            last_name: Yup.string().required(),
            username: Yup.string().required(),
            email: Yup.string().required(),
            mobile: Yup.string().required(),
            department: Yup.string().required(),
            designation: Yup.string().required(),
            role: Yup.string().required(),
            gender: Yup.string().required(),
            address: Yup.string().required(),
            password: Yup.string().required(),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref("password")])
                .required(),
        }),

        onSubmit: (values) =>
        {
            const { confirmPassword, ...payload } = values;
            registerUser(payload);
            alert("Registration saved successfully (static mode).");
        },
    });

    /* ================= UI ================= */
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-xl w-full max-w-5xl">

                <form onSubmit={formik.handleSubmit}>

                    {/* Company */}
                    <div className="flex flex-wrap">
                        <Select
                            label="Company"
                            name="company_id"
                            options={getCompiness}
                            formik={formik}
                        />
                    </div>

                    {/* Names */}
                    <div className="flex flex-wrap">
                        <Input label="First Name" name="first_name" formik={formik} />
                        <Input label="Last Name" name="last_name" formik={formik} />
                    </div>

                    {/* Login */}
                    <div className="flex flex-wrap">
                        <Input label="Username" name="username" formik={formik} />
                        <Input label="Email" name="email" formik={formik} />
                    </div>

                    {/* Department + Designation */}
                    <div className="flex flex-wrap">
                        <Select
                            label="Department"
                            name="department"
                            options={getdepartmentList}
                            formik={formik}
                            onChange={handleDepartmentChange}
                        />

                        <Select
                            label="Designation"
                            name="designation"
                            options={getdesignationList}
                            formik={formik}
                        />
                    </div>

                    {/* Mobile + Gender */}
                    <div className="flex flex-wrap">
                        <Input label="Mobile" name="mobile" formik={formik} />

                        <Select
                            label="Gender"
                            name="gender"
                            options={genderOptions}
                            formik={formik}
                        />
                    </div>

                    {/* Role + Address */}
                    <div className="flex flex-wrap">
                        <Select
                            label="Role"
                            name="role"
                            options={rolesList}
                            formik={formik}
                        />

                        <Textarea label="Address" name="address" formik={formik} />
                    </div>

                    {/* Password */}
                    <div className="flex flex-wrap">
                        <Input label="Password" name="password" type="password" formik={formik} />
                        <Input label="Confirm Password" name="confirmPassword" type="password" formik={formik} />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-brand text-white py-2 mt-4 rounded"
                    >
                        Register
                    </button>

                </form>
            </div>
        </div>
    );
};

export default Register;
import React, { useState } from 'react';

import SuccessModal from '../../component/SuccessModal';
import { addEmployee, getDepartments, getDesignations } from '../../data/employees';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { successToast } from '../../utils/ToastControllers';
import { useNavigate } from 'react-router-dom';
export default function CreateEmployee()
{

    const departments = getDepartments();
    const designations = getDesignations();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("Employee created successfully.");

    const [getWorkMode] = useState([
        { id: 'wfo', work_name: "Work From Office" },
        { id: 'remote', work_name: "Remote" },
        { id: 'hybrid', work_name: "Hybrid" }
    ]);
    const navigate = useNavigate();

    const createFormValidation = Yup.object({
        employee_type: Yup.string().required("Employee type is required"),
        first_name: Yup.string().required("First name is required"),
        last_name: Yup.string().required("Last name is required"),

        employee_id: Yup.number()
            .typeError("Employee ID must be number")
            .required("Employee ID is required"),

        email: Yup.string()
            .email("Invalid email format")
            .required("Email is required"),

        mobile: Yup.string()
            .matches(/^[0-9]+$/, "Only numbers allowed")
            .min(10, "Must be 10 digits")
            .max(10, "Must be 10 digits")
            .required("Mobile number is required"),

        address: Yup.string().required("Address is required"),

        department_id: Yup.string().required("Department is required"),

        designation_id: Yup.string().required("Designation is required"),

        emp_joining_date: Yup.string().required("Joining date is required"),

        emp_job_title: Yup.string().required("Job title is required"),

        reporting_to: Yup.string().required("Reporting manager is required"),

        employee_status: Yup.string().required("Employee status is required"),

        work_mode: Yup.string().required("Work mode is required"),

        currency_type: Yup.string().required("Currency type is required"),

        frequency: Yup.string().required("Frequency is required"),

        ctc: Yup.number()
            .typeError("Salary must be number")
            .required("Employee salary is required"),

        username: Yup.string().required("Username is required"),

        gender: Yup.string().required("Gender is required"),
    });
    const createEmployeeValidation = useFormik({
        initialValues: {
            employee_id: "",
            company_id: "1",
            employee_type: "",
            first_name: "",
            last_name: "",
            username: "",
            email: "",
            mobile: "",
            role: "",
            gender: "",
            department_id: "",
            designation_id: "",
            emp_country: "Ind",
            emp_job_title: "",
            emp_joining_date: "",
            address: "",
            ctc: "",
            reporting_to: "",
            employee_status: "",
            work_mode: "",
            currency_type: "",
            frequency: ""

        },
        validationSchema: createFormValidation,
        onSubmit: (values) =>
        {
            const response = addEmployee(values);
            successToast("Employee Created");
            setSuccessMessage(response.message);
            setShowSuccessModal(true);
        }
    })

    return (
        <div className="space-y-6">

            <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
                <h2 className="text-xl font-semibold">Create Employees</h2>
            </div>
            <form onSubmit={createEmployeeValidation.handleSubmit} >
                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="font-semibold mb-1">Basic Details</h3>
                    <p className="text-gray-500 text-sm mb-4">Organized and secure.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Employee Type</label>
                            <select
                                name="employee_type"
                                value={createEmployeeValidation.values.employee_type}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}
                                className={`w-full border rounded-lg px-3 py-2 ${createEmployeeValidation.touched.employee_type && createEmployeeValidation.errors.employee_type ? 'border-red-500' : ''}`}
                            >
                                <option value="" disabled>Select employee type</option>
                                <option value="Full-Time">Full-Time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                            </select>
                            {createEmployeeValidation.touched.employee_type && createEmployeeValidation.errors.employee_type && (
                                <p className="text-red-600 text-sm mt-1">{createEmployeeValidation.errors.employee_type}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Role</label>

                            <select
                                name="role"
                                value={createEmployeeValidation.values.role}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="" disabled>Select Role</option>
                                <option value="1">Admin</option>
                                <option value="2">HR</option>
                                <option value="3">Employee</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">First name</label>
                            <input
                                type="text"
                                name="first_name"
                                value={createEmployeeValidation.values.first_name}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}
                                className={`w-full border rounded-lg px-3 py-2 ${createEmployeeValidation.touched.first_name && createEmployeeValidation.errors.first_name ? 'border-red-500' : ''}`}
                                placeholder="First name"
                            />
                            {createEmployeeValidation.touched.first_name && createEmployeeValidation.errors.first_name && (
                                <p className="text-red-600 text-sm mt-1">{createEmployeeValidation.errors.first_name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Last name</label>
                            <input
                                type="text"
                                name="last_name"
                                value={createEmployeeValidation.values.last_name}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}
                                className={`w-full border rounded-lg px-3 py-2 ${createEmployeeValidation.touched.last_name && createEmployeeValidation.errors.last_name ? 'border-red-500' : ''}`}
                                placeholder="Last name"
                            />
                            {createEmployeeValidation.touched.last_name && createEmployeeValidation.errors.last_name && (
                                <p className="text-red-600 text-sm mt-1">{createEmployeeValidation.errors.last_name}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={createEmployeeValidation.values.username || ''}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="Username"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={createEmployeeValidation.values.email}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}
                                className={`w-full border rounded-lg px-3 py-2 ${createEmployeeValidation.touched.email && createEmployeeValidation.errors.email ? 'border-red-500' : ''}`}
                                placeholder="Enter email"
                            />
                            {createEmployeeValidation.touched.email && createEmployeeValidation.errors.email && (
                                <p className="text-red-600 text-sm mt-1">{createEmployeeValidation.errors.email}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Gender</label>

                            <select
                                name="gender"
                                value={createEmployeeValidation.values.gender}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}
                                className={`w-full border rounded-lg px-3 py-2 ${createEmployeeValidation.touched.gender &&
                                    createEmployeeValidation.errors.gender
                                    ? 'border-red-500'
                                    : ''
                                    }`}
                            >
                                <option value="" disabled>Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>

                            {createEmployeeValidation.touched.gender &&
                                createEmployeeValidation.errors.gender && (
                                    <p className="text-red-600 text-sm mt-1">
                                        {createEmployeeValidation.errors.gender}
                                    </p>
                                )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Employee Id</label>
                            <input
                                type="number"
                                name="employee_id"
                                value={createEmployeeValidation.values.employee_id}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}
                                className={`w-full border rounded-lg px-3 py-2 ${createEmployeeValidation.touched.employee_id && createEmployeeValidation.errors.employee_id ? 'border-red-500' : ''}`}
                                placeholder="Employee Id"
                            />
                            {createEmployeeValidation.touched.employee_id && createEmployeeValidation.errors.employee_id && (
                                <p className="text-red-600 text-sm mt-1">{createEmployeeValidation.errors.employee_id}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Mobile Number</label>
                            <input
                                type="text"
                                name="mobile"
                                value={createEmployeeValidation.values.mobile}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}
                                className={`w-full border rounded-lg px-3 py-2 ${createEmployeeValidation.touched.mobile && createEmployeeValidation.errors.mobile ? 'border-red-500' : ''}`}
                                placeholder="Mobile Number"
                            />
                            {createEmployeeValidation.touched.mobile && createEmployeeValidation.errors.mobile && (
                                <p className="text-red-600 text-sm mt-1">{createEmployeeValidation.errors.mobile}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Address</label>
                            <textarea
                                rows={3}
                                name="address"
                                value={createEmployeeValidation.values.address}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}
                                className={`w-full border rounded-lg px-3 py-2 ${createEmployeeValidation.touched.address && createEmployeeValidation.errors.address ? 'border-red-500' : ''}`}
                                placeholder="Address"
                            />
                            {createEmployeeValidation.touched.address && createEmployeeValidation.errors.address && (
                                <p className="text-red-600 text-sm mt-1">{createEmployeeValidation.errors.address}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6 mt-4">
                    <h3 className="font-semibold mb-1">Employee Details</h3>
                    <p className="text-gray-500 text-sm mb-4">Let everyone know the essentials so they're fully prepared.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Employee Role</label>
                            <select
                                name="department_id"
                                value={createEmployeeValidation.values.department_id}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}
                                className={`w-full border rounded-lg px-3 py-2 ${createEmployeeValidation.touched.department_id && createEmployeeValidation.errors.department_id ? 'border-red-500' : ''}`}
                            >
                                <option value="" disabled>Select department</option>
                                {departments?.map((item) => (
                                    <option key={item.department_id} value={item.department_id}>
                                        {item.department_name}
                                    </option>
                                ))}
                            </select>
                            {createEmployeeValidation.touched.department_id && createEmployeeValidation.errors.department_id && (
                                <p className="text-red-600 text-sm mt-1">{createEmployeeValidation.errors.department_id}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Employee Designation</label>
                            <select
                                name="designation_id"
                                value={createEmployeeValidation.values.designation_id}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}
                                className={`w-full border rounded-lg px-3 py-2 ${createEmployeeValidation.touched.designation_id && createEmployeeValidation.errors.designation_id ? 'border-red-500' : ''}`}
                            >
                                <option value="" disabled>Select designation</option>
                                {designations?.map((item) => (
                                    <option key={item.designation_id} value={item.designation_id}>
                                        {item.designation_name}
                                    </option>
                                ))}
                            </select>
                            {createEmployeeValidation.touched.designation_id && createEmployeeValidation.errors.designation_id && (
                                <p className="text-red-600 text-sm mt-1">{createEmployeeValidation.errors.designation_id}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Joining Date</label>
                            <input
                                type="date"
                                name="emp_joining_date"
                                value={createEmployeeValidation.values.emp_joining_date}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}
                                className={`w-full border rounded-lg px-3 py-2 ${createEmployeeValidation.touched.emp_joining_date && createEmployeeValidation.errors.emp_joining_date ? 'border-red-500' : ''}`}
                                placeholder="Start Date"
                            />
                            {createEmployeeValidation.touched.emp_joining_date && createEmployeeValidation.errors.emp_joining_date && (
                                <p className="text-red-600 text-sm mt-1">{createEmployeeValidation.errors.emp_joining_date}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Job Title</label>
                            <input
                                type="text"
                                name="emp_job_title"
                                value={createEmployeeValidation.values.emp_job_title}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}
                                className={`w-full border rounded-lg px-3 py-2 ${createEmployeeValidation.touched.emp_job_title && createEmployeeValidation.errors.emp_job_title ? 'border-red-500' : ''}`}
                                placeholder="Job Title"
                            />
                            {createEmployeeValidation.touched.emp_job_title && createEmployeeValidation.errors.emp_job_title && (
                                <p className="text-red-600 text-sm mt-1">{createEmployeeValidation.errors.emp_job_title}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Reporting To</label>
                            <input
                                type="text"
                                name="reporting_to"
                                value={createEmployeeValidation.values.reporting_to}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}
                                className={`w-full border rounded-lg px-3 py-2 ${createEmployeeValidation.touched.reporting_to && createEmployeeValidation.errors.reporting_to ? 'border-red-500' : ''}`}
                                placeholder="Reporting To"
                            />
                            {/* <select
                                name="reporting_to"
                                value={createEmployeeValidation.values.reporting_to}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}
                                className={`w-full border rounded-lg px-3 py-2 ${createEmployeeValidation.touched.reporting_to && createEmployeeValidation.errors.reporting_to ? 'border-red-500' : ''}`}
                            >
                                <option value="" disabled>Select manager</option>
                                <option value="One">One</option>
                                <option value="Two">Two</option>
                                <option value="Three">Three</option>
                            </select> */}
                            {createEmployeeValidation.touched.reporting_to && createEmployeeValidation.errors.reporting_to && (
                                <p className="text-red-600 text-sm mt-1">{createEmployeeValidation.errors.reporting_to}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Work Mode</label>
                            <select
                                name="work_mode"
                                value={createEmployeeValidation.values.work_mode || ''}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="" disabled>Select work mode</option>
                                {getWorkMode.map(item => (
                                    <option key={item.id} value={item.work_name}>{item.work_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Employee Status</label>
                            <select
                                name="employee_status"
                                value={createEmployeeValidation.values.employee_status}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}
                                className={`w-full border rounded-lg px-3 py-2 ${createEmployeeValidation.touched.employee_status && createEmployeeValidation.errors.employee_status ? 'border-red-500' : ''}`}
                            >
                                <option value="" disabled>Select status</option>
                                <option value="Active">Active</option>
                                <option value="Deactive">Deactive</option>
                            </select>
                            {createEmployeeValidation.touched.employee_status && createEmployeeValidation.errors.employee_status && (
                                <p className="text-red-600 text-sm mt-1">{createEmployeeValidation.errors.employee_status}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6 mt-4">
                    <h3 className="font-semibold mb-1">Salary Details</h3>
                    <p className="text-gray-500 text-sm mb-4">Stored securely, only visible to Super Admins, Payroll Admins, and themselves.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div>
                                <select
                                    name="currency_type"
                                    value={createEmployeeValidation.values.currency_type}
                                    onChange={createEmployeeValidation.handleChange}
                                    onBlur={createEmployeeValidation.handleBlur}
                                    className={`w-full border rounded-lg px-3 py-2 ${createEmployeeValidation.touched.currency_type && createEmployeeValidation.errors.currency_type ? 'border-red-500' : ''}`}
                                >
                                    <option value="" disabled>Select Currency Type</option>
                                    <option value="USD">USD</option>
                                    <option value="INR">INR</option>
                                </select>
                                {createEmployeeValidation.touched.currency_type && createEmployeeValidation.errors.currency_type && (
                                    <p className="text-red-600 text-sm mt-1">{createEmployeeValidation.errors.currency_type}</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <select className="w-full border rounded-lg px-3 py-2"
                                name="frequency"
                                value={createEmployeeValidation.values.frequency}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}>
                                <option value="" disabled>Select Frequency</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Yearly">Yearly</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Employee Salary</label>
                            <input
                                type="number"
                                name="ctc"
                                value={createEmployeeValidation.values.ctc}
                                onChange={createEmployeeValidation.handleChange}
                                onBlur={createEmployeeValidation.handleBlur}
                                className={`w-full border rounded-lg px-3 py-2 ${createEmployeeValidation.touched.ctc && createEmployeeValidation.errors.ctc ? 'border-red-500' : ''}`}
                                placeholder="Salary"
                            />
                            {createEmployeeValidation.touched.ctc && createEmployeeValidation.errors.ctc && (
                                <p className="text-red-600 text-sm mt-1">{createEmployeeValidation.errors.ctc}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button type="submit" className="px-6 py-2 bg-brand text-white rounded-lg">Add Team Member</button>
                    <button type="button" className="px-6 py-2 bg-red-600 rounded-lg text-white" onClick={() => navigate(-1)}>Cancel</button>
                </div>
            </form>

            <SuccessModal
                isOpen={showSuccessModal}
                title="Success!"
                message={successMessage}
                okLabel="Ok"
                onConfirm={() => setShowSuccessModal(false)}
                onClose={() => setShowSuccessModal(false)}
            />
        </div >
    );
}

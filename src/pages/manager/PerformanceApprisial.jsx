// import React from 'react'

import { useState } from "react";
import StarRating from "./StarRating";
import ManagerTabs from "./ManagerTabs";

// const PerformanceApprisial = () =>
// {
//     return (
//         <div>
//             <p> Apprisial Form </p>
//         </div>
//     )
// }

// export default PerformanceApprisial;

export default function PerformanceApprisial()
{
    // const parameters = [
    //     "Job Knowledge",
    //     "Productivity",
    //     "Interpersonal Skills",
    //     "Communication Skills",
    //     "Meeting Deadlines",
    //     "Accountability",
    //     "Attitude & Behaviour",
    //     "Attendance & Punctuality",
    // ];
    const [parameters, setParameters] = useState([
        {
            id: 1,
            title: "Job Knowledge / Functional or Technical Skills",
            description:
                "Measures employee’s demonstrated job relevant knowledge and essential skills, such as work practices, policies, procedures, resources, laws, customer service, and technical information, as well as the relationship of work to the organization’s mission. Also measured are the employee’s self-improvement efforts to enhance skills and knowledge and to stay current with changes impacting the job.",
            selfRating: 0,
            managerRating: 0,
        },
        {
            id: 2,
            title: "Productivity",
            description:
                "Measures employee’s results in meeting established objectives/expectations/standards of quality, quantity, customer service, and timeliness both individually and in a team.",
            selfRating: 0,
            managerRating: 0,
        },
        {
            id: 3,
            title: "Interpersonal Skills",
            description:
                "Measures employee’s development and maintenance of positive and constructive internal/external relationships. Consideration should be given to the employee’s demonstrated willingness to function as a team player, give and receive constructive criticism, accept supervision, resolve conflicts, recognize needs and sensitivities of others, and treat others in a fair and equitable manner. Supervisors and team leaders also are to be assessed on their demonstrated commitment to Equal Employment Opportunity, diversity, and proactive actions to prevent/address all forms of discrimination.",
            selfRating: 0,
            managerRating: 0,
        },
        {
            id: 4,
            title: "Communication Skills",
            description:
                "Measures employee’s performance in exchanging information with others in an effective, timely, clear, concise, logical, and organized manner. Communications include listening, speaking, writing, presenting, and sharing of information. Consideration is given to client/data complexity/sensitivity. ",
            selfRating: 0,
            managerRating: 0,
        },
        {
            id: 5,
            title: "Meeting Deadlines",
            description: "Is the Employee able to deliver within the expected timelines",
            selfRating: 0,
            managerRating: 0,
        },
        {
            id: 6,
            title: "Accountability",
            description: "Accountability refers to the process by which employees take responsibility for their actions if an error occurs and understand how their job affects the productivity of the rest of the office.",
            selfRating: 0,
            managerRating: 0,
        },
        {
            id: 7,
            title: "Attitude & Behaviour",
            decription: "Consider employee’s abilities to maintain a positive and harmonious attitude in the work environment. How well does the employee relate to the supervisors, co-workers and clients?",
            selfRating: 0,
            managerRating: 0,
        },
        {
            id: 8,
            title: "Attendance & Punctuality",
            description: "Attendance and punctuality are very important in maintaining a normal work load and efficient schedule. Does employee Login in time and Logout on time during assessment period Consider Proper Leave planning, reporting and exceeds Leave balance",
            selfRating: 0,
            managerRating: 0,
        },
        {
            id: 9,
            title: "Overall Performance",
            description: "Provide an overall rating based on the rating of the individual factors, adherence to significant performance standards, and accomplishment of essential functions. This rating provides an overall impression of job performance that is supported by the job factor ratings, not necessarily an average of those ratings. Thus, each factor need not be of equal weight but comments should justify significant differences on the overall rating.",
            selfRating: 0,
            managerRating: 0,
        }
    ]);

    const handleSelfRating = (index, rating) =>
    {
        const updated = [...parameters];
        updated[index].selfRating = rating;
        setParameters(updated);
    };

    const handleManagerRating = (index, rating) =>
    {
        const updated = [...parameters];
        updated[index].managerRating = rating;
        setParameters(updated);
    };

    return (
        <>
            <ManagerTabs />
            <div className="min-h-screen bg-slate-100 p-6">


                <div className="mx-auto max-w-7xl space-y-6">

                    {/* Header */}
                    <div className="rounded-xl bg-white p-6 shadow">
                        <h1 className="text-3xl font-bold">
                            Annual Performance Appraisal
                        </h1>
                        <p className="mt-1 text-gray-500">
                            FY 2025 - 2026
                        </p>
                    </div>

                    {/* Employee Info */}
                    <div className="rounded-xl bg-white p-6 shadow">
                        <h2 className="mb-5 text-xl font-semibold">
                            Employee Information
                        </h2>

                        <div className="grid gap-4 md:grid-cols-3">
                            <Input label="Employee Name" />
                            <Input label="Employee ID" />
                            <Input label="Department" />

                            <Input label="Designation" />
                            <Input label="Reporting Manager" />
                            <Input label="Appraisal Period" />
                        </div>
                    </div>

                    <div className="rounded-xl bg-white shadow-sm border p-6 mb-6">

                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Performance Appraisal Guidelines
                        </h2>

                        {/* Purpose */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-700 mb-2">
                                Purpose
                            </h3>

                            <p className="text-sm leading-7 text-gray-600">
                                The purpose of conducting Performance Appraisal is to develop better
                                communication between employee and reporting manager, improve work
                                quality, increase productivity, and promote employee development.
                                The reporting manager should assess the employee's overall performance
                                and provide constructive feedback.
                            </p>
                        </div>

                        {/* Process */}
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-700 mb-3">
                                Appraisal Process
                            </h3>

                            <ol className="list-decimal ml-5 space-y-4 text-sm text-gray-600">

                                <li>
                                    <span className="font-medium text-gray-800">
                                        Self Assessment / Appraisal
                                    </span>
                                    <p className="mt-1">
                                        Employee completes the self-appraisal and submits it to the
                                        Reporting Manager within one week of receiving the form.
                                    </p>
                                </li>

                                <li>
                                    <span className="font-medium text-gray-800">
                                        Discussion with Employee
                                    </span>
                                    <p className="mt-1">
                                        Reporting Manager reviews the appraisal, discusses feedback
                                        with the employee, and completes the review before forwarding
                                        it to HR.
                                    </p>
                                </li>

                                <li>
                                    <span className="font-medium text-gray-800">
                                        Team Head Review
                                    </span>
                                    <p className="mt-1">
                                        Team Head and HR review the appraisal along with the Reporting
                                        Manager's assessment.
                                    </p>
                                </li>

                                <li>
                                    <span className="font-medium text-gray-800">
                                        Final Closure
                                    </span>
                                    <p className="mt-1">
                                        Final appraisal documentation is submitted to HR for closure
                                        and record maintenance.
                                    </p>
                                </li>

                            </ol>
                        </div>

                        {/* Rating Scale */}
                        <div>
                            <h3 className="font-semibold text-gray-700 mb-3">
                                Rating Scale
                            </h3>

                            <div className="overflow-hidden rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="border-b p-3 text-center w-24">
                                                Rating
                                            </th>
                                            <th className="border-b p-3 text-left">
                                                Description
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>

                                        <tr>
                                            <td className="border-b p-3 text-center font-semibold text-green-600">
                                                5
                                            </td>
                                            <td className="border-b p-3">
                                                Outstanding – Consistently exceeds expectations,
                                                demonstrates innovation, and adds exceptional value.
                                            </td>
                                        </tr>

                                        <tr>
                                            <td className="border-b p-3 text-center font-semibold text-blue-600">
                                                4
                                            </td>
                                            <td className="border-b p-3">
                                                Excellent – Work is fully satisfactory and often exceeds
                                                performance standards.
                                            </td>
                                        </tr>

                                        <tr>
                                            <td className="border-b p-3 text-center font-semibold text-indigo-600">
                                                3
                                            </td>
                                            <td className="border-b p-3">
                                                Good – Consistently meets expectations and occasionally
                                                exceeds performance standards.
                                            </td>
                                        </tr>

                                        <tr>
                                            <td className="border-b p-3 text-center font-semibold text-orange-600">
                                                2
                                            </td>
                                            <td className="border-b p-3">
                                                Average – Performance standards are partially met and
                                                improvement is required.
                                            </td>
                                        </tr>

                                        <tr>
                                            <td className="p-3 text-center font-semibold text-red-600">
                                                1
                                            </td>
                                            <td className="p-3">
                                                Poor – Immediate improvement is required within a short
                                                period of time.
                                            </td>
                                        </tr>

                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>

                    {/* Performance Table */}
                    <div className="rounded-xl bg-white p-6 shadow">
                        <h2 className="mb-5 text-xl font-semibold">
                            Performance Evaluation
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="border p-3 text-left w-[50%] border p-3 text-left">
                                            Parameter
                                        </th>
                                        <th className="border p-3 text-center w-[40%] border p-3 text-left">Employee Response</th>

                                        <th className="border p-3 w-[5%] border p-3 text-left">
                                            Self Rating
                                        </th>
                                        <th className="border p-3 w-[5%] border p-3 text-left">
                                            Manager Rating
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {parameters.map((item, index) => (
                                        <tr key={item.id}>
                                            <td className="border p-3">
                                                <span className="font-semibold">
                                                    {item.title}:
                                                </span>{" "}
                                                {item.description}
                                            </td>
                                            <td className="border p-3">
                                                <textarea
                                                    rows={4}
                                                    className="w-full rounded border p-2"
                                                    placeholder="Employee comments..."
                                                />
                                            </td>

                                            <td className="border p-3 flex justify-center">
                                                <div className="flex justify-center">
                                                    <StarRating
                                                        value={item.selfRating}
                                                        onChange={(rating) =>
                                                            handleSelfRating(index, rating)
                                                        }
                                                    />
                                                </div>
                                            </td>

                                            <td className="border p-3 ">
                                                <div className="flex justify-center">
                                                    <StarRating
                                                        value={item.managerRating}
                                                        onChange={(rating) =>
                                                            handleManagerRating(index, rating)
                                                        }
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Self Appraisal */}
                    <div className="rounded-xl bg-white p-6 shadow">
                        <h2 className="mb-5 text-xl font-semibold">
                            Self Appraisal
                        </h2>

                        <div className="space-y-4">
                            <TextArea label="Job Description" />
                            <TextArea label="Targets Achieved" />
                        </div>
                    </div>

                    {/* Manager Review */}
                    <div className="rounded-xl bg-white p-6 shadow">
                        <h2 className="mb-5 text-xl font-semibold">
                            Manager Review
                        </h2>

                        <TextArea label="Manager Comments" />
                    </div>

                    {/* Strengths & Weakness */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-xl bg-white p-6 shadow">
                            <h2 className="mb-4 text-xl font-semibold">
                                Strengths
                            </h2>

                            <textarea
                                rows={6}
                                className="w-full rounded-lg border p-3"
                            />
                        </div>

                        <div className="rounded-xl bg-white p-6 shadow">
                            <h2 className="mb-4 text-xl font-semibold">
                                Improvement Areas
                            </h2>

                            <textarea
                                rows={6}
                                className="w-full rounded-lg border p-3"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3">
                        <button className="rounded-lg border px-5 py-2">
                            Save Draft
                        </button>

                        <button className="rounded-lg bg-blue-600 px-5 py-2 text-white">
                            Submit
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
}

function Input({ label })
{
    return (
        <div>
            <label className="mb-2 block text-sm font-medium">
                {label}
            </label>

            <input
                className="w-full rounded-lg border p-3"
                type="text"
            />
        </div>
    );
}

function TextArea({ label })
{
    return (
        <div>
            <label className="mb-2 block text-sm font-medium">
                {label}
            </label>

            <textarea
                rows={5}
                className="w-full rounded-lg border p-3"
            />
        </div>
    );
}

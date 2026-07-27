import React from "react";

export default function JobRequirementForm()
{
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-6">
            <div className="w-full max-w-7xl bg-white shadow-lg rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">

                    {}
                    <div className="space-y-4">
                        <FormInput label="Job Title" required defaultValue="testsap" />
                        <FormInput label="Job ID#" required defaultValue="51003" />

                        <div className="grid grid-cols-2 gap-3">
                            <FormInput label="Bill Rate" required defaultValue="220" />
                            <FormSelect
                label=""
                options={["$", "₹", "€"]}
                defaultValue="$" />

                        </div>

                        <FormSelect
              label="Position Type"
              required
              options={["Contract", "Full Time", "Part Time"]} />


                        <FormInput label="City" required />
                        <FormInput label="Experience Level" required />
                        <FormInput label="Skill Set" required />
                        <FormInput label="Job Opportunity Referred by Phone" />

                        <FormTextarea label="Job Description" required />
                    </div>

                    {}
                    <div className="space-y-4">
                        <FormInput label="Client" required defaultValue="techm" />
                        <FormInput label="Company/Dept" required defaultValue="IT" />

                        <div className="grid grid-cols-2 gap-3">
                            <FormInput label="Pay Rate" required defaultValue="190" />
                            <FormSelect
                label=""
                options={["$", "₹", "€"]}
                defaultValue="$" />

                        </div>

                        <FormInput label="No of Vacancies" required />
                        <FormInput label="Country" required />

                        <FormSelect
              label="Job Status"
              required
              options={[
              "Open",
              "Closed",
              "Hold",
              "Cancelled"]
              } />


                        <FormSelect
              label="Business Unit"
              required
              options={[
              "Nat IT",
              "Natsoft",
              "Healthcare",
              "Finance"]
              } />


                        <FormSelect
              label="Recruiter Assignment Status"
              options={[
              "Assigned",
              "Unassigned",
              "In Progress"]
              } />

                    </div>
                </div>

                {}
                <div className="mt-8 flex justify-end gap-4">
                    <button className="px-8 py-2 border border-orange-500 text-orange-600 rounded-md hover:bg-orange-50">
                        Reset
                    </button>

                    <button className="px-8 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600">
                        Submit Job Requirement
                    </button>
                </div>
            </div>
        </div>);

}



function FormInput({ label, required, defaultValue = "" })
{
  return (
    <div className="grid grid-cols-[170px_1fr] items-center gap-4">
            <label className="text-gray-700 text-sm">
                {required && <span className="text-red-500 mr-1">*</span>}
                {label}
            </label>

            <input
        defaultValue={defaultValue}
        className="w-full h-10 border border-orange-400 rounded px-3 outline-none focus:ring-2 focus:ring-orange-400" />

        </div>);

}

function FormSelect({
  label,
  required,
  options,
  defaultValue
})
{
  return (
    <div className="grid grid-cols-[170px_1fr] items-center gap-4">
            <label className="text-gray-700 text-sm">
                {required && label && <span className="text-red-500 mr-1">*</span>}
                {label}
            </label>

            <select
        defaultValue={defaultValue}
        className="w-full h-10 border border-orange-400 rounded px-3 outline-none focus:ring-2 focus:ring-orange-400">

                {!defaultValue && <option>Find items</option>}

                {options.map((item) =>
        <option key={item}>{item}</option>
        )}
            </select>
        </div>);

}

function FormTextarea({ label, required })
{
  return (
    <div className="grid grid-cols-[170px_1fr] gap-4">
            <label className="text-gray-700 text-sm pt-2">
                {required && <span className="text-red-500 mr-1">*</span>}
                {label}
            </label>

            <textarea
        rows={5}
        className="w-full border border-orange-400 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400" />

        </div>);

}

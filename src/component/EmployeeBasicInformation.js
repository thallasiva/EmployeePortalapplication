import React from 'react'

const EmployeeBasicInformation = ({basicInfo}) =>
{
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-full max-w-md bg-white rounded shadow-xl">

                <div className="p-4 border-b flex justify-between">
                    <h2 className="font-semibold text-xl">Basic Information</h2>
                    <button
                        className="w-6 h-6 border rounded text-red-500"
                        onClick={basicInfo}
                    >
                        ×
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    {[
                        "Preferred Name",
                        "First Name",
                        "Last Name",
                        "Nationality",
                        "Date of Birth",
                        "Gender",
                        "Blood Group",
                    ].map((item) => (
                        <input
                            key={item}
                            placeholder={item}
                            className="w-full border rounded px-3 py-3 text-sm"
                        />
                    ))}

                    <div className="flex gap-4 pt-2">
                        <button className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold">
                            Add
                        </button>
                        <button
                            className="flex-1 bg-rose-600 text-white py-3 rounded-lg font-semibold"
                            onClick={basicInfo}
                        >
                            Cancel
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default EmployeeBasicInformation

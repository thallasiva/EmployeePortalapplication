import React, { useEffect, useState } from "react";

const ScheduleInterview = ({ candidate, onSave }) =>
{

  const [form, setForm] = useState({
    candidate: candidate?.Name || "",
    requirement: candidate?.["Job ID"] || "",
    interviewer: "",
    level: "",
    date: "",
    time: "",
    duration: "60 Minutes",
    meetingLink: "",
    notes: ""
  });
  useEffect(() =>
  {

    if (candidate)
    {

      setForm((prev) => ({

        ...prev,

        candidate: candidate.Name,

        requirement: candidate["Job ID"]

      }));

    }

  }, [candidate]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm p-8">

                {}
                <h1 className="text-4xl font-bold text-gray-900">
                    Schedule Interview
                </h1>

                {}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">

                    {}
                    <div className="border rounded-2xl p-8">

                        <h2 className="text-2xl font-semibold mb-8">
                            Interview Details
                        </h2>

                        {}
                        <div className="mb-6">
                            <label className="block font-medium mb-2">
                                Candidate <span className="text-red-500">*</span>
                            </label>

                            <select className="w-full border rounded-lg h-12 px-4 focus:ring-2 focus:ring-blue-500 outline-none">
                                <option>John Doe</option>
                            </select>
                        </div>

                        {}

                        <div className="mb-6">
                            <label className="block font-medium mb-2">
                                Requirement <span className="text-red-500">*</span>
                            </label>

                            <select className="w-full border rounded-lg h-12 px-4">
                                <option>Java Developer</option>
                            </select>
                        </div>

                        {}

                        <div className="mb-6">
                            <label className="block font-medium mb-2">
                                Interview <span className="text-red-500">*</span>
                            </label>

                            <select className="w-full border rounded-lg h-12 px-4">
                                <option>L1 Interview</option>
                                <option>L2 Interview</option>
                                <option>L3 Interview</option>
                            </select>
                        </div>

                        {}

                        <div className="mb-6">
                            <label className="block font-medium mb-2">
                                Interviewer <span className="text-red-500">*</span>
                            </label>

                            <select className="w-full border rounded-lg h-12 px-4">
                                <option>Alex Smith</option>
                            </select>
                        </div>

                        {}

                        <div>

                            <label className="block font-medium mb-5">
                                Interview Type <span className="text-red-500">*</span>
                            </label>

                            <div className="grid grid-cols-2 gap-4">



                                <label className="flex items-center gap-3">
                                    <input
                    type="radio"
                    name="type"
                    className="w-5 h-5 text-blue-600" />

                                    Microsoft Teams
                                </label>

                                <label className="flex items-center gap-3">
                                    <input
                    type="radio"
                    name="type"
                    className="w-5 h-5 text-blue-600" />

                                    Phone Call
                                </label>


                            </div>

                        </div>

                    </div>

                    {}

                    <div className="border rounded-2xl p-8">

                        <h2 className="text-2xl font-semibold mb-8">
                            Date & Time
                        </h2>

                        {}

                        <div className="grid grid-cols-2 gap-6">

                            <div>
                                <label className="block font-medium mb-2">
                                    Date <span className="text-red-500">*</span>
                                </label>

                                <input
                  type="date"
                  className="w-full border rounded-lg h-12 px-4" />

                            </div>

                            <div>
                                <label className="block font-medium mb-2">
                                    Time <span className="text-red-500">*</span>
                                </label>

                                <input
                  type="time"
                  className="w-full border rounded-lg h-12 px-4" />

                            </div>

                        </div>

                        {}

                        <div className="grid grid-cols-2 gap-6 mt-6">

                            <div>
                                <label className="block font-medium mb-2">
                                    Duration <span className="text-red-500">*</span>
                                </label>

                                <select className="w-full border rounded-lg h-12 px-4">
                                    <option>60 Minutes</option>
                                    <option>30 Minutes</option>
                                    <option>90 Minutes</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-medium mb-2">
                                    Time Zone
                                </label>

                                <select className="w-full border rounded-lg h-12 px-4">
                                    <option>(GMT+05:30) India Standard Time</option>
                                </select>
                            </div>

                        </div>

                        {}

                        <div className="mt-6">

                            <label className="block font-medium mb-2">
                                Meeting Link
                            </label>

                            <input
                type="text"
                placeholder="https://meet.google.com/abc-defg-hij"
                className="w-full border rounded-lg h-12 px-4" />


                        </div>

                        {}

                        <div className="mt-6">

                            <label className="block font-medium mb-2">
                                Notes
                            </label>

                            <textarea
                rows={7}
                placeholder="Add notes (optional)"
                className="w-full border rounded-lg p-4 resize-none">
              </textarea>

                        </div>

                        {}

                        <div className="flex justify-end gap-4 mt-8">

                            <button className="px-8 h-12 rounded-lg border font-semibold hover:bg-gray-100">
                                Cancel
                            </button>

                            <button className="px-8 h-12 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">
                                Schedule Interview
                            </button>

                        </div>

                    </div>

                </div>

            </div>
        </div>);

};

export default ScheduleInterview;

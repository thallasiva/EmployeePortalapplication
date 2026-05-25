import React, { useState } from "react";

export default function TimeOff() {
  const [activeTab, setActiveTab] = useState("upcoming");

  const upcomingData = [
    { id: 1, date: "Mon, 26 Aug 2019", reason: "Bank Holiday" },
    { id: 2, date: "Wed, 25 Dec 2019", reason: "Christmas Day" },
    { id: 3, date: "Thu, 26 Dec 2019", reason: "Bank Holiday" },
    { id: 4, date: "Wed, 1 Jan 2020", reason: "Bank Holiday" },
    { id: 5, date: "Mon, 1 Jan 2020", reason: "Epiphany" },
    { id: 6, date: "Fri, 17 Jan 2020", reason: "Presidents' Day" },
    { id: 7, date: "Mon, 9 Mar 2020", reason: "Holi" },
    { id: 8, date: "Wed, 1 Mar 2020", reason: "Independence Day" },
    { id: 9, date: "Sat, 4 Jul 2020", reason: "Bank Holiday" },
    { id: 10, date: "Mon, 11 Nov 2020", reason: "Veterans Day" },
    { id: 11, date: "Fri, 25 Dec 2020", reason: "Christmas Day" },
    { id: 12, date: "Mon, 1 Jan 2020", reason: "Epiphany" },
  ];

  const historyData = [
    { id: 1, date: "Mon, 26 Aug 2018", reason: "Bank Holiday" },
    { id: 2, date: "Tue, 25 Dec 2018", reason: "Christmas Day" },
    { id: 3, date: "Wed, 1 Jan 2019", reason: "New Year" },
    { id: 4, date: "Mon, 15 Apr 2019", reason: "Good Friday" },
  ];

  const tableData = activeTab === "upcoming" ? upcomingData : historyData;

  return (
    <div className="bg-[#f5f6f8] min-h-screen p-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-[28px] font-semibold text-[#1c2746]">
              Holidays List
            </h2>
          </div>

          <div className="p-4">
            {/* Tabs + Dropdown */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex shadow rounded-lg overflow-hidden border border-gray-200">
                <button
                  onClick={() => setActiveTab("upcoming")}
                  className={`px-8 h-11 text-[14px] font-semibold ${
                    activeTab === "upcoming"
                      ? "bg-[#3047c9] text-white"
                      : "bg-white text-black"
                  }`}
                >
                  Upcoming
                </button>

                <button
                  onClick={() => setActiveTab("history")}
                  className={`px-8 h-11 text-[14px] font-semibold ${
                    activeTab === "history"
                      ? "bg-[#3047c9] text-white"
                      : "bg-white text-black"
                  }`}
                >
                  History
                </button>
              </div>

              <select className="w-[280px] h-11 px-4 border border-gray-300 rounded text-sm text-gray-600 outline-none">
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>

            {/* Table */}
            <div className="border border-gray-300 rounded">
              <table className="w-full text-left">
                <thead className="border-b border-gray-300">
                  <tr className="text-[14px] text-black font-semibold">
                    <th className="px-5 py-3 w-[60px]">#</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Leave Reason</th>
                  </tr>
                </thead>

                <tbody>
                  {tableData.map((item) => (
                    <tr key={item.id} className="text-[14px] text-black">
                      <td className="px-5 py-3">{item.id}</td>
                      <td className="px-5 py-3">{item.date}</td>
                      <td className="px-5 py-3">{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-[24px] font-semibold text-[#1c2746] uppercase">
              Leave Off Details
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {/* Year */}
            <div className="p-4">
              <h3 className="font-semibold text-[14px] mb-3">Year</h3>
              <p className="text-[14px] text-black">
                01 January – 31 December
              </p>
            </div>

            {/* Days Used */}
            <div className="p-4">
              <h3 className="font-semibold text-[14px] mb-4">Days Used</h3>

              <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                <div className="bg-brand h-6 w-[50%] text-white text-xs flex items-center justify-center font-semibold">
                  5 days
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold text-[14px]">Days</h4>
                <p className="text-[14px] mt-1">5 Used</p>
              </div>
            </div>

            {/* Non Deductible */}
            <div className="p-4">
              <h3 className="font-semibold text-[14px] mb-4">
                Non Deductible Days
              </h3>

              <div className="flex gap-3">
                <button className="bg-brand text-white font-semibold px-8 h-11 rounded">
                  5 Approved
                </button>
                <button className="bg-brand text-white font-semibold px-8 h-11 rounded">
                  7 Pending
                </button>
              </div>
            </div>

            {/* Attendance */}
            <div className="p-4">
              <h3 className="font-semibold text-[14px] mb-4">Attendance</h3>
              <p className="text-[14px] mb-2">3 Sick Days</p>
              <p className="text-[14px]">2 Working from Home</p>
            </div>

            {/* Approver */}
            <div className="p-4">
              <h3 className="font-semibold text-[14px] mb-4">
                Time Off Approvers
              </h3>

              <select className="w-full h-11 px-4 border border-gray-300 rounded text-sm text-gray-500 outline-none">
                <option>Choose Approver</option>
                <option>Manager</option>
                <option>HR</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
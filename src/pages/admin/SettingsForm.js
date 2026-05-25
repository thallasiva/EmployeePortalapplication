import React from "react";

export default function SettingsForm() {
  return (
    <div className="bg-[#f5f6f8] min-h-screen p-2">
      {/* Top Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Change Password */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-[30px] font-semibold text-[#1c2746]">
              Change Password
            </h2>
            <p className="text-[14px] text-[#1c2746] mt-1">
              Your password needs to be at least 8 characters long.
            </p>
          </div>

          <div className="p-4 space-y-3">
            <input
              type="password"
              placeholder="Current Password"
              className="w-full h-[46px] px-4 border border-gray-300 rounded text-[14px] outline-none"
            />

            <input
              type="password"
              placeholder="New Password"
              className="w-full h-[46px] px-4 border border-gray-300 rounded text-[14px] outline-none"
            />

            <input
              type="password"
              placeholder="Repeat Password"
              className="w-full h-[46px] px-4 border border-gray-300 rounded text-[14px] outline-none"
            />

            <button className="mt-2 bg-brand hover:bg-brand text-white font-semibold text-[15px] px-5 h-[44px] rounded shadow">
              Change My Password
            </button>
          </div>
        </div>

        {/* Company Notification Settings */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-[30px] font-semibold text-[#1c2746]">
              Company Notification Settings
            </h2>
            <p className="text-[14px] text-[#1c2746] mt-1">
              You will receive information across the whole company.
            </p>
          </div>

          <div className="p-4 space-y-5">
            {[
              {
                title: "Weekly Summarize",
                desc: "Keeping you in the loop with a weekly email summarizing",
              },
              {
                title: "Weekly Payroll Summarize",
                desc: "A weekly email containing all changes related to your payroll.",
              },
              {
                title: "Visa Dates",
                desc: "Informs and notify the day before Visa dates for each team member.",
              },
            ].map((item, i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1 w-4 h-4" />
                <div>
                  <p className="font-semibold text-[14px] text-black">
                    {item.title}
                  </p>
                  <p className="text-[13px] text-gray-600">{item.desc}</p>
                </div>
              </label>
            ))}

            <button className="mt-3 bg-brand hover:bg-brand text-white font-semibold text-[15px] px-5 h-[44px] rounded shadow">
              Update Notification Settings
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Card */}
      <div className="mt-5 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-[30px] font-semibold text-[#1c2746]">
            Team Member Notification Settings
          </h2>
          <p className="text-[14px] text-[#1c2746] mt-1">
            You will receive notifications only for Team Leads.
          </p>
        </div>

        <div className="p-4 space-y-6">
          {[
            {
              title: "Birthdays",
              desc: "Reasons to party with reminders a week and a day before a team member's birthday.",
            },
            {
              title: "Work Anniversaries",
              desc: "Never miss work anniversaries with reminders the week and the day before.",
            },
            {
              title: "Key Dates",
              desc: "Informs and notify the day before key dates for each team member.",
            },
            {
              title: "Off Boardings",
              desc: "Informs you when a team member has a leaving date set and reminds you the day before.",
            },
            {
              title: "Work From Home Notifications",
              desc: "Never miss a notification that someone will be working from home.",
            },
          ].map((item, i) => (
            <label key={i} className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 w-4 h-4" />
              <div>
                <p className="font-semibold text-[14px] text-black">
                  {item.title}
                </p>
                <p className="text-[13px] text-gray-600">{item.desc}</p>
              </div>
            </label>
          ))}

          <button className="mt-2 bg-brand hover:bg-brand text-white font-semibold text-[15px] px-5 h-[44px] rounded shadow">
            Update Notification Settings
          </button>
        </div>
      </div>
    </div>
  );
}
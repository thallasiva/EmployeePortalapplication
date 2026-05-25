import React, { useState } from "react";
import { Download } from "lucide-react";
import { YearPicker } from "../../../component/YearPicker";

export default function LeaveBalances() {
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const leaveData = [
    {
      title: "Earned Leave",
      granted: 33.04,
      balance: 33.04,
      consumed: 0,
      total: 33.04,
    },

    {
      title: "Sick Leave",
      granted: 6,
      balance: 4,
      consumed: 2,
      total: 6,
    },

    {
      title: "Compensatory Off",
      granted: 5,
      balance: 1,
      consumed: 4,
      total: 5,
    },

    {
      title: "Work From Home",
      granted: 0,
      balance: 0,
      consumed: 0,
      total: 0,
    },

    {
      title: "Leave Without Pay",
      granted: 0,
      balance: 0,
      consumed: 0,
      total: 0,
    },

    {
      title: "Restricted Holiday",
      granted: 2,
      balance: 2,
      consumed: 0,
      total: 2,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">
      {/* HEADER */}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-semibold text-[#1f2937]">
          Leave Balances
        </h1>

        <div className="flex items-center gap-3">
          {/* APPLY BUTTON */}

          <button
            className="
              h-[40px]
              px-5
              rounded
              border
              border-[#2ea7ff]
              text-[#2ea7ff]
              bg-white
              text-[14px]
              font-medium
              hover:bg-[#f0f9ff]
            "
          >
            Apply
          </button>

          {/* DOWNLOAD */}

          <button
            className="
              h-[40px]
              w-[42px]
              rounded
              bg-[#2ea7ff]
              flex
              items-center
              justify-center
              text-white
              hover:bg-[#1995ef]
            "
          >
            <Download size={16} />
          </button>

          {/* YEAR */}

          <YearPicker
            value={year}
            onChange={setYear}
            selectClassName="h-[40px] w-[100px] border border-[#dbe2ea] rounded bg-white px-3 text-[14px] outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
        </div>
      </div>

      {/* LEAVE CARDS */}

      <div className="grid grid-cols-4 gap-4">
        {leaveData.map((item, index) => {
          const progress =
            item.total > 0
              ? (item.consumed / item.total) * 100
              : 0;

          return (
            <div
              key={index}
              className="
                bg-white
                border
                border-[#dce3eb]
                rounded
                min-h-[170px]
                shadow-sm
                flex
                flex-col
                justify-between
              "
            >
              {/* TOP */}

              <div className="p-4">
                <div className="flex items-start justify-between">
                  <h2 className="text-[14px] text-[#64748b] font-medium">
                    {item.title}
                  </h2>

                  <p className="text-[13px] text-[#64748b]">
                    Granted: {item.granted}
                  </p>
                </div>

                {/* BALANCE */}

                <div className="flex flex-col items-center mt-7">
                  <h3 className="text-[38px] leading-none font-medium text-[#1e293b]">
                    {String(item.balance).padStart(2, "0")}
                  </h3>

                  <p className="text-[13px] text-[#94a3b8] mt-2">
                    Balance
                  </p>

                  <button
                    className="
                      mt-4
                      text-[14px]
                      text-[#2ea7ff]
                      font-medium
                      hover:underline
                    "
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* PROGRESS */}

              <div className="px-3 pb-3">
                <div
                  className="
                    w-full
                    h-[5px]
                    rounded-full
                    bg-[#edf2f7]
                    overflow-hidden
                  "
                >
                  <div
                    className="h-full bg-[#2ea7ff]"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <p className="text-[11px] text-[#94a3b8] mt-2">
                  {item.consumed} of {item.total} Consumed
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import { YearPicker } from "../../../component/YearPicker";
import LeaveBalanceDetail from "./LeaveBalanceDetail";
import { getMyLeaveBalances } from "../../../api/leaveRequest.api";

export default function LeaveBalances() {
  const navigate = useNavigate();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMyLeaveBalances({ year })
      .then((rows) => {
        const mapped = (rows || []).map((r) => {
          const granted = Number(r.granted ?? r.annual_quota ?? 0);
          const balance = Number(r.balance ?? r.annual_quota ?? 0);
          const opening = Number(r.opening_balance ?? 0);
          const consumed = Number(r.availed ?? 0);
          const total = granted + opening || Number(r.annual_quota ?? 0) || balance;
          return {
            leaveTypeId: r.leave_type_id,
            title: r.leave_type_name,
            granted,
            balance,
            consumed,
            total,
          };
        });
        setLeaveData(mapped);
      })
      .catch(() => setLeaveData([]))
      .finally(() => setLoading(false));
  }, [year]);

  if (selectedLeave) {
    return (
      <div className="min-h-screen bg-[#ececec] p-6">
        <LeaveBalanceDetail
          leaveType={selectedLeave}
          year={year}
          onYearChange={setYear}
          onBack={() => setSelectedLeave(null)}
        />
      </div>
    );
  }

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
            onClick={() => navigate("/employee/leave/apply")}
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

      {loading ? (
        <div className="bg-white border border-[#dce3eb] rounded h-[170px] flex items-center justify-center">
          <p className="text-[#94a3b8] text-[14px]">Loading...</p>
        </div>
      ) : leaveData.length === 0 ? (
        <div className="bg-white border border-[#dce3eb] rounded h-[170px] flex items-center justify-center">
          <p className="text-[#94a3b8] text-[14px]">No leave balances found.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {leaveData.map((item, index) => {
          const progress =
            item.total > 0 ? (item.consumed / item.total) * 100 : 0;

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
                    type="button"
                    onClick={() => setSelectedLeave(item.title)}
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

              <div className="px-3 pb-3">
                <div className="w-full h-[5px] rounded-full bg-[#edf2f7] overflow-hidden">
                  <div
                    className="h-full bg-[#337ab7]"
                    style={{ width: `${progress}%` }}
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
      )}
    </div>
  );
}
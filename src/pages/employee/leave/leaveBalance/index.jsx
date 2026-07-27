import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import { YearPicker } from "../../../../component/YearPicker";
import LeaveBalanceDetail from "../LeaveBalanceDetail";
import { useLeaveBalances } from "./hooks/useLeaveBalances";
import { cssClass, joinClasses } from "../../../../utils/classStyles";
import LeaveCard from "./components/LeaveCard";
import SkeletonCard from "./components/SkeletonCard";

const SKELETON_KEYS = [1, 2, 3, 4, 5, 6];

const LeaveBalances = React.memo(function LeaveBalances() {
  const navigate = useNavigate();
  const { year, setYear, leaveData, loading } = useLeaveBalances();
  const [selectedLeave, setSelectedLeave] = useState(null);

  const handleViewDetails = useCallback((title) => setSelectedLeave(title), []);
  const handleBack = useCallback(() => setSelectedLeave(null), []);

  if (selectedLeave) {
    return (
      <div className="min-h-screen bg-[#ececec] p-6">
        <LeaveBalanceDetail
          leaveType={selectedLeave}
          year={year}
          onYearChange={setYear}
          onBack={handleBack}
        />
      </div>
    );
  }

  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f5f7fb", padding: 24 })}>
      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 })}>
        <div>
          <p className={cssClass({ fontSize: 12, color: "#9ca8b5", margin: "0 0 2px" })}>Financial Year {year}</p>
          <h1 className={cssClass({ fontSize: 22, fontWeight: 600, color: "#1a2233", margin: 0 })}>Leave Balances</h1>
        </div>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 10 })}>
          <button
            onClick={() => navigate("/employee/leave/apply")}
            className={cssClass({
              height: 38, padding: "0 18px", borderRadius: 8,
              border: "1.5px solid #2ea7ff", color: "#2ea7ff",
              background: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer",
            })}
          >
            + Apply Leave
          </button>
          <button className={cssClass({
            height: 38, width: 38, borderRadius: 8, border: "1.5px solid #e5eaf0",
            background: "#fff", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", color: "#6b7a8d",
          })}>
            <Download size={15} />
          </button>
          <YearPicker
            value={year}
            onChange={setYear}
            selectClassName="h-[38px] w-[100px] border border-[#dbe2ea] rounded-lg bg-white px-3 text-[13px] outline-none focus:ring-2 focus:ring-[#2ea7ff]/30"
          />
        </div>
      </div>

      {loading ? (
        <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 14 })}>
          {SKELETON_KEYS.map((n) => <SkeletonCard key={n} />)}
        </div>
      ) : leaveData.length === 0 ? (
        <div className={cssClass({
          background: "#fff", border: "1px solid #e5eaf0", borderRadius: 14,
          height: 180, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 8,
        })}>
          <i className={joinClasses("ti ti-calendar-off", cssClass({ fontSize: 32, color: "#d1d8e0" }))} />
          <p className={cssClass({ fontSize: 14, color: "#9ca8b5", margin: 0 })}>
            No leave balances found for {year}.
          </p>
        </div>
      ) : (
        <div className={cssClass({ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 14 })}>
          {leaveData.map((item) => (
            <LeaveCard key={item.leaveTypeId} item={item} onViewDetails={handleViewDetails} />
          ))}
        </div>
      )}
    </div>
  );
});

export default LeaveBalances;

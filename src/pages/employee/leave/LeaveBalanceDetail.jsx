import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { YearPicker } from "../../../component/YearPicker";
import LeaveMonthlyBarChart from "../../../component/leave/LeaveMonthlyBarChart";
import LeaveTransactionTable from "../../../component/leave/LeaveTransactionTable";
import { getLeaveDetailConfig } from "../../../data/leaveDetails";
import "../../../component/leave/leaveBalanceDetail.css";

const SUMMARY_ITEMS = [
  { key: "availableBalance", label: "Available Balance" },
  { key: "openingBalance", label: "Opening Balance" },
  { key: "granted", label: "Granted" },
  { key: "availed", label: "Availed" },
];

export default function LeaveBalanceDetail({
  leaveType,
  year,
  onYearChange,
  onBack,
}) {
  const config = getLeaveDetailConfig(leaveType);
  const { summary, chart, transactions } = config;

  return (
    <div className="leave-detail-page w-full">


      {/* Top: summary strip + Apply / year */}
      <div className="leave-detail-top">
        <div className="leave-detail-summary-wrap">
          <span className="leave-detail-summary-arrow" aria-hidden>
            <ChevronLeft size={16} />
          </span>
          <div className="leave-detail-summary">
            {SUMMARY_ITEMS.map((item) => (
              <div key={item.key} className="leave-detail-summary__item">
                <span className="leave-detail-summary__label">
                  {item.label}
                </span>
                <span className="leave-detail-summary__value">
                  {summary[item.key]}
                </span>
              </div>
            ))}
          </div>
          <span className="leave-detail-summary-arrow" aria-hidden>
            <ChevronRight size={16} />
          </span>
        </div>

        <div className="leave-detail-actions">
          <button type="button" className="leave-detail-apply-btn">
            Apply
          </button>
          <YearPicker
            value={year}
            onChange={onYearChange}
            showIcon={false}
            selectClassName="h-[36px] w-[90px] border border-[#ccc] rounded-sm bg-white px-2 text-[14px] text-[#333] outline-none"
          />
        </div>
      </div>

      {/* Chart card */}
      <div className="leave-detail-card">
        <div className="leave-detail-card__title">
          {leaveType}: {year}
        </div>
        <div className="leave-detail-card__body leave-detail-card__body--chart">
          <LeaveMonthlyBarChart chart={chart} year={year} />
        </div>
      </div>

      {/* Transaction table card */}
      <div className="leave-detail-card">
        <div className="leave-detail-card__body leave-detail-card__body--table">
          <LeaveTransactionTable transactions={transactions} />
        </div>
      </div>
    </div>
  );
}

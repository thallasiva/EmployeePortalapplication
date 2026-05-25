
import { useState } from "react";
import { FiscalYearPicker } from "../../../component/YearPicker";
import {
  getCurrentFiscalYearStart,
  getFiscalYearRangeLabel,
} from "../../../lib/dateUtils";

const reimbursementData = [
  {
    title: "TELEPHONE AND INTERNET REIMBURSEMENT",
    entitlement: "3,000.00",
    claims: "0.00",
    balance: "3,000.00",
    color: "border-cyan-400",
  },
  {
    title: "LTA BILLS",
    entitlement: "6,666.00",
    claims: "0.00",
    balance: "6,666.00",
    color: "border-orange-400",
  },
];

export default function Reimbursement() {
  const [activeTab, setActiveTab] = useState("overview");
  const [fiscalYearStart, setFiscalYearStart] = useState(
    String(getCurrentFiscalYearStart())
  );
  const fiscalRangeLabel = getFiscalYearRangeLabel(fiscalYearStart);

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">
      {/* TOP BAR */}

      <div className="flex items-center justify-between mb-6">
        {/* TABS */}

        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`
              h-[42px]
              text-[14px]
              border-b-2
              px-1
              ${
                activeTab === "overview"
                  ? "border-[#2563eb] text-[#2563eb]"
                  : "border-transparent text-[#374151]"
              }
            `}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab("claims")}
            className={`
              h-[42px]
              text-[14px]
              border-b-2
              px-1
              ${
                activeTab === "claims"
                  ? "border-[#2563eb] text-[#2563eb]"
                  : "border-transparent text-[#374151]"
              }
            `}
          >
            My Claims
          </button>
        </div>

        {/* RIGHT */}

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FiscalYearPicker
              value={fiscalYearStart}
              onChange={setFiscalYearStart}
              selectClassName="h-[38px] px-4 border border-[#d8dee8] bg-white rounded text-[14px] outline-none focus:ring-2 focus:ring-brand/30"
            />
            <span className="text-[13px] text-gray-500 hidden md:inline">
              {fiscalRangeLabel}
            </span>
          </div>

          <button
            className="
              h-[38px]
              px-5
              bg-[#3b82f6]
              hover:bg-[#2563eb]
              rounded
              text-white
              text-[14px]
            "
          >
            +Add Claims
          </button>
        </div>
      </div>

      {/* OVERVIEW SCREEN */}

      {activeTab === "overview" && (
        <div className="space-y-4">
          {reimbursementData.map((item, index) => (
            <div
              key={index}
              className="
                bg-white
                border
                border-[#d9e0ea]
                rounded-sm
                p-5
                flex
                items-center
                justify-between
                shadow-sm
              "
            >
              {/* LEFT */}

              <div className="flex items-center gap-5">
                {/* CIRCLE */}

                <div
                  className={`
                    w-[52px]
                    h-[52px]
                    rounded-full
                    border-[4px]
                    ${item.color}
                    flex
                    items-center
                    justify-center
                    text-[12px]
                    font-semibold
                    text-[#374151]
                  `}
                >
                  100%
                </div>

                {/* DETAILS */}

                <div>
                  <h3
                    className="
                      text-[15px]
                      font-semibold
                      text-[#1f2937]
                    "
                  >
                    {item.title}
                  </h3>

                  <div
                    className="
                      mt-2
                      flex
                      items-center
                      gap-4
                      text-[14px]
                      text-[#6b7280]
                    "
                  >
                    <span>
                      Entitlement:{" "}
                      <span className="font-medium text-[#111827]">
                        {item.entitlement}
                      </span>
                    </span>

                    <span>|</span>

                    <span>
                      Claims Applied/Paid:{" "}
                      <span className="font-medium text-[#111827]">
                        {item.claims}
                      </span>
                    </span>

                    <span>|</span>

                    <button className="text-[#2563eb] hover:underline">
                      View Details
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT */}

              <div
                className="
                  text-[16px]
                  font-semibold
                  text-[#111827]
                "
              >
                Balance: ₹ {item.balance}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MY CLAIMS SCREEN */}

      {activeTab === "claims" && (
        <div
          className="
            bg-white
            border
            border-[#d9e0ea]
            rounded-sm
            h-[650px]
            flex
            flex-col
            items-center
            justify-center
          "
        >
          {/* IMAGE */}

          <img
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' rx='8' fill='%23f1f5f9'/%3E%3Ctext x='24' y='30' text-anchor='middle' fill='%2364748b' font-size='20'%3E%E2%80%94%3C/text%3E%3C/svg%3E"
            alt="claims"
            className="w-[140px] opacity-70"
          />

          {/* TITLE */}

          <h2
            className="
              mt-5
              text-[24px]
              font-medium
              text-[#94a3b8]
            "
          >
            No Claims Found
          </h2>

          {/* SUBTEXT */}

          <p
            className="
              mt-2
              text-[15px]
              text-[#94a3b8]
            "
          >
            You have not submitted any reimbursement
            claims.
          </p>
        </div>
      )}
    </div>
  );
}
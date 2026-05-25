import { useState } from "react";
import { Info, ArrowRight } from "lucide-react";
import { FiscalYearPicker } from "../../../component/YearPicker";
import {
  getCurrentFiscalYearStart,
  formatMonthYear,
} from "../../../lib/dateUtils";

export default function ITDeclaration() {
  const [fiscalYearStart, setFiscalYearStart] = useState(
    String(getCurrentFiscalYearStart())
  );
  const currentMonthLabel = formatMonthYear(new Date());

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">
      {/* TOP HEADER */}

      <div className="flex items-start justify-between mb-6">
        {/* LEFT */}

        <div>
          <h1 className="text-[24px] font-semibold text-[#24324a]">
            IT Declaration
          </h1>

          {/* ALERT */}

          <div
            className="
              mt-4
              w-[540px]
              border
              border-[#2f80ed]
              bg-[#f7fbff]
              px-4
              py-3
              flex
              items-center
              justify-between
            "
          >
            <div className="flex items-center gap-2">
              <Info
                size={16}
                className="text-[#2f80ed]"
              />

              <p className="text-[13px] text-[#6b7280]">
                Section names have been updated as per
                the Income Tax Act 2025. Your saved
                data remains unchanged.
              </p>
            </div>

            <button className="text-[13px] text-[#2f80ed] font-medium">
              View Details
            </button>
          </div>
        </div>

        {/* RIGHT */}

        <div className="flex items-center gap-3">
          <button
            className="
              h-[38px]
              px-5
              bg-[#2f80ed]
              text-white
              text-[14px]
              rounded
              hover:bg-[#1f6fe0]
            "
          >
            My Tax Planner
          </button>

          <FiscalYearPicker
            value={fiscalYearStart}
            onChange={setFiscalYearStart}
            selectClassName="h-[38px] px-4 border border-[#d5dbe3] bg-white rounded text-[14px] outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
      </div>

      {/* STATUS */}

      <div className="flex justify-center mb-4">
        <div
          className="
            border
            border-[#f2c3c3]
            bg-[#fff8f8]
            px-4
            py-2
            rounded
            flex
            items-center
            gap-2
          "
        >
          <div
            className="
              w-3
              h-3
              rounded-full
              border
              border-[#ef4444]
            "
          />

          <span className="text-[13px] text-[#9ca3af]">
            Declaration window is open
          </span>
        </div>
      </div>

      {/* MONTH */}

      <h2
        className="
          text-center
          text-[22px]
          font-medium
          text-[#24324a]
          mb-6
        "
      >
        {currentMonthLabel}
      </h2>

      {/* MAIN CARD */}

      <div
        className="
          bg-white
          border
          border-[#d9e0ea]
          h-[520px]
          rounded-sm
          flex
          items-center
          justify-center
        "
      >
        <div className="text-center">
          {/* ICON */}

          <div className="flex justify-center mb-5">
            <div
              className="
                w-[120px]
                h-[120px]
                rounded-full
                bg-[#f5f7fb]
                flex
                items-center
                justify-center
              "
            >
              <img
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' rx='8' fill='%23f1f5f9'/%3E%3Ctext x='24' y='30' text-anchor='middle' fill='%2364748b' font-size='20'%3E%E2%80%94%3C/text%3E%3C/svg%3E"
                alt="tax"
                className="w-[90px] opacity-60"
              />
            </div>
          </div>

          {/* TITLE */}

          <h3 className="text-[22px] text-[#94a3b8] font-medium">
            Declaration window open
          </h3>

          {/* SUBTITLE */}

          <p className="text-[#94a3b8] text-sm mt-2">
            start declaring now
          </p>

          {/* ACTIONS */}

          <div className="flex items-center justify-center gap-5 mt-6">
            <button
              className="
                h-[38px]
                px-5
                border
                border-[#2f80ed]
                text-[#2f80ed]
                rounded
                flex
                items-center
                gap-2
                hover:bg-[#f4f9ff]
              "
            >
              Start Now

              <ArrowRight size={16} />
            </button>

            <button
              className="
                text-[#2f80ed]
                text-[14px]
                hover:underline
              "
            >
              Retain previous
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
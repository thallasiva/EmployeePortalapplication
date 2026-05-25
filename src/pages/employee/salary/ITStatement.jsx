import { useState } from "react";
import {
  ChevronDown,
  Plus,
} from "lucide-react";

const sections = [
  "A. Income",
  "B. Deductions",
  "C. Perquisites",
  "D. Income Excluded From Tax",
  "E. Gross Salary (A + C - D)",
  "F. Exemption Under Section 11",
  "G. Income From Previous Employer",
  "H. Income After Exemption(E - F + G)",
  "I. Less Deduction under Section 19",
  "J. Income Chargeable Under The Head Salaries(H - I)",
  "K. Income From Other Sources (Including House Properties)",
  "L. Gross Total Income (J + K)",
  "M. Deduction Under Chapter VIII",
  "N. Taxable Income (L - M)",
  "O. Annual Tax",
  "P. Tax Paid Till Date",
  "Q. Balance Payable",
  "R. TDS Recovered in Current Month",
];

export default function ITStatement() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">
      {/* TOP SUMMARY CARDS */}

      <div className="grid grid-cols-5 gap-4 mb-5">
        <SummaryCard
          title="NEW TAX REGIME"
          value="₹ 14,42,583.00"
        />

        <SummaryCard
          title="NET TAX IN ₹"
          value="₹ 1,50,083.00"
        />

        <SummaryCard
          title="TOTAL TAX DUE IN ₹"
          value="₹ 11,800"
        />

        <SummaryCard
          title="TAX DEDUCTIBLE PER MONTH IN ₹"
          value="₹ 11"
        />

        <SummaryCard
          title="REMAINING MONTHS"
          value="1"
        />
      </div>

      {/* EXPAND ALL */}

      <div className="mb-2">
        <button className="text-[13px] text-brand hover:underline">
          Expand all
        </button>
      </div>

      {/* ACCORDIONS */}

      <div className="space-y-[2px]">
        {sections.map((item, index) => (
          <div
            key={index}
            className="border border-[#cfd8e3]"
          >
            {/* HEADER */}

            <button
              onClick={() => toggleAccordion(index)}
              className="
                w-full
                h-[34px]
                bg-[#f7f9fc]
                hover:bg-[#eef2f7]
                px-4
                flex
                items-center
                gap-3
                text-left
              "
            >
              {openIndex === index ? (
                <ChevronDown
                  size={15}
                  className="text-[#6b7280]"
                />
              ) : (
                <Plus
                  size={14}
                  className="text-[#6b7280]"
                />
              )}

              <span className="text-[13px] text-[#1f2937]">
                {item}
              </span>
            </button>

            {/* CONTENT */}

            {openIndex === index && (
              <div className="bg-white p-4 border-t border-[#dbe2ea]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f3f6fb]">
                      <th className="text-left p-3">
                        Component
                      </th>

                      <th className="text-right p-3">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr className="border-b">
                      <td className="p-3">
                        Basic Salary
                      </td>

                      <td className="p-3 text-right">
                        ₹ 5,00,000
                      </td>
                    </tr>

                    <tr className="border-b">
                      <td className="p-3">
                        HRA
                      </td>

                      <td className="p-3 text-right">
                        ₹ 2,00,000
                      </td>
                    </tr>

                    <tr>
                      <td className="p-3 font-semibold">
                        Total
                      </td>

                      <td className="p-3 text-right font-semibold">
                        ₹ 7,00,000
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div
      className="
        bg-white
        border
        border-[#d8e0ea]
        rounded-sm
        h-[90px]
        p-4
        flex
        flex-col
        justify-center
      "
    >
      <p className="text-[11px] text-[#6b7280] uppercase">
        {title}
      </p>

      <h2 className="text-[24px] font-semibold text-[#1f2937] mt-2">
        {value}
      </h2>
    </div>
  );
}
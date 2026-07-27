import React from "react";
import { ChevronDown, ChevronRight, Search, Download } from "lucide-react";
import { PanelTitle } from "./Typography";
import JumpList from "./JumpList";
import { toJumpId } from "../utils";

const PayslipsView = React.memo(function PayslipsView({
  payslipByYear, payslipYearOpen, setPayslipYearOpen,
  payslipMonthOpen, togglePayslipMonth,
  jumpToSection, handleViewPayslip, handleDownloadPayslip
}) {
  return (
    <div className="-m-4 bg-[#f5f7fb] min-h-[calc(100vh-5rem)] p-4">
      <PanelTitle>Payslips</PanelTitle>
      <div className="border border-[#dfe5ed] bg-white min-h-[520px] flex">
        <JumpList
          items={["2026", "2025", "2024"]}
          onJump={(item) => jumpToSection(item, () => setPayslipYearOpen((curr) => ({ ...curr, [item]: true })))} />

        <div className="flex-1 p-2 max-h-[520px] overflow-y-auto" data-doc-scroll>
          {Object.entries(payslipByYear).map(([year, rows]) => (
            <div key={year} id={toJumpId(year)} className="border border-[#dfe5ed] mb-2 bg-white">
              <button type="button"
                onClick={() => setPayslipYearOpen((curr) => ({ ...curr, [year]: !curr[year] }))}
                className="w-full px-3 py-2 border-b border-[#edf1f5] flex justify-between items-center text-left">
                <span className="text-[16px] font-semibold text-[#59657b] inline-flex items-center gap-1">
                  {payslipYearOpen[year] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {year}
                </span>
              </button>

              {payslipYearOpen[year] &&
                <div>
                  {rows.length === 0 ? (
                    <p className="px-3 py-3 text-[12px] text-[#9ca8b8]">No payslips available.</p>
                  ) : rows.map((row) => {
                    const monthOpen = !!payslipMonthOpen[row.month];
                    return (
                      <div key={row.month} className="border-b border-[#f2f4f7] last:border-b-0">
                        <button type="button" onClick={() => togglePayslipMonth(row.month)}
                          className="w-full px-3 py-2 flex justify-between items-start text-left">
                          <div>
                            <div className="text-[14px] text-[#49566c] font-semibold inline-flex items-center gap-1">
                              {monthOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                              {row.month}
                            </div>
                            <p className="text-[12px] text-[#99a5b6] ml-5">{row.text}</p>
                          </div>
                          <span className="text-[11px] text-[#a4afbf] shrink-0 ml-2">Last updated on {row.date}</span>
                        </button>

                        {monthOpen && row.file &&
                          <div className="px-3 pb-3 ml-5">
                            <div className="border border-[#dfe5ed] h-8 px-3 text-[12px] inline-flex items-center gap-8 bg-white">
                              <span>{row.file}</span>
                              <span className="inline-flex gap-2 text-[#8d9aad]">
                                <button type="button" onClick={() => handleViewPayslip(row)}
                                  className="hover:text-[#1890ff] p-0.5" aria-label={`View ${row.file}`} title="View payslip">
                                  <Search size={12} />
                                </button>
                                <button type="button" onClick={() => handleDownloadPayslip(row)}
                                  className="hover:text-[#1890ff] p-0.5" aria-label={`Download ${row.file}`} title="Download payslip">
                                  <Download size={12} />
                                </button>
                              </span>
                            </div>
                          </div>
                        }
                      </div>
                    );
                  })}
                </div>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default PayslipsView;

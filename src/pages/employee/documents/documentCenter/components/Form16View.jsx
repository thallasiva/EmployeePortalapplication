import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PanelTitle } from "./Typography";
import JumpList from "./JumpList";
import { FORM16_YEARS } from "../constants";
import { toJumpId } from "../utils";

const Form16View = React.memo(function Form16View({
  form16YearOpen, setForm16YearOpen, jumpToSection
}) {
  return (
    <div className="-m-4 bg-[#f5f7fb] min-h-[calc(100vh-5rem)] p-4">
      <PanelTitle>Form 16</PanelTitle>
      <div className="border border-[#dfe5ed] bg-white min-h-[520px] flex">
        <JumpList
          items={FORM16_YEARS}
          onJump={(item) => jumpToSection(item, () => setForm16YearOpen((curr) => ({ ...curr, [item]: true })))} />

        <div className="flex-1 p-2 max-h-[520px] overflow-y-auto" data-doc-scroll>
          {FORM16_YEARS.map((year) => (
            <div key={year} id={toJumpId(year)} className="border border-[#dfe5ed] mb-2 bg-white">
              <button type="button"
                onClick={() => setForm16YearOpen((curr) => ({ ...curr, [year]: !curr[year] }))}
                className="w-full px-3 py-2 border-b border-[#edf1f5] flex justify-between items-center text-left">
                <span className="text-[16px] font-semibold text-[#59657b] inline-flex items-center gap-1">
                  {form16YearOpen[year] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  FY {year}
                </span>
              </button>
              {form16YearOpen[year] &&
                <p className="px-3 py-3 text-[12px] text-[#9ca8b8]">No Form 16 available for this financial year.</p>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default Form16View;

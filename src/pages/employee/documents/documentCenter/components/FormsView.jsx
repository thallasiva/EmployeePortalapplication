import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PanelTitle } from "./Typography";
import JumpList from "./JumpList";
import { FORM_SECTIONS } from "../constants";
import { toJumpId } from "../utils";

const FormsView = React.memo(function FormsView({
  formSectionOpen, setFormSectionOpen, jumpToSection
}) {
  return (
    <div className="-m-4 bg-[#f5f7fb] min-h-[calc(100vh-5rem)] p-4">
      <PanelTitle>Forms</PanelTitle>
      <div className="border border-[#dfe5ed] bg-white min-h-[520px] flex">
        <JumpList
          items={FORM_SECTIONS.map((s) => s.jumpLabel)}
          onJump={(item) => {
            const section = FORM_SECTIONS.find((s) => s.jumpLabel === item);
            if (!section) return;
            jumpToSection(section.id, () => setFormSectionOpen((curr) => ({ ...curr, [section.id]: true })));
          }} />

        <div className="flex-1 p-2 max-h-[520px] overflow-y-auto" data-doc-scroll>
          {FORM_SECTIONS.map((section) => (
            <div key={section.id} id={toJumpId(section.id)} className="border border-[#dfe5ed] mb-2 bg-white">
              <button type="button"
                onClick={() => setFormSectionOpen((curr) => ({ ...curr, [section.id]: !curr[section.id] }))}
                className="w-full px-3 py-2 border-b border-[#edf1f5] flex justify-between items-center text-left">
                <h4 className="text-[14px] font-semibold text-[#586377] inline-flex items-center gap-1">
                  {formSectionOpen[section.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {section.title}
                </h4>
              </button>
              {formSectionOpen[section.id] &&
                <p className="px-3 py-3 text-[12px] text-[#9ca8b8]">No forms are available in this section yet.</p>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default FormsView;

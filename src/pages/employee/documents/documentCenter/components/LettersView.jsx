import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PanelTitle } from "./Typography";
import JumpList from "./JumpList";
import { EmptyDocIllustration } from "./Illustrations";
import { LETTER_SECTIONS } from "../constants";
import { toJumpId } from "../utils";

const LettersView = React.memo(function LettersView({
  letterSectionOpen, setLetterSectionOpen, jumpToSection
}) {
  return (
    <div className="-m-4 bg-[#f5f7fb] min-h-[calc(100vh-5rem)] p-4">
      <PanelTitle>Letters List</PanelTitle>
      <div className="border border-[#dfe5ed] bg-white min-h-[520px] flex">
        <JumpList
          items={LETTER_SECTIONS.map((s) => s.jumpLabel)}
          onJump={(item) => {
            const section = LETTER_SECTIONS.find((s) => s.jumpLabel === item);
            if (!section) return;
            jumpToSection(section.id, () => setLetterSectionOpen((curr) => ({ ...curr, [section.id]: true })));
          }} />

        <div className="flex-1 p-2 max-h-[520px] overflow-y-auto" data-doc-scroll>
          {LETTER_SECTIONS.map((section) => (
            <div key={section.id} id={toJumpId(section.id)} className="border border-[#dfe5ed] mb-2 bg-white">
              <button type="button"
                onClick={() => setLetterSectionOpen((curr) => ({ ...curr, [section.id]: !curr[section.id] }))}
                className="w-full px-3 py-2 border-b border-[#edf1f5] flex justify-between items-center text-left">
                <h4 className="text-[14px] font-semibold text-[#586377] inline-flex items-center gap-1">
                  {letterSectionOpen[section.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {section.title}
                </h4>
              </button>
              {letterSectionOpen[section.id] &&
                <div className="px-3 py-6 flex items-center justify-center">
                  <div className="text-center">
                    <EmptyDocIllustration />
                    <p className="text-[16px] text-[#7a8699] mt-2">Sigh! It&apos;s lonely here</p>
                    <p className="text-[12px] text-[#a2adbd] mt-1">No items are available yet!</p>
                  </div>
                </div>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default LettersView;

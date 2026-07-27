import React from "react";
import { FileText } from "lucide-react";
import { VIEW } from "../constants";
import { HeroIllustration } from "./Illustrations";
import { SectionTitle } from "./Typography";
import DocNavCard from "./DocNavCard";

const HomeView = React.memo(function HomeView({ setView }) {
  return (
    <div className="-m-4 bg-[#f5f7fb] min-h-[calc(100vh-5rem)] p-4">
      <div className="bg-white border border-[#e6ebf2] p-4 flex items-center justify-between">
        <div>
          <h2 className="text-[26px] font-semibold text-[#2f3a4a]">We&apos;ve got it sorted for you!</h2>
          <p className="text-[14px] text-[#7a8799] mt-2">All Documents are now in one place..</p>
          <p className="text-[14px] text-[#7a8799]">
            You can now request a new letter if you don&apos;t find the one you were looking for..
          </p>
        </div>
        <HeroIllustration />
      </div>

      <div className="mt-4">
        <SectionTitle>Documents</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <DocNavCard icon={<FileText size={14} className="text-[#8b6fb3]" />} title="Documents" onClick={() => setView(VIEW.DOCUMENTS)} />
          <DocNavCard icon={<FileText size={14} className="text-[#d6a861]" />} title="Payslips" onClick={() => setView(VIEW.PAYSLIPS)} />
          <DocNavCard icon={<FileText size={14} className="text-[#dd869f]" />} title="Form 16" onClick={() => setView(VIEW.FORM16)} />
          <DocNavCard icon={<FileText size={14} className="text-[#73b695]" />} title="Company Policies" onClick={() => setView(VIEW.POLICIES)} />
          <DocNavCard icon={<FileText size={14} className="text-[#dd869f]" />} title="Forms" onClick={() => setView(VIEW.FORMS)} />
        </div>
      </div>

      <div className="mt-4 max-w-[240px]">
        <SectionTitle>Request</SectionTitle>
        <button
          type="button"
          onClick={() => setView(VIEW.LETTERS)}
          className="w-full bg-white border border-[#e8edf3] p-3 text-left hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-[13px] text-[#2f3a4a]">
              <FileText size={14} className="text-[#6ea8dc]" />
              Letters
            </span>
            <span className="text-[12px] text-[#5a78ad]">View All</span>
          </div>
          <div className="mt-2 text-[12px] text-[#8d98a8] flex justify-between">
            <span>Pending: 0</span>
            <span>Closed: 0</span>
          </div>
        </button>
      </div>
    </div>
  );
});

export default HomeView;

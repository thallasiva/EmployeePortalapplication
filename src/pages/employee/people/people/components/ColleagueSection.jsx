import React from "react";
import SectionLabel from "./SectionLabel";
import ColleagueCard from "./ColleagueCard";

const ColleagueSection = React.memo(function ColleagueSection({ title, people, isDirectReport }) {
  if (!people || people.length === 0) return null;
  return (
    <div className="bg-white rounded-[14px] border border-slate-200 p-5 mb-4">
      <SectionLabel>
        {title} ({people.length})
      </SectionLabel>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-2.5">
        {people.map((p) => (
          <ColleagueCard key={p.id} person={p} isDirectReport={isDirectReport} />
        ))}
      </div>
    </div>
  );
});

export default ColleagueSection;

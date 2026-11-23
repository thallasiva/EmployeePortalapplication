import React, { useState } from "react";
import { BarChart3 } from "lucide-react";
import { FeedbackReport, GiveKudosModal, Tabs } from "../../../employee/worklife/kudosFeedbackShared";
import { CategoriesTab } from "./CategoriesTab";
import { WallTab } from "./WallTab";
const AdminKudosFeedback = () => {
  const [tab, setTab] = useState("overview");
  const [kudosFor, setKudosFor] = useState(null);
  return <div className="space-y-6">
      {kudosFor && <GiveKudosModal preset={[kudosFor]} onClose={() => setKudosFor(null)} />}
      <div>
        <h1 className="text-2xl font-bold  text-[#e87500]">Kudos &amp; Feedback</h1>
        <p className="text-slate-500 mt-1 text-sm">Organisation-wide recognition, feedback trends and category setup.</p>
      </div>
      <Tabs label="Kudos and feedback admin" active={tab} onChange={setTab} tabs={[{
      key: "overview",
      label: "Reports"
    }, {
      key: "wall",
      label: "Kudos Wall"
    }, {
      key: "categories",
      label: "Manage Categories"
    }]} />
      {tab === "overview" && <>
          <p className="text-sm text-slate-500 flex items-center gap-2"><BarChart3 size={15} /> Filters apply to every chart and the export.</p>
          <FeedbackReport onGiveKudos={setKudosFor} />
        </>}
      {tab === "wall" && <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"><WallTab /></section>}
      {tab === "categories" && <CategoriesTab />}
    </div>;
};
export { AdminKudosFeedback };

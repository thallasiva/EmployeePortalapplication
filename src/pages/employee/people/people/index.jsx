import React from "react";
import { Users } from "lucide-react";
import { usePeopleData } from "./hooks/usePeopleData";
import MyProfile from "./components/MyProfile";
import ReportingManager from "./components/ReportingManager";
import TeamStats from "./components/TeamStats";
import ColleagueSection from "./components/ColleagueSection";
import LoadingSkeleton from "./components/LoadingSkeleton";

export default function People() {
  const { loading, error, self, manager, directReports, peers, deptTeam } = usePeopleData();

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="p-10 text-center text-red-500 text-sm">{error}</div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", padding: "20px 24px" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1f2937" }}>My Team</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
          Your position, manager, and team at a glance
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <MyProfile self={self} />
        <div className="flex flex-col gap-4">
          <ReportingManager manager={manager} />
          <TeamStats self={self} directReports={directReports} peers={peers} />
        </div>
      </div>

      <ColleagueSection title="Direct Reports" people={directReports} isDirectReport />
      <ColleagueSection title="Teammates — same manager" people={peers} />
      <ColleagueSection
        title={`Others in ${self?.departmentName || "Department"}`}
        people={deptTeam}
      />

      {!self && !loading && (
        <div className="bg-white rounded-[14px] border border-slate-200 p-12 text-center">
          <Users size={48} strokeWidth={1} className="text-slate-200 mb-3 mx-auto" />
          <p className="text-sm text-slate-400">No team information available.</p>
        </div>
      )}
    </div>
  );
}

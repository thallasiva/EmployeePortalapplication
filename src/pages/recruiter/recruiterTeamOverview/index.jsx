import React, { useState, useMemo, useCallback } from "react";
import { Users, CalendarCheck, Clock, UserCheck, TrendingUp } from "lucide-react";
import { usePagination } from "../../../components/Pagination";
import RecruiterTabs from "../RecruiterTabs";
import { useTeamOverview } from "./hooks/useTeamOverview";
import KPICard from "./components/KPICard";
import DepartmentBreakdown from "./components/DepartmentBreakdown";
import TeamTable from "./components/TeamTable";
import PendingLeaveApprovals from "./components/PendingLeaveApprovals";
import "../../admin/adminDashboard.css";

export default function RecruiterTeamOverview() {
  const {
    team,
    att,
    loading,
    kpis,
    departments,
    deptBreakdown,
    pendingLeavesRows,
    reviewing,
    handleLeave,
  } = useTeamOverview();

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  const filteredTeam = useMemo(() => {
    const q = search.toLowerCase();
    return team.filter((e) => {
      const name = (e.name || e.employee_name || "").toLowerCase();
      const code = (e.emp_code || "").toLowerCase();
      const dept = e.department_name || e.department || "";
      return (
        (!q || name.includes(q) || code.includes(q)) &&
        (deptFilter === "All" || dept === deptFilter)
      );
    });
  }, [team, search, deptFilter]);

  const { paged, page, setPage, totalPages, from, to, total, pageSize, setPageSize } =
    usePagination(filteredTeam);

  const handleDeptFilter = useCallback((dept) => setDeptFilter(dept), []);

  return (
    <div className="admin-dash space-y-6">
      <RecruiterTabs />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Team Overview</h1>
          <p className="text-gray-500 mt-1">
            Organisation-wide team status —{" "}
            {new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-16">Loading team data...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KPICard icon={Users} label="Total Employees" value={team.length} color="bg-blue-500" />
            <KPICard icon={UserCheck} label="Present Today" value={kpis.presentToday} color="bg-emerald-500" />
            <KPICard icon={Clock} label="Absent Today" value={kpis.absentToday} color="bg-rose-500" />
            <KPICard icon={TrendingUp} label="Late Arrivals" value={kpis.lateToday} color="bg-amber-500" />
            <KPICard icon={CalendarCheck} label="Pending Leaves" value={kpis.pendingLeaves} color="bg-purple-500" />
          </div>

          <DepartmentBreakdown
            deptBreakdown={deptBreakdown}
            deptFilter={deptFilter}
            setDeptFilter={handleDeptFilter}
          />

          <TeamTable
            filteredTeam={filteredTeam}
            team={team}
            att={att}
            departments={departments}
            deptFilter={deptFilter}
            search={search}
            setSearch={setSearch}
            paged={paged}
            page={page}
            setPage={setPage}
            totalPages={totalPages}
            from={from}
            to={to}
            total={total}
            pageSize={pageSize}
            setPageSize={setPageSize}
          />

          <PendingLeaveApprovals
            pendingLeavesRows={pendingLeavesRows}
            pendingLeaves={kpis.pendingLeaves}
            reviewing={reviewing}
            handleLeave={handleLeave}
          />
        </>
      )}
    </div>
  );
}

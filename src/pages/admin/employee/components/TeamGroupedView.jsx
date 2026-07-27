import React, { useMemo } from "react";
import { getDepartmentName } from "../../../../utils/employeeDisplay";
import TeamGroupCard from "./TeamGroupCard";

const TeamGroupedView = React.memo(function TeamGroupedView({ employees }) {
  const groups = useMemo(() => {
    const map = {};
    employees.forEach((emp) => {
      const dept = getDepartmentName(emp) || "General";
      if (!map[dept]) map[dept] = [];
      map[dept].push(emp);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [employees]);

  if (!groups.length) {
    return <p className="text-sm text-gray-400 py-8 text-center">No employees found.</p>;
  }

  return (
    <div className="space-y-4">
      <span className="text-sm font-medium text-gray-600">
        {employees.length} employees across {groups.length} team{groups.length !== 1 ? "s" : ""}
      </span>
      {groups.map(([dept, emps]) => (
        <TeamGroupCard key={dept} department={dept} employees={emps} />
      ))}
    </div>
  );
});

export default TeamGroupedView;

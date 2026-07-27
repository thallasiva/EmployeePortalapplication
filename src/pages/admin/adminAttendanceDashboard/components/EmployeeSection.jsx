import React from "react";
import { Users } from "lucide-react";
import { EMPLOYEE_TABS } from "../constants";
import EmployeeTable from "./EmployeeTable";

const EmployeeSection = React.memo(function EmployeeSection({
  employees, filteredEmployees, loading, employeeTab, onTabChange, tabCounts, onRegularize,
}) {
  return (
    <section className="admin-dash-card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">
            All Employees – Today&apos;s Attendance
          </h3>
        </div>
        <span className="text-xs text-gray-400">
          {filteredEmployees.length} of {employees.length} employees
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-100 pb-3">
        {EMPLOYEE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`admin-tab-btn ${employeeTab === tab.id ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label} ({tabCounts[tab.id]})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-8">Loading attendance...</p>
      ) : (
        <EmployeeTable employees={filteredEmployees} onRegularize={onRegularize} />
      )}
    </section>
  );
});

export default EmployeeSection;

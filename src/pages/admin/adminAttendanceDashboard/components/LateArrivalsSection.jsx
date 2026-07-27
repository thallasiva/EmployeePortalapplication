import React from "react";
import { AlertTriangle } from "lucide-react";
import { getInitials } from "../utils";

const LateArrivalsSection = React.memo(function LateArrivalsSection({ lateEmployees, lateSectionRef }) {
  if (lateEmployees.length === 0) return null;

  return (
    <section ref={lateSectionRef} className="admin-dash-card border-orange-200 bg-orange-50/30">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={18} className="text-orange-500" />
        <h3 className="font-semibold text-gray-900">
          Late Arrivals Today ({lateEmployees.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="admin-att-table w-full">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Check In</th>
              <th>Scheduled</th>
              <th>Late By</th>
              <th>Check Out</th>
              <th>Hours</th>
            </tr>
          </thead>
          <tbody>
            {lateEmployees.map((emp) => (
              <tr key={emp.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <span className="admin-emp-avatar">{getInitials(emp.name)}</span>
                    <span className="font-medium text-gray-900">{emp.name}</span>
                  </div>
                </td>
                <td className="text-gray-600">{emp.department}</td>
                <td className="font-semibold text-orange-600">{emp.checkIn}</td>
                <td className="text-gray-500">09:00</td>
                <td className="text-orange-600 font-medium">{emp.lateBy ?? "—"}</td>
                <td className="text-gray-600">{emp.checkOut}</td>
                <td className="text-orange-600 font-semibold">{emp.hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
});

export default LateArrivalsSection;

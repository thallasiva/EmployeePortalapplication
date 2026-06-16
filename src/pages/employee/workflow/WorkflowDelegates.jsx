import React, { useState } from "react";
import { GitBranch, User } from "lucide-react";
import { successToast } from "../../../utils/ToastControllers";

/** Departments mirror the organization chart's legend/colors. */
const DEPARTMENTS = [
  {
    id: "engineering",
    name: "Engineering",
    color: "#6366f1",
    approver: "Sarah Chen",
    teamMembers: ["Marcus Johnson", "Priya Patel", "Aisha Rahman", "Daniel Kim", "Kevin Zhao"],
  },
  {
    id: "product",
    name: "Product",
    color: "#a855f7",
    approver: "James Williams",
    teamMembers: ["Ryan O'Brien", "Amanda Wright"],
  },
  {
    id: "design",
    name: "Design",
    color: "#ec4899",
    approver: "Sarah Chen",
    teamMembers: ["Aisha Rahman", "Daniel Kim"],
  },
  {
    id: "marketing",
    name: "Marketing",
    color: "#f97316",
    approver: "Lisa Anderson",
    teamMembers: ["Chris Brown", "Jenni Sims"],
  },
  {
    id: "sales",
    name: "Sales",
    color: "#10b981",
    approver: "Rahul Mehta",
    teamMembers: ["John Gibbs", "Maria Garcia", "Diana Ross"],
  },
  {
    id: "hr",
    name: "HR",
    color: "#ef4444",
    approver: "Ananya Iyer",
    teamMembers: ["Sarah Chen", "Nina Patel"],
  },
  {
    id: "finance",
    name: "Finance",
    color: "#3b82f6",
    approver: "Neha Kapoor",
    teamMembers: ["Emily Watson", "Sophie Martin", "Olivia White"],
  },
  {
    id: "operations",
    name: "Operations",
    color: "#84cc16",
    approver: "Vikram Singh",
    teamMembers: ["James Wilson", "Alex Turner", "Tom Harris"],
  },
];

function DelegateCard({ dept, delegate, fromDate, toDate, onChange, onSave }) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: dept.color }}
          />
          <h3 className="text-[15px] font-semibold text-[#1e293b]">{dept.name}</h3>
        </div>
        <span className="text-xs text-[#94a3b8] flex items-center gap-1">
          <User size={12} /> Approver: {dept.approver}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-[#64748b] mb-1">Delegate</label>
          <select
            value={delegate}
            onChange={(e) => onChange(dept.id, "delegate", e.target.value)}
            className="w-full h-[38px] px-2 border border-[#dbe2ea] rounded text-[14px] outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
          >
            <option value="">No delegate (use approver)</option>
            {dept.teamMembers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-[#64748b] mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onChange(dept.id, "from", e.target.value)}
            disabled={!delegate}
            className="w-full h-[38px] px-2 border border-[#dbe2ea] rounded text-[14px] outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:bg-[#f1f5f9] disabled:text-[#94a3b8]"
          />
        </div>

        <div>
          <label className="block text-xs text-[#64748b] mb-1">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => onChange(dept.id, "to", e.target.value)}
            disabled={!delegate}
            className="w-full h-[38px] px-2 border border-[#dbe2ea] rounded text-[14px] outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:bg-[#f1f5f9] disabled:text-[#94a3b8]"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-[#94a3b8]">
          {delegate
            ? `${delegate} will approve requests on behalf of ${dept.approver}${
                fromDate && toDate ? ` from ${fromDate} to ${toDate}` : ""
              }.`
            : `${dept.approver} currently handles all approvals for this department.`}
        </p>
        <button
          type="button"
          onClick={() => onSave(dept.name)}
          className="h-[34px] px-4 rounded bg-[#2ea7ff] text-white text-[13px] font-medium hover:bg-[#1995ef] shrink-0"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default function WorkflowDelegates() {
  const [delegates, setDelegates] = useState({});

  const handleChange = (deptId, field, value) => {
    setDelegates((prev) => ({
      ...prev,
      [deptId]: {
        delegate: prev[deptId]?.delegate ?? "",
        from: prev[deptId]?.from ?? "",
        to: prev[deptId]?.to ?? "",
        [field]: value,
      },
    }));
  };

  const handleSave = (deptName) => {
    successToast(`Delegate settings saved for ${deptName}.`);
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">
      <div className="flex items-center gap-2 mb-1">
        <GitBranch size={22} className="text-[#2ea7ff]" />
        <h1 className="text-[22px] font-semibold text-[#1f2937]">Workflow Delegates</h1>
      </div>
      <p className="text-sm text-[#64748b] mb-6">
        Assign a delegate per department to handle approvals (leave, attendance
        regularizations, expenses) while the primary approver is unavailable.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {DEPARTMENTS.map((dept) => (
          <DelegateCard
            key={dept.id}
            dept={dept}
            delegate={delegates[dept.id]?.delegate ?? ""}
            fromDate={delegates[dept.id]?.from ?? ""}
            toDate={delegates[dept.id]?.to ?? ""}
            onChange={handleChange}
            onSave={handleSave}
          />
        ))}
      </div>
    </div>
  );
}

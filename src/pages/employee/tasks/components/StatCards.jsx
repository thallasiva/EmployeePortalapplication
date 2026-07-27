import { memo } from "react";

const StatCards = memo(function StatCards({ counts, onStatClick }) {
  const cards = [
    {
      label: "Draft Tasks",
      value: counts?.draftTasks ?? "—",
      bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700", num: "text-gray-800",
      onClick: () => onStatClick("tasks"),
    },
    {
      label: "Total Weeks",
      value: counts?.submittedWeeks ?? "—",
      bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600", num: "text-blue-700",
      onClick: () => onStatClick("timesheets", null),
    },
    {
      label: "Pending Approval",
      value: counts?.pendingApproval ?? "—",
      bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600", num: "text-amber-700",
      onClick: () => onStatClick("timesheets", "pending"),
    },
    {
      label: "Approved Weeks",
      value: counts?.approvedWeeks ?? "—",
      bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600", num: "text-emerald-700",
      onClick: () => onStatClick("timesheets", "approved"),
    },
    {
      label: "Rejected Weeks",
      value: counts?.rejectedWeeks ?? "—",
      bg: "bg-red-50", border: "border-red-200", text: "text-red-500", num: "text-red-600",
      onClick: () => onStatClick("timesheets", "rejected"),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => (
        <button key={card.label} onClick={card.onClick}
          className={`${card.bg} border ${card.border} rounded-xl px-4 py-3 text-left hover:shadow-md transition-all cursor-pointer group`}>
          <p className={`text-2xl font-extrabold ${card.num} group-hover:scale-105 transition-transform`}>
            {card.value}
          </p>
          <p className={`text-xs font-semibold mt-1 ${card.text}`}>{card.label}</p>
        </button>
      ))}
    </div>
  );
});

export default StatCards;

const statusClasses = {
  "Work in Progress": "bg-blue-100 text-blue-700",
  "Schedule Interview": "bg-violet-100 text-violet-600",
  Shortlisted: "bg-sky-100 text-sky-700",
  "Offer Released": "bg-amber-100 text-amber-600",
  "Offer Accepted": "bg-emerald-100 text-emerald-600",
  "Offer Rejected": "bg-red-100 text-red-600",
  "Joining Formalities": "bg-cyan-100 text-cyan-600",
  Onboarded: "bg-green-100 text-green-800",
};

export default function CandidateStatusBadge({ status }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-[9px] py-[2px] text-[11px] font-semibold tracking-[0.02em] ${statusClasses[status] ?? "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

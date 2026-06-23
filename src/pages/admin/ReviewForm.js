import React, { useState } from "react";
import { Star, ChevronDown, ChevronUp, User } from "lucide-react";

// ── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name = "") {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f97316","#14b8a6","#f18200","#f18200"];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function Avatar({ name, size = 36 }) {
  const bg = avatarColor(name);
  return (
    <span
      style={{ width: size, height: size, background: bg, borderRadius: "50%", display:"inline-flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize: size * 0.35, flexShrink:0 }}
    >
      {getInitials(name)}
    </span>
  );
}

function StarRating({ rating, max = 5 }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={14}
          fill={i < Math.round(rating) ? "#f59e0b" : "none"}
          stroke={i < Math.round(rating) ? "#f59e0b" : "#d1d5db"}
        />
      ))}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Completed: "bg-green-50 text-green-700 border border-green-200",
    "In Progress": "bg-orange-50 text-orange-600 border border-orange-200",
    Pending: "bg-gray-50 text-gray-500 border border-gray-200",
    "Not Started": "bg-gray-50 text-gray-400 border border-gray-200",
  };
  return (
    <span className={`text-[12px] font-medium px-2.5 py-0.5 rounded ${styles[status] ?? styles["Pending"]}`}>
      {status}
    </span>
  );
}

// ── Static review data (realistic) ─────────────────────────────────────────

const REVIEW_CYCLES = [
  {
    id: 1,
    cycle: "Q1 2026 Performance Review",
    period: "Jan 2026 – Mar 2026",
    dueDate: "15 Apr 2026",
    status: "Completed",
    reviews: [
      {
        id: 101,
        employee: "Arjun Mehta",
        role: "Senior Frontend Developer",
        reviewer: "Priya Sharma",
        overallRating: 4.5,
        categories: [
          { name: "Technical Skills", rating: 5 },
          { name: "Teamwork", rating: 4 },
          { name: "Communication", rating: 4 },
          { name: "Delivery", rating: 5 },
        ],
        comments: "Exceptional work on the new dashboard. Consistently delivers high-quality code and mentors junior team members effectively.",
        status: "Completed",
      },
      {
        id: 102,
        employee: "Sneha Rao",
        role: "HR Manager",
        reviewer: "Vikram Singh",
        overallRating: 4.0,
        categories: [
          { name: "Technical Skills", rating: 4 },
          { name: "Teamwork", rating: 5 },
          { name: "Communication", rating: 4 },
          { name: "Delivery", rating: 3 },
        ],
        comments: "Strong collaboration skills and excellent onboarding process design. Should focus on deadline adherence for process documentation.",
        status: "Completed",
      },
      {
        id: 103,
        employee: "Rahul Nair",
        role: "Backend Developer",
        reviewer: "Priya Sharma",
        overallRating: 3.5,
        categories: [
          { name: "Technical Skills", rating: 4 },
          { name: "Teamwork", rating: 3 },
          { name: "Communication", rating: 3 },
          { name: "Delivery", rating: 4 },
        ],
        comments: "Good technical foundation. Needs to improve cross-team communication and proactive status updates.",
        status: "Completed",
      },
    ],
  },
  {
    id: 2,
    cycle: "Q2 2026 Performance Review",
    period: "Apr 2026 – Jun 2026",
    dueDate: "15 Jul 2026",
    status: "In Progress",
    reviews: [
      {
        id: 201,
        employee: "Arjun Mehta",
        role: "Senior Frontend Developer",
        reviewer: "Priya Sharma",
        overallRating: null,
        categories: [
          { name: "Technical Skills", rating: null },
          { name: "Teamwork", rating: null },
          { name: "Communication", rating: null },
          { name: "Delivery", rating: null },
        ],
        comments: "",
        status: "In Progress",
      },
      {
        id: 202,
        employee: "Divya Krishnan",
        role: "UI/UX Designer",
        reviewer: "Vikram Singh",
        overallRating: null,
        categories: [],
        comments: "",
        status: "Pending",
      },
      {
        id: 203,
        employee: "Rahul Nair",
        role: "Backend Developer",
        reviewer: "Priya Sharma",
        overallRating: null,
        categories: [],
        comments: "",
        status: "Not Started",
      },
    ],
  },
];

// ── ReviewRow — expandable ─────────────────────────────────────────────────

function ReviewRow({ review }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={review.employee} size={32} />
            <div>
              <p className="text-[13px] font-semibold text-gray-900">{review.employee}</p>
              <p className="text-[11px] text-gray-400">{review.role}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Avatar name={review.reviewer} size={26} />
            <span className="text-[13px] text-gray-700">{review.reviewer}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          {review.overallRating !== null ? (
            <div className="flex items-center gap-1.5">
              <StarRating rating={review.overallRating} />
              <span className="text-[13px] font-medium text-gray-700">{review.overallRating}</span>
            </div>
          ) : (
            <span className="text-[12px] text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={review.status} />
        </td>
        <td className="px-4 py-3 text-gray-400">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </td>
      </tr>

      {open && (
        <tr className="bg-gray-50">
          <td colSpan={5} className="px-6 py-4">
            {review.categories.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                {review.categories.map((cat) => (
                  <div key={cat.name} className="bg-white border border-gray-100 rounded-lg p-3">
                    <p className="text-[11px] text-gray-500 mb-1.5">{cat.name}</p>
                    {cat.rating !== null ? (
                      <>
                        <StarRating rating={cat.rating} />
                        <p className="text-[12px] text-gray-600 mt-1">{cat.rating} / 5</p>
                      </>
                    ) : (
                      <span className="text-[12px] text-gray-400">Not rated yet</span>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
            {review.comments ? (
              <div className="bg-white border border-gray-100 rounded-lg p-3">
                <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1">Manager Comments</p>
                <p className="text-[13px] text-gray-700">{review.comments}</p>
              </div>
            ) : (
              <p className="text-[13px] text-gray-400 italic">Review not yet filled in.</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ── CycleSection ─────────────────────────────────────────────────────────────

function CycleSection({ cycle }) {
  const [collapsed, setCollapsed] = useState(false);
  const completed = cycle.reviews.filter((r) => r.status === "Completed").length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4 text-left">
          <div>
            <p className="font-semibold text-[15px] text-gray-900">{cycle.cycle}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">{cycle.period} · Due {cycle.dueDate}</p>
          </div>
          <StatusBadge status={cycle.status} />
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-[12px] text-gray-500 hidden sm:block">
            {completed}/{cycle.reviews.length} completed
          </span>
          {collapsed ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
        </div>
      </button>

      {!collapsed && (
        <div className="border-t border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-[12px] text-gray-500 font-semibold">
                <th className="px-4 py-2.5 text-left">Employee</th>
                <th className="px-4 py-2.5 text-left">Reviewer</th>
                <th className="px-4 py-2.5 text-left">Rating</th>
                <th className="px-4 py-2.5 text-left">Status</th>
                <th className="px-4 py-2.5 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {cycle.reviews.map((r) => (
                <ReviewRow key={r.id} review={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function ReviewForm() {
  const [filterStatus, setFilterStatus] = useState("All");

  const statuses = ["All", "Completed", "In Progress", "Pending", "Not Started"];

  const filteredCycles = REVIEW_CYCLES.map((cycle) => ({
    ...cycle,
    reviews: filterStatus === "All"
      ? cycle.reviews
      : cycle.reviews.filter((r) => r.status === filterStatus),
  })).filter((cycle) => cycle.reviews.length > 0);

  const totalReviews = REVIEW_CYCLES.flatMap((c) => c.reviews).length;
  const completedCount = REVIEW_CYCLES.flatMap((c) => c.reviews).filter((r) => r.status === "Completed").length;
  const inProgressCount = REVIEW_CYCLES.flatMap((c) => c.reviews).filter((r) => r.status === "In Progress").length;
  const pendingCount = REVIEW_CYCLES.flatMap((c) => c.reviews).filter((r) => r.status === "Pending" || r.status === "Not Started").length;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Reviews", value: totalReviews, color: "#f18200" },
          { label: "Completed", value: completedCount, color: "#16a34a" },
          { label: "In Progress", value: inProgressCount, color: "#f97316" },
          { label: "Pending", value: pendingCount, color: "#6b7280" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[12px] text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-gray-500 font-medium">Filter:</span>
        {statuses.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilterStatus(s)}
            className={`px-3 h-8 rounded-full text-[12px] font-medium border transition-colors ${
              filterStatus === s
                ? "bg-[#f18200] text-white border-[#f18200]"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Review cycles */}
      {filteredCycles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <User size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No reviews match the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCycles.map((cycle) => (
            <CycleSection key={cycle.id} cycle={cycle} />
          ))}
        </div>
      )}
    </div>
  );
}

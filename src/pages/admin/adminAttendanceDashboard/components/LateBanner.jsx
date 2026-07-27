import React from "react";
import { TrendingUp } from "lucide-react";

const LateBanner = React.memo(function LateBanner({ summary, onScrollToLate }) {
  return (
    <section
      role="button"
      tabIndex={0}
      onClick={summary.lateToday > 0 ? onScrollToLate : undefined}
      onKeyDown={(e) => e.key === "Enter" && summary.lateToday > 0 && onScrollToLate()}
      className={`admin-dash-card flex items-center gap-3 bg-emerald-50/50 border-emerald-100 ${
        summary.lateToday > 0 ? "admin-banner-clickable" : ""
      }`}
    >
      <TrendingUp size={20} className="text-emerald-600 shrink-0" />
      <p className="text-sm text-gray-700">
        {summary.lateToday === 0 ? (
          <>
            <span className="font-semibold text-emerald-700">No late arrivals today.</span>{" "}
            Great job, team!
          </>
        ) : (
          <>
            <span className="font-semibold text-orange-600">{summary.lateToday} employees</span>{" "}
            arrived late today.{" "}
            <span className="font-semibold text-emerald-700">{summary.presentToday} present</span>,{" "}
            <span className="font-semibold text-pink-600">{summary.absentToday} absent</span>.
            <span className="text-emerald-600 ml-1">Click to see who is late →</span>
          </>
        )}
      </p>
    </section>
  );
});

export default LateBanner;

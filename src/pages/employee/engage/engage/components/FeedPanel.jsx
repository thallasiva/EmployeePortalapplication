import React from "react";
import { SECTIONS } from "../constants";
import ActivityCard from "./ActivityCard";

const FeedPanel = React.memo(function FeedPanel({
  loading, visibleItems, activeFilter, search, navigate,
}) {
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-800">
          {SECTIONS.find((s) => s.key === activeFilter)?.label || "All Activities"}
          <span className="ml-2 text-xs font-normal text-gray-400">
            ({visibleItems.length} item{visibleItems.length !== 1 ? "s" : ""})
          </span>
        </h2>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl h-28 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-14 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-semibold text-gray-600 text-sm mb-1">No activities found</p>
          <p className="text-gray-400 text-xs">
            {search ? "Try a different search term." : "Check back later for updates."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => (
            <ActivityCard key={item.id} item={item} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
});

export default FeedPanel;

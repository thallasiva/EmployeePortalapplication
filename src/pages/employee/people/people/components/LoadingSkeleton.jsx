import React from "react";
import Skeleton from "./Skeleton";

const LoadingSkeleton = React.memo(function LoadingSkeleton() {
  return (
    <div className="px-6 max-w-[900px] mx-auto">
      <Skeleton w={200} h={20} r={8} mb={24} />
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-[14px] border border-slate-200 p-5">
            <div className="flex gap-3.5 mb-3.5">
              <Skeleton w={64} h={64} r="50%" />
              <div className="flex-1">
                <Skeleton w="60%" h={14} mb={8} />
                <Skeleton w="40%" h={11} mb={6} />
                <Skeleton w="30%" h={11} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default LoadingSkeleton;

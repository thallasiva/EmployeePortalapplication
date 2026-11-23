import { memo } from "react";
const SkeletonLine = memo(function SkeletonLine({
  width = "w-full",
  height = "h-4"
}) {
  return <div className={`${width} ${height} rounded bg-gray-200 animate-pulse`} />;
});
export { SkeletonLine };

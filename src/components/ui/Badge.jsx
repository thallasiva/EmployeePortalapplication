import { memo } from "react";

export const BADGE_COLORS = {
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  yellow: "bg-yellow-100 text-yellow-800",
  blue: "bg-blue-100 text-blue-700",
  gray: "bg-gray-100 text-gray-600",
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-purple-100 text-purple-700",
  teal: "bg-teal-100 text-teal-700",
  pink: "bg-pink-100 text-pink-700",
};

/**
 * Pill-shaped badge.
 * @param {'green'|'red'|'yellow'|'blue'|'gray'|'orange'|'purple'|'teal'|'pink'} color
 */
const Badge = memo(function Badge({ children, color = "gray", className = "" })
{
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${BADGE_COLORS[color] ?? BADGE_COLORS.gray} ${className}`}>
      {children}
    </span>
  );
});

export default Badge;

import React from "react";
import { Star } from "lucide-react";

const StarRating = React.memo(function StarRating({ rating, max = 5 }) {
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
});

export default StarRating;

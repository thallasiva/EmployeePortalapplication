import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Avatar from "./Avatar";
import StarRating from "./StarRating";
import StatusBadge from "./StatusBadge";

const ReviewRow = React.memo(function ReviewRow({ review }) {
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
            {review.categories.length > 0 && (
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
            )}
            {review.comments ? (
              <div className="bg-white border border-gray-100 rounded-lg p-3">
                <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1">
                  Manager Comments
                </p>
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
});

export default ReviewRow;

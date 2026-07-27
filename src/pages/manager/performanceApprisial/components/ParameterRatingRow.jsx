import React, { useCallback } from "react";
import { Star } from "lucide-react";
import { cssClass } from "../../../../utils/classStyles";
import { BRAND } from "../constants";
import StarPicker from "./StarPicker";

function ParameterRatingRow({ rating, mgRating, onRatingChange, onCommentChange, canReview }) {
  const handleStarChange = useCallback(
    (v) => onRatingChange(rating.parameter_key, v),
    [onRatingChange, rating.parameter_key]
  );

  const handleTextChange = useCallback(
    (e) => onCommentChange(rating.parameter_key, e.target.value),
    [onCommentChange, rating.parameter_key]
  );

  return (
    <div className={cssClass({ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px" })}>
      <p className={cssClass({ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: "0 0 10px" })}>
        {rating.parameter_label}
      </p>
      <div className={cssClass({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 })}>
        <div>
          <p className={cssClass({ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" })}>
            Employee Self Rating
          </p>
          <div className={cssClass({ display: "flex", alignItems: "center", gap: 4 })}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={16}
                className={cssClass({
                  color: (rating.self_rating || 0) >= n ? BRAND : "#e2e8f0",
                  fill: (rating.self_rating || 0) >= n ? BRAND : "#e2e8f0",
                })}
              />
            ))}
            <span className={cssClass({ fontSize: 12, color: "#64748b", marginLeft: 4 })}>
              {rating.self_rating || 0}/5
            </span>
          </div>
          {rating.self_comments && (
            <p className={cssClass({ fontSize: 11, color: "#64748b", margin: "6px 0 0", fontStyle: "italic" })}>
              "{rating.self_comments}"
            </p>
          )}
        </div>
        <div>
          <p className={cssClass({ fontSize: 11, color: "#6366f1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" })}>
            Your Rating
          </p>
          <StarPicker
            value={mgRating?.manager_rating || 0}
            onChange={handleStarChange}
            disabled={!canReview}
          />
          <textarea
            value={mgRating?.manager_comments || ""}
            onChange={handleTextChange}
            placeholder="Add your feedback…"
            rows={2}
            className={cssClass({
              width: "100%", marginTop: 6, border: "1px solid #e2e8f0", borderRadius: 6,
              padding: "6px 10px", fontSize: 12, outline: "none", resize: "vertical",
              boxSizing: "border-box", color: "#374151",
            })}
          />
        </div>
      </div>
    </div>
  );
}

export default React.memo(ParameterRatingRow);

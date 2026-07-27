import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cssClass } from "../../../../../utils/classStyles";
import { BRAND } from "../constants";
import StarPicker from "./StarPicker";

const ParamCard = React.memo(function ParamCard({ param, idx, rating, onChange, disabled }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={cssClass({
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 12, overflow: "hidden", marginBottom: 10,
    })}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cssClass({
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "13px 18px",
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
        })}
      >
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 12 })}>
          <div className={cssClass({
            width: 30, height: 30, borderRadius: 8,
            background: `${BRAND}18`, color: BRAND,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 13,
          })}>
            {idx}
          </div>
          <span className={cssClass({ fontSize: 14, fontWeight: 600, color: "#1e293b" })}>
            {param.label}
          </span>
        </div>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 10 })}>
          {(rating.self_rating || 0) > 0 && (
            <span className={cssClass({
              fontSize: 11, fontWeight: 700, color: BRAND,
              background: `${BRAND}12`, padding: "2px 8px", borderRadius: 999,
            })}>
              ★ {rating.self_rating}/5
            </span>
          )}
          {open
            ? <ChevronUp size={15} className={cssClass({ color: "#94a3b8" })} />
            : <ChevronDown size={15} className={cssClass({ color: "#94a3b8" })} />}
        </div>
      </button>

      {open && (
        <div className={cssClass({ padding: "0 18px 16px" })}>
          <p className={cssClass({
            fontSize: 11, fontWeight: 700, color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px",
          })}>
            Your Rating
          </p>
          <StarPicker
            value={rating.self_rating || 0}
            onChange={(v) => onChange({ ...rating, self_rating: v })}
            disabled={disabled}
          />
          <p className={cssClass({
            fontSize: 11, fontWeight: 700, color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: "0.06em", margin: "12px 0 6px",
          })}>
            Comments (Optional)
          </p>
          <textarea
            value={rating.self_comments || ""}
            disabled={disabled}
            onChange={(e) => onChange({ ...rating, self_comments: e.target.value })}
            placeholder="Describe your performance with examples…"
            rows={2}
            className={cssClass({
              width: "100%", border: "1px solid #e2e8f0", borderRadius: 8,
              padding: "8px 12px", fontSize: 13, outline: "none",
              resize: "vertical", boxSizing: "border-box",
              background: disabled ? "#f8fafc" : "#fff", color: "#374151",
            })}
          />
        </div>
      )}
    </div>
  );
});

export default ParamCard;

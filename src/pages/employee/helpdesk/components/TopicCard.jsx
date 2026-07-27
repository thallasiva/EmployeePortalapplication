import { memo } from "react";
import { ChevronRight } from "lucide-react";
import { BRAND, BRAND_LIGHT, BRAND_BORDER } from "../utils/helpdeskUtils";
import { cssClass } from "../../../../utils/classStyles";

/**
 * Single topic row inside the CategoryView.
 * Single responsibility: render one topic card + fire onSelect.
 */
const TopicCard = memo(function TopicCard({ topic, isOdd, onSelect }) {
  const { Icon } = topic;
  const oddBg = isOdd ? "#f9fafb" : "#fff";

  return (
    <div
      onClick={() => onSelect(topic)}
      onMouseEnter={(e) => { e.currentTarget.style.background = BRAND_LIGHT; e.currentTarget.style.borderColor = BRAND_BORDER; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = oddBg; e.currentTarget.style.borderColor = "#e5e7eb"; }}
      className={cssClass({
        display: "flex", alignItems: "center", gap: 16,
        padding: "14px 18px", background: oddBg,
        border: "1px solid #e5e7eb", borderRadius: 8,
        cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
      })}
    >
      <div className={cssClass({
        width: 36, height: 36, border: "1.5px solid #e5e7eb", borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, background: "#fff",
      })}>
        <Icon size={18} color={BRAND} strokeWidth={1.75} />
      </div>
      <div className={cssClass({ flex: 1, minWidth: 0 })}>
        <p className={cssClass({ fontSize: 14, fontWeight: 600, color: BRAND, margin: "0 0 3px" })}>{topic.label}</p>
        <p className={cssClass({ fontSize: 13, color: "#6b7280", margin: 0 })}>{topic.desc}</p>
      </div>
      <ChevronRight size={16} color="#9ca3af" className={cssClass({ flexShrink: 0 })} />
    </div>
  );
});

export default TopicCard;

import { memo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { CATEGORIES } from "../constants/categories";
import { BRAND } from "../utils/helpdeskUtils";
import { cssClass } from "../../../../utils/classStyles";
import TopicCard from "./TopicCard";
import RequestModal from "./modals/RequestModal";

/**
 * Shows the topics inside a selected category + opens RequestModal on topic click.
 * Single responsibility: category drill-down navigation + topic selection.
 */
const CategoryView = memo(function CategoryView({ category, onSelectCategory, onSubmitted }) {
  const [activeTopic, setActiveTopic] = useState(null);

  return (
    <div className={cssClass({
      flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
      overflow: "auto", background: "#fff", padding: "20px 28px",
    })}>
      {/* Breadcrumb */}
      <div className={cssClass({ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: BRAND, marginBottom: 14 })}>
        <span onClick={() => onSelectCategory(null)} className={cssClass({ cursor: "pointer", textDecoration: "underline" })}>
          HR Help Desk
        </span>
        <span className={cssClass({ color: "#9ca3af" })}>/</span>
        <span className={cssClass({ color: "#374151" })}>Support</span>
      </div>

      <h2 className={cssClass({ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 4px" })}>{category.label}</h2>
      <p className={cssClass({ fontSize: 13, color: "#374151", margin: "0 0 20px" })}>
        Welcome! You can raise a request for{" "}
        <span className={cssClass({ color: BRAND })}>HR Support</span> using the options provided.
      </p>

      {/* Category switcher dropdown */}
      <div className={cssClass({ marginBottom: 20 })}>
        <label className={cssClass({ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6 })}>
          Contact us about
        </label>
        <div className={cssClass({ position: "relative" })}>
          <select
            value={category.id}
            onChange={(e) => onSelectCategory(CATEGORIES.find((c) => c.id === e.target.value))}
            className={cssClass({
              width: "100%", height: 38, paddingLeft: 12, paddingRight: 32,
              border: "1px solid #d1d5db", borderRadius: 4, fontSize: 13,
              background: "#fff", outline: "none", cursor: "pointer", appearance: "none", color: "#374151",
            })}
          >
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <ChevronDown size={14} className={cssClass({ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" })} />
        </div>
      </div>

      <p className={cssClass({ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 12px" })}>
        What can we help you with?
      </p>

      <div className={cssClass({ display: "flex", flexDirection: "column", gap: 10 })}>
        {category.topics.map((topic, i) => (
          <TopicCard key={topic.id} topic={topic} isOdd={i % 2 === 1} onSelect={setActiveTopic} />
        ))}
      </div>

      {activeTopic && (
        <RequestModal
          category={category}
          topic={activeTopic}
          onClose={() => setActiveTopic(null)}
          onSubmitted={() => { setActiveTopic(null); onSubmitted(); }}
        />
      )}
    </div>
  );
});

export default CategoryView;

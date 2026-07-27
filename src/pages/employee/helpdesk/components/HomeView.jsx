import { memo, useState } from "react";
import { Search, ChevronRight, Navigation } from "lucide-react";
import { CATEGORIES } from "../constants/categories";
import { BRAND, BRAND_BORDER, BRAND_LIGHT } from "../utils/helpdeskUtils";
import { cssClass } from "../../../../utils/classStyles";

/**
 * The landing screen of the Helpdesk — shows the category list and a search bar.
 * Single responsibility: browse + search categories, fire onSelectCategory.
 */
const HomeView = memo(function HomeView({ onSelectCategory }) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? CATEGORIES.filter((c) =>
        c.label.toLowerCase().includes(search.toLowerCase()) ||
        c.topics.some((t) => t.label.toLowerCase().includes(search.toLowerCase()))
      )
    : CATEGORIES;

  return (
    <div className={cssClass({ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto" })}>
      {/* Hero search */}
      <div className={cssClass({ background: BRAND, padding: "28px 28px 36px", flexShrink: 0 })}>
        <h1 className={cssClass({ fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 14px" })}>
          Welcome to the HR Help Desk
        </h1>
        <div className={cssClass({ position: "relative", maxWidth: 520 })}>
          <Search size={15} className={cssClass({ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" })} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for information"
            className={cssClass({
              width: "100%", height: 42, paddingLeft: 36, paddingRight: 12,
              border: "2px solid #93c5fd", borderRadius: 4, fontSize: 14,
              outline: "none", background: "#fff", boxSizing: "border-box",
            })}
          />
        </div>
      </div>

      {/* Category list */}
      <div className={cssClass({ flex: 1, background: "#fff", padding: "22px 28px" })}>
        <p className={cssClass({ fontSize: 13, color: BRAND, margin: "0 0 20px" })}>
          Welcome! You can raise a request using the options provided.
        </p>
        <div className={cssClass({ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 })}>
          <Navigation size={14} color="#374151" />
          <span className={cssClass({ fontSize: 14, fontWeight: 600, color: "#374151" })}>Contact us about</span>
        </div>
        <div className={cssClass({ display: "flex", flexDirection: "column", gap: 16 })}>
          {filtered.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat)}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = BRAND_BORDER; e.currentTarget.style.boxShadow = "0 2px 8px rgba(241,130,0,0.10)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
              className={cssClass({
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 20px", border: "1px solid #e5e7eb", borderRadius: 8,
                cursor: "pointer", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              })}
            >
              <div className={cssClass({ flex: 1, minWidth: 0, paddingRight: 12 })}>
                <p className={cssClass({ fontSize: 14, fontWeight: 700, color: BRAND, margin: "0 0 5px" })}>{cat.label}</p>
                <p className={cssClass({ fontSize: 13, color: "#6b7280", margin: 0, lineHeight: 1.5 })}>
                  {cat.topics.map((t) => t.label).join(", ")}
                </p>
              </div>
              <ChevronRight size={18} color="#9ca3af" className={cssClass({ flexShrink: 0 })} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default HomeView;

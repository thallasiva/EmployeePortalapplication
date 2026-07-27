import { memo, useState } from "react";
import { cssClass } from "../../../utils/classStyles";
import HelpdeskTabs   from "./components/HelpdeskTabs";
import SuccessToast   from "./components/SuccessToast";
import HomeView       from "./components/HomeView";
import CategoryView   from "./components/CategoryView";
import MyTicketsView  from "./components/MyTicketsView";

/**
 * Helpdesk page — orchestrator only.
 * Manages top-level navigation state (view, selected category, success toast).
 * All rendering is delegated to focused child components.
 */
const Helpdesk = memo(function Helpdesk() {
  const [view,        setView]        = useState("home");   // "home" | "category" | "tickets"
  const [category,    setCategory]    = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSelectCategory = (cat) => {
    if (!cat) { setView("home"); setCategory(null); return; }
    setCategory(cat);
    setView("category");
  };

  const handleTabChange = (tabId) => {
    setShowSuccess(false);
    if (tabId === "tickets") { setView("tickets"); return; }
    setView("home");
    setCategory(null);
  };

  const handleSubmitted = () => {
    setShowSuccess(true);
    setView("home");
    setCategory(null);
  };

  return (
    <div className={cssClass({ height: "calc(100vh - 4.25rem)", background: "#f3f4f6", display: "flex", flexDirection: "column", overflow: "hidden" })}>

      <HelpdeskTabs activeTab={view} onTabChange={handleTabChange} />

      <div className={cssClass({ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, margin: "16px 20px 12px", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", position: "relative" })}>

        {showSuccess && <SuccessToast onDismiss={() => setShowSuccess(false)} />}

        {view === "home"     && <HomeView onSelectCategory={handleSelectCategory} />}
        {view === "category" && category && (
          <CategoryView
            category={category}
            onSelectCategory={handleSelectCategory}
            onSubmitted={handleSubmitted}
          />
        )}
        {view === "tickets"  && (
          <MyTicketsView
            onNewRequest={() => { setView("home"); setCategory(null); setShowSuccess(false); }}
          />
        )}
      </div>
    </div>
  );
});

export default Helpdesk;

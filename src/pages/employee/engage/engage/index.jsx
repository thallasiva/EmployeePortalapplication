import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getUserGreetingName, getLoggedInUser } from "../../../../lib/dateUtils";
import { cssClass } from "../../../../utils/classStyles";
import { initials, fullName, anniversaryThisYear, daysFromToday, buildMockFeed } from "./utils";
import { useEngageData } from "./hooks/useEngageData";
import FilterSidebar from "./components/FilterSidebar";
import FeedPanel from "./components/FeedPanel";

const QUICK_LINKS = [
  { label: "Apply Leave",       path: "/employee/leave/apply",        emoji: "🌴" },
  { label: "Leave Balance",     path: "/employee/leave/balance",      emoji: "📋" },
  { label: "Holiday Calendar",  path: "/employee/leave/calendar",     emoji: "📅" },
  { label: "Helpdesk",          path: "/employee/worklife/helpdesk",  emoji: "🎧" },
];

const Engage = () => {
  const navigate = useNavigate();
  const greetingName = getUserGreetingName();
  const loggedUser = getLoggedInUser();
  const myName = loggedUser?.name || greetingName;

  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { employees, holidays, loading } = useEngageData();

  const allItems = useMemo(() => buildMockFeed(holidays), [holidays]);

  const visibleItems = useMemo(() => {
    let list = activeFilter === "all" ? allItems : allItems.filter((i) => i.section === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        i.title.toLowerCase().includes(q) || (i.description || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [allItems, activeFilter, search]);

  const countFor = useCallback(
    (key) => (key === "all" ? allItems.length : allItems.filter((i) => i.section === key).length),
    [allItems]
  );

  const todayBirthdays = useMemo(
    () => employees.filter((e) => { const bd = anniversaryThisYear(e.dob); return bd && daysFromToday(bd) === 0; }),
    [employees]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={cssClass({
              width: 48, height: 48, borderRadius: "50%", background: "#E6F1FB",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 18, color: "#185FA5",
            })}>
              {initials(myName)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Hey {greetingName},</h1>
              <p className="text-gray-500 text-sm">
                {todayBirthdays.length > 0
                  ? `🎂 ${todayBirthdays.map((e) => fullName(e).split(" ")[0]).join(", ")} ${todayBirthdays.length === 1 ? "is" : "are"} celebrating a birthday today!`
                  : "Here's what's happening across your workspace."}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/employee/worklife/kudos")}
              className="flex flex-col items-center gap-2 px-4 py-3 border-2 border-pink-300 rounded-lg hover:bg-pink-50 transition-colors"
            >
              <span className="text-2xl">💝</span>
              <span className="text-xs font-medium text-gray-700">Give Kudos</span>
            </button>
            <button
              onClick={() => navigate("/employee/leave/apply")}
              className="flex flex-col items-center gap-2 px-4 py-3 border-2 border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <span className="text-2xl">📝</span>
              <span className="text-xs font-medium text-gray-700">Apply Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto p-6 flex gap-6">
        <FilterSidebar
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          search={search}
          setSearch={setSearch}
          countFor={countFor}
          employees={employees}
          holidays={holidays}
          navigate={navigate}
          quickLinks={QUICK_LINKS}
        />
        <FeedPanel
          loading={loading}
          visibleItems={visibleItems}
          activeFilter={activeFilter}
          search={search}
          navigate={navigate}
        />
      </div>
    </div>
  );
};

export default Engage;

import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import { Plus, X } from "lucide-react";

export default function CalendarForm() {
  const calendarRef = useRef(null);
  const sidebarRef = useRef(null);

  const [showModal, setShowModal] = useState(false);

  const [categories, setCategories] = useState([
    { title: "New Theme Release", color: "#2f49c7" },
    { title: "My Event", color: "#22c55e" },
    { title: "Meet Manager", color: "#f59e0b" },
    { title: "Create New theme", color: "#6b7280" },
  ]);

  const [form, setForm] = useState({
    name: "",
    color: "#dc2626",
  });

  const today = new Date();
  const initialCalendarDate = today.toISOString().slice(0, 10);

  const toEventDate = (year, month, day) => {
    const d = new Date(year, month, day);
    return d.toISOString().slice(0, 10);
  };

  const [events, setEvents] = useState(() => {
    const y = today.getFullYear();
    const m = today.getMonth();
    return [
      {
        id: "1",
        title: "1:09p Test Event 1",
        start: toEventDate(y, m, 12),
        color: "#22c55e",
      },
      {
        id: "2",
        title: "6:09a Event Name 4",
        start: toEventDate(y, m, 14),
        color: "#8b5cf6",
      },
      {
        id: "3",
        title: "11:43a Test Event 2",
        start: toEventDate(y, m, 14),
        color: "#0ea5e9",
      },
      {
        id: "4",
        title: "10:56a Test Event 3",
        start: toEventDate(y, m, 16),
        color: "#2f49c7",
      },
    ];
  });

  // Enable drag from sidebar
  useEffect(() => {
    if (sidebarRef.current) {
      new Draggable(sidebarRef.current, {
        itemSelector: ".external-event",
        eventData: function (eventEl) {
          return {
            title: eventEl.getAttribute("data-title"),
            color: eventEl.getAttribute("data-color"),
          };
        },
      });
    }
  }, [categories]);

  // Add dropped event
  const handleReceive = (info) => {
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        title: info.event.title,
        start: info.event.startStr,
        color: info.event.backgroundColor,
      },
    ]);
  };

  const handleAddCategory = () => {
    if (!form.name) return;

    setCategories((prev) => [
      ...prev,
      { title: form.name, color: form.color },
    ]);

    setForm({ name: "", color: "#dc2626" });
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Top Navbar */}
      

      {/* Page */}
      <div className="p-4">
        {/* Breadcrumb */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm  flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">
            Home <span className="mx-2">/</span> Calendar
          </div>

          <h2 className="font-semibold text-[#1c2746]">Calendar</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4">
          {/* Sidebar */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-fit">
            <div className="px-4 py-3 border-b">
              <h3 className="text-[26px] font-semibold text-[#1c2746]">
                Calendar
              </h3>
            </div>

            <div className="p-4">
              <p className="text-[12px] text-gray-600 mb-4">
                Drag and drop your event or click in the calendar
              </p>

              <div ref={sidebarRef} className="space-y-3">
                {categories.map((item, index) => (
                  <div
                    key={index}
                    className="external-event h-11 border border-gray-300 rounded px-3 flex items-center gap-3 cursor-move bg-white"
                    data-title={item.title}
                    data-color={item.color}
                  >
                    <span
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.title}</span>
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                <input type="checkbox" />
                Remove after drop
              </label>

              <button
                onClick={() => setShowModal(true)}
                className="w-full h-11 bg-brand hover:bg-brand-600 text-white rounded mt-4 flex items-center justify-center gap-2 font-semibold"
              >
                <Plus size={16} />
                Create New
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              initialDate={initialCalendarDate}
              editable={true}
              droppable={true}
              eventReceive={handleReceive}
              events={events}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,dayGridWeek,dayGridDay",
              }}
              buttonText={{
                today: "Today",
                month: "Month",
                week: "Week",
                day: "Day",
              }}
              height="auto"
            />
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center pt-16" style={{height:'400px'}}>
          <div className="w-full max-w-xl bg-white rounded-md border border-gray-300 shadow-xl">
            {/* Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="text-[36px] font-semibold text-gray-800">
                Add a category
              </h2>

              <button
                onClick={() => setShowModal(false)}
                className="border border-red-500 text-red-500 rounded-sm p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4">
              <label className="block text-sm mb-2 font-medium">
                Category Name
              </label>

              <input
                type="text"
                placeholder="Enter Name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full h-11 border border-gray-300 rounded px-3 text-sm outline-none"
              />

              <label className="block text-sm mt-4 mb-2 font-medium">
                Choose Category Color
              </label>

              <select
                value={form.color}
                onChange={(e) =>
                  setForm({ ...form, color: e.target.value })
                }
                className="w-full h-11 border border-gray-300 rounded px-3 text-sm outline-none"
              >
                <option value="#dc2626">Danger</option>
                <option value="#22c55e">Success</option>
                <option value="#2f49c7">Primary</option>
                <option value="#f59e0b">Warning</option>
                <option value="#6b7280">Secondary</option>
              </select>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleAddCategory}
                  className="w-32 h-11 bg-brand hover:bg-brand-600 text-white rounded font-semibold"
                >
                  Apply
                </button>

                <button
                  onClick={() => setShowModal(false)}
                  className="w-32 h-11 bg-red-500 hover:bg-red-600 text-white rounded font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
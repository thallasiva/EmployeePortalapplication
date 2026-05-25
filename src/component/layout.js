import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";

export default function Layout() {
  const [open, setOpen] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return <Navigate to="/login" />;
  }

  const isEmployee = user?.role === 2;

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      <Sidebar open={open} />

      <div className="flex flex-col flex-1 min-w-0">
        <Navbar
          toggleSidebar={() => setOpen(!open)}
          user={user}
        />

        <main className="flex-1 px-6 py-6 md:px-8 md:py-8 lg:px-10">
          <div
            className={`app-content-panel min-h-[calc(100vh-8rem)] rounded-2xl border shadow-sm ${
              isEmployee
                ? "bg-brand-50/40 border-brand-100"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="app-content-inner">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

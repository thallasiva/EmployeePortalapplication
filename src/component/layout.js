import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { getStoredUser, isEmployee } from "../data/auth";

export default function Layout() {
  const [open, setOpen] = useState(true);

  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" />;
  }

  const employeeLayout = isEmployee(user);

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      <Sidebar open={open} />

      <div className="flex flex-col flex-1 min-w-0">
        <Navbar
          toggleSidebar={() => setOpen(!open)}
          user={user}
        />

        <main className="flex-1 px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3">
          <div
            className={`app-content-panel min-h-[calc(100vh-4.25rem)] rounded-lg border shadow-sm ${
              employeeLayout
                ? "bg-brand-50/30 border-brand-100/80"
                : "bg-white border-gray-200"
            }`}
          >
            <div className={employeeLayout ? "app-content-inner-tight" : "app-content-inner"}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

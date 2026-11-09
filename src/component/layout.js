import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { getStoredUser } from "../data/auth";
import { useIdleLogout } from "../hooks/useIdleLogout";
export default function Layout() {
  const [open, setOpen] = useState(true);
  useIdleLogout({ timeoutMs: 5 * 60 * 1000, enabled: true });
  const user = getStoredUser();
  if (!user) {
    return <Navigate to="/login" />;
  }
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar open={open} />
      <div className="flex h-screen min-h-0 flex-1 min-w-0 flex-col">
        <Navbar
          toggleSidebar={() => setOpen(!open)}
          user={user} />
        <main className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3">
          <div className="app-content-panel min-h-[calc(100vh-4.25rem)] rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
            <div className="app-content-inner">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>);
}

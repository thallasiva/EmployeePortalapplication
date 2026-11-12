import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { getStoredUser } from "../data/auth";
import { useIdleLogout } from "../hooks/useIdleLogout";
export default function Layout() {
  const [open, setOpen] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1024);
  useIdleLogout({ timeoutMs: 5 * 60 * 1000, enabled: true });
  const user = getStoredUser();
  if (!user) {
    return <Navigate to="/login" />;
  }
  return (
    <div className="app-layout flex h-screen overflow-hidden bg-slate-50 font-sans">
      {open && <button type="button" className="app-sidebar-backdrop" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <Sidebar open={open} onNavigate={() => { if (window.innerWidth < 1024) setOpen(false); }} />
      <div className="flex h-screen min-h-0 flex-1 min-w-0 flex-col">
        <Navbar
          toggleSidebar={() => setOpen((value) => !value)}
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

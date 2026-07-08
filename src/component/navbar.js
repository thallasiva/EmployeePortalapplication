import { Menu, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAdmin, isReportingManager, logoutUser } from "../data/auth";
import { API_BASE_URL } from "../api/client";
import { cssClass } from "../utils/classStyles";

// Strip trailing "/api" to get the server origin for static file URLs
const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const Navbar = ({ toggleSidebar, user }) => {
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  const displayName = user?.name || user?.email || "User";
  const roleLabel = isAdmin(user)
    ? "Administrator"
    : isReportingManager(user)
    ? "Reporting Manager"
    : "Employee";

  const rawPhoto = user?.profilePhoto || null;
  const photoUrl = rawPhoto
    ? rawPhoto.startsWith("http") ? rawPhoto : `${SERVER_ORIGIN}${rawPhoto}`
    : null;

  function doLogout() {
    logoutUser();
    navigate("/login");
  }

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between px-3 sm:px-4 py-2 bg-white border-b border-gray-200 shadow-sm">

        {/* Left — hamburger */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-gray-500 hover:bg-orange-50 hover:text-brand transition-colors"
            aria-label="Toggle sidebar">
            <Menu size={22} />
          </button>
        </div>

        {/* Right — name + avatar + logout */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block mr-1">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{displayName}</p>
            <p className="text-xs text-gray-400 font-medium">{roleLabel}</p>
          </div>

          {/* Profile picture */}
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={displayName}
              onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
              className={cssClass({ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid #fed7aa", flexShrink: 0 })} />
          ) : null}

          {/* Fallback avatar */}
          <div
            aria-hidden
            className={cssClass({ width: 36, height: 36, borderRadius: "50%", background: "#fff7ed", border: "2px solid #fed7aa", display: photoUrl ? "none" : "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 })}>
            <User size={19} strokeWidth={1.8} className={cssClass({ color: "#f18200" })} />
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: "#e5e7eb", margin: "0 4px" }} />

          {/* Logout button */}
          <button
            type="button"
            onClick={() => setShowLogout(true)}
            title="Sign out"
            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <LogOut size={18} strokeWidth={1.8} />
            <span className="hidden sm:inline text-sm font-medium" style={{ color: "inherit" }}>Sign out</span>
          </button>
        </div>
      </header>

      {/* Logout confirm modal */}
      {showLogout && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) setShowLogout(false); }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "32px 28px", width: 340, maxWidth: "90vw", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", textAlign: "center" }}>
            {/* Icon */}
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <LogOut size={26} color="#dc2626" strokeWidth={2} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Sign out?</div>
            <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5, marginBottom: 28 }}>
              You'll be logged out and returned to the login screen.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowLogout(false)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 9, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => e.target.style.background = "#f9fafb"}
                onMouseLeave={e => e.target.style.background = "#fff"}>
                Cancel
              </button>
              <button
                onClick={doLogout}
                style={{ flex: 1, padding: "10px 0", borderRadius: 9, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => e.target.style.background = "#b91c1c"}
                onMouseLeave={e => e.target.style.background = "#dc2626"}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

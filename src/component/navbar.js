import { Menu, User } from "lucide-react";
import { isAdmin, isReportingManager } from "../data/auth";

export const Navbar = ({ toggleSidebar, user }) => {
  const displayName = user?.name || user?.email || "User";
  const roleLabel = isAdmin(user)
    ? "Administrator"
    : isReportingManager(user)
    ? "Reporting Manager"
    : "Employee";

  const photoUrl = user?.profilePhoto || null;

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-3 sm:px-4 py-2 bg-white border-b border-gray-200 shadow-sm">

      {/* Left — hamburger + logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-gray-500 hover:bg-orange-50 hover:text-brand transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>

      </div>

      {/* Right — name + avatar */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-900 leading-tight">{displayName}</p>
          <p className="text-xs text-gray-400 font-medium">{roleLabel}</p>
        </div>

        {/* Profile picture or avatar icon */}
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={displayName}
            onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
            style={{
              width: 38, height: 38, borderRadius: "50%",
              objectFit: "cover", border: "2px solid #fed7aa",
              flexShrink: 0,
            }}
          />
        ) : null}

        {/* Fallback avatar — shown when no photo OR img fails to load */}
        <div
          style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "#fff7ed", border: "2px solid #fed7aa",
            display: photoUrl ? "none" : "flex",
            alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
          aria-hidden
        >
          <User size={20} style={{ color: "#f18200" }} strokeWidth={1.8} />
        </div>
      </div>
    </header>
  );
};

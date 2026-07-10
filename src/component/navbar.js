import { Menu, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAdmin, isReportingManager, logoutUser } from "../data/auth";
import { API_BASE_URL } from "../api/client";
import { cssClass } from "../utils/classStyles";

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
              className="w-9 h-9 rounded-full object-cover border-2 border-orange-200 flex-shrink-0"
            />
          ) : null}

          {/* Fallback avatar */}
          <div
            aria-hidden
            className={`w-9 h-9 rounded-full bg-orange-50 border-2 border-orange-200 ${photoUrl ? "hidden" : "flex"} items-center justify-center flex-shrink-0`}>
            <User size={19} strokeWidth={1.8} className="text-[#f18200]" />
          </div>

          {/* Divider */}
          <div className="w-px h-7 bg-gray-200 mx-1" />

          {/* Logout button */}
          <button
            type="button"
            onClick={() => setShowLogout(true)}
            title="Sign out"
            className="flex items-center gap-1.5 p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
            <LogOut size={18} strokeWidth={1.8} />
            <span className="hidden sm:inline text-sm font-medium">Sign out</span>
          </button>
        </div>
      </header>

      {/* Logout confirm modal */}
      {showLogout && (
        <div
          className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) setShowLogout(false); }}>
          <div className="bg-white rounded-2xl p-8 w-[340px] max-w-[90vw] shadow-2xl text-center">
            {/* Icon */}
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <LogOut size={26} className="text-red-600" strokeWidth={2} />
            </div>
            <div className="text-lg font-bold text-gray-900 mb-2">Sign out?</div>
            <div className="text-sm text-gray-500 leading-relaxed mb-7">
              You'll be logged out and returned to the login screen.
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowLogout(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={doLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold cursor-pointer hover:bg-red-700 transition-colors border-0">
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

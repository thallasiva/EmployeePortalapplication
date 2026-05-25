import { Menu } from "lucide-react";

export const Navbar = ({ toggleSidebar, user }) => {
  const displayName = user?.name || user?.email || "User";
  const roleLabel = user?.role === 1 ? "Administrator" : "Employee";

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-6 md:px-8 py-4 bg-white border-b border-gray-200 shadow-sm">
      <button
        type="button"
        onClick={toggleSidebar}
        className="p-2.5 rounded-lg text-gray-600 hover:bg-brand-50 hover:text-brand transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu size={22} />
      </button>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            {displayName}
          </p>
          <p className="text-xs text-gray-500 font-medium">{roleLabel}</p>
        </div>
        <div
          className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center text-sm font-semibold shadow-sm"
          aria-hidden
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

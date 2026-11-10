import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ArrowLeftRight, Boxes, ChartNoAxesCombined, ClipboardList, LayoutDashboard, Laptop, Layers3, RotateCcw, Wrench } from "lucide-react";

const links = [
  { label: "Dashboard", path: "dashboard", icon: LayoutDashboard },
  { label: "Inventory", path: "inventory", icon: Laptop },
  { label: "Categories", path: "categories", icon: Layers3 },
  { label: "Allocation", path: "allocation", icon: Boxes },
  { label: "Asset Requests", path: "requests", icon: ClipboardList },
  { label: "Returns", path: "returns", icon: RotateCcw },
  { label: "Maintenance", path: "maintenance", icon: Wrench },
  { label: "Transfers", path: "transfers", icon: ArrowLeftRight },
  { label: "Reports", path: "reports", icon: ChartNoAxesCombined },
];

export default function AssetModuleLayout() {
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">Employee Services</p>
          <h1 className="mt-1 text-2xl font-semibold  text-[#e87500]">Asset Management</h1>
          <p className="mt-1 text-sm text-slate-600">Manage company inventory, allocations, maintenance, and requests.</p>
        </div>
        <Boxes className="text-orange-600" size={22} aria-hidden="true" />
      </header>
      <nav aria-label="Asset management sections" className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5">
        {links.map(({ label, path, icon: Icon }) => (
          <NavLink key={path} to={`/dashboard/assets/${path}`} className={({ isActive }) => `inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-orange-50 text-orange-800" : "text-slate-600 hover:bg-slate-50 hover: text-[#e87500]"}`}>
            <Icon size={16} />{label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

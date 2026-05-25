import React from "react";
import { Users, Building2, CalendarDays, Wallet } from "lucide-react";
import {
  STATIC_DASHBOARD_STATS,
  DASHBOARD_TEAM_MEMBERS,
  DASHBOARD_RECENT_ACTIVITY,
  DASHBOARD_UPCOMING_EVENTS,
} from "../../data/staticData";

const stats = STATIC_DASHBOARD_STATS;

const statCards = [
  {
    label: "Employees",
    value: stats.employees_count,
    icon: Users,
    className: "bg-brand text-white",
  },
  {
    label: "Companies",
    value: stats.companies_count,
    icon: Building2,
    className: "bg-orange-500 text-white",
  },
  {
    label: "Leaves",
    value: stats.leaves_count,
    icon: CalendarDays,
    className: "bg-rose-500 text-white",
  },
  {
    label: "Payroll",
    value: stats.salaries_count,
    icon: Wallet,
    className: "bg-violet-600 text-white",
  },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            NAT IT — overview (static data)
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold shadow-sm">
            Admin
          </span>
          <span className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium">
            Employee view
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`${card.className} p-5 rounded-xl shadow-sm flex justify-between items-center`}
            >
              <div>
                <p className="text-sm opacity-90">{card.label}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Icon size={28} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Employee status</h2>
          <div className="flex items-center justify-center gap-8 h-44">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full border-8 border-brand border-r-brand-100 border-b-brand-100" />
              <p className="text-sm text-slate-500 mt-3">Active 22</p>
            </div>
            <ul className="text-sm space-y-2 text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-brand" /> Active
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400" /> On leave
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-300" /> Inactive
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Monthly overview</h2>
          <div className="flex items-end justify-between gap-2 h-44 px-2">
            {[65, 80, 45, 90, 70, 85].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-brand/80 rounded-t-md min-h-[4px]"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[10px] text-slate-400">
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Team members</h2>
          <ul className="space-y-3">
            {DASHBOARD_TEAM_MEMBERS.map((m) => (
              <li
                key={m.name}
                className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0"
              >
                <span className="font-medium text-slate-800">{m.name}</span>
                <span className="text-slate-400">{m.team}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Recent activity</h2>
          <ul className="space-y-3">
            {DASHBOARD_RECENT_ACTIVITY.map((a) => (
              <li key={a.text} className="text-sm">
                <p className="text-slate-800">{a.text}</p>
                <p className="text-xs text-slate-400 mt-0.5">{a.time}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Upcoming events</h2>
          <ul className="space-y-3">
            {DASHBOARD_UPCOMING_EVENTS.map((e) => (
              <li
                key={e.text}
                className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0"
              >
                <span className="text-slate-800">{e.text}</span>
                <span className="text-brand font-medium">{e.date}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

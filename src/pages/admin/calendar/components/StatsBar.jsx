import React from 'react';
import { Cake, CalendarDays, Umbrella, Users } from 'lucide-react';

const StatsBar = React.memo(function StatsBar({
  loading,
  totalEmployees,
  onLeaveTodayCount,
  birthdaysThisMonth,
  holidaysThisMonth,
}) {
  const cards = [
    {
      icon: <Users size={22} className="text-indigo-500" />,
      bg: 'bg-indigo-50',
      label: 'Total Employees',
      value: totalEmployees,
      link: 'View all',
      color: 'text-indigo-600',
    },
    {
      icon: <Umbrella size={22} className="text-green-500" />,
      bg: 'bg-green-50',
      label: 'On Leave Today',
      value: onLeaveTodayCount,
      link: 'View leaves',
      color: 'text-green-600',
    },
    {
      icon: <Cake size={22} className="text-orange-500" />,
      bg: 'bg-orange-50',
      label: 'Birthdays',
      value: birthdaysThisMonth,
      link: 'View birthdays',
      color: 'text-orange-600',
    },
    {
      icon: <CalendarDays size={22} className="text-red-500" />,
      bg: 'bg-red-50',
      label: 'Holidays',
      value: holidaysThisMonth,
      link: 'View holidays',
      color: 'text-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4"
        >
          <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
            {card.icon}
          </div>
          <div>
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="text-2xl font-bold text-slate-800 leading-tight">
              {loading ? '…' : card.value}
            </p>
            <p className={`text-xs ${card.color} cursor-pointer hover:underline mt-0.5`}>
              {card.link}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
});

export default StatsBar;

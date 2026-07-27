import React from "react";
import { BRAND } from "../constants";

export const StatCard = React.memo(function StatCard({
  label, value, sub, icon: Icon,
  iconBg = "#fff7ed", iconColor = BRAND, trend,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-[10px] px-[18px] py-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] text-gray-500 font-medium uppercase tracking-[0.05em] mb-1.5">{label}</div>
          <div className="text-[26px] font-bold text-gray-900 leading-none">{value}</div>
          {sub && (
            <div className={`text-[11px] mt-1 ${
              trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-gray-500"
            }`}>
              {sub}
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-[9px] flex items-center justify-center flex-shrink-0"
            style={{ background: iconBg }}>
            <Icon size={20} color={iconColor} />
          </div>
        )}
      </div>
    </div>
  );
});

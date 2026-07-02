import React from "react";

/**
 * Lightweight dependency-free donut/pie chart built with plain SVG.
 *
 * @param {string} title
 * @param {{label: string, value: number, color: string}[]} data
 * @param {string} [centerLabel]
 */import { cssClass, joinClasses } from "../../utils/classStyles";
const PieChart = ({ title, data, centerLabel }) => {
  const sum = data.reduce((acc, d) => acc + d.value, 0);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="admin-dash-card">
      {title &&
      <h3 className="text-base font-semibold text-gray-800 mb-3">{title}</h3>
      }
      <div className="flex items-center gap-5 flex-wrap sm:flex-nowrap">
        <div className="relative w-32 h-32 shrink-0 mx-auto sm:mx-0">
          <svg viewBox="0 0 100 100" className="w-32 h-32 -rotate-90">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="14" />
            
            {sum > 0 &&
            data.map((d) => {
              if (!d.value) return null;
              const fraction = d.value / sum;
              const dash = fraction * circumference;
              const offset = cumulative * circumference;
              cumulative += fraction;
              return (
                <circle
                  key={d.label}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={d.color}
                  strokeWidth="14"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset} />);


            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-gray-800">{sum}</span>
            {centerLabel &&
            <span className="text-[10px] text-gray-400 text-center px-2">
                {centerLabel}
              </span>
            }
          </div>
        </div>
        <ul className="space-y-2 flex-1 min-w-0 w-full sm:w-auto">
          {data.map((d) =>
          <li
            key={d.label}
            className="flex items-center justify-between text-sm gap-2">
            
              <span className="flex items-center gap-2 text-gray-600 truncate">
                <span
                className={joinClasses("w-2.5 h-2.5 rounded-full shrink-0", cssClass(
                  { background: d.color }))} />
              
                {d.label}
              </span>
              <span className="font-semibold text-gray-800">{d.value}</span>
            </li>
          )}
        </ul>
      </div>
    </div>);

};

export default PieChart;

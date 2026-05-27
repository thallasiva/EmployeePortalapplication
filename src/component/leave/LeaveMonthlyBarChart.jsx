import React, { useState } from "react";
import "./leaveGroupedBarChart.css";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const Y_MAX = 5;
const CHART_HEIGHT = 130;

function barHeight(value) {
  if (!value || value <= 0) return 0;
  return Math.round((value / Y_MAX) * CHART_HEIGHT);
}

export default function LeaveMonthlyBarChart({ chart, year }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const yearShort = String(year ?? new Date().getFullYear()).slice(-2);
  const balance = chart?.balance ?? Array(12).fill(0);
  const consumed = chart?.consumed ?? Array(12).fill(0);
  const tooltips = chart?.tooltips ?? {};

  return (
    <div className="leave-grouped-chart leave-grouped-chart--light">
      <div className="leave-grouped-chart__body">
        <div className="leave-grouped-chart__y-label">Number of days</div>

        <div className="leave-grouped-chart__plot-wrap">
          <div className="leave-grouped-chart__plot">
            <div className="leave-grouped-chart__y-ticks" aria-hidden>
              <span>5</span>
              <span>0</span>
            </div>

            <div className="leave-grouped-chart__bars-area">
              {MONTHS.map((month, index) => {
                const tip = tooltips[index];
                const showTip =
                  hoveredIndex === index &&
                  (balance[index] > 0 || consumed[index] > 0);

                return (
                  <div
                    key={month}
                    className="leave-grouped-chart__month-group"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {showTip && (
                      <div className="leave-grouped-chart__tooltip">
                        <div className="leave-grouped-chart__tooltip-title">
                          {month} {year}
                        </div>
                        <div className="leave-grouped-chart__tooltip-row">
                          <span
                            className="leave-grouped-chart__legend-swatch leave-grouped-chart__legend-swatch--balance"
                          />
                          Balance: {balance[index]}
                        </div>
                        {tip && (
                          <div className="leave-grouped-chart__tooltip-sub">
                            Opening Balance: {tip.openingBalance} | Granted:{" "}
                            {tip.granted}
                          </div>
                        )}
                      </div>
                    )}
                    <div
                      className="leave-grouped-chart__bar leave-grouped-chart__bar--balance"
                      style={{ height: barHeight(balance[index]) }}
                    />
                    <div
                      className="leave-grouped-chart__bar leave-grouped-chart__bar--consumed"
                      style={{ height: barHeight(consumed[index]) }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="leave-grouped-chart__x-axis" />

          <div className="leave-grouped-chart__x-labels">
            {MONTHS.map((month) => (
              <span key={month}>
                {month} {yearShort}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="leave-grouped-chart__legend">
        <span className="leave-grouped-chart__legend-item">
          <span className="leave-grouped-chart__legend-swatch leave-grouped-chart__legend-swatch--balance" />
          Balance
        </span>
        <span className="leave-grouped-chart__legend-item">
          <span className="leave-grouped-chart__legend-swatch leave-grouped-chart__legend-swatch--consumed" />
          Consumed
        </span>
      </div>
    </div>
  );
}

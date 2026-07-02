import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import { YearPicker } from "../../../component/YearPicker";
import LeaveBalanceDetail from "./LeaveBalanceDetail";
import { getMyLeaveBalances } from "../../../api/leaveRequest.api";
import {

  CalendarHeart,
  Briefcase,
  Clock3,
  Moon,
  Gift,
  Flag } from
"lucide-react";
/* ── Per-type colour + icon config ─────────────────────────────────────────
   Falls back to the last entry ("default") for unknown leave types.        */import { cssClass, joinClasses } from "../../../utils/classStyles";
const TYPE_CONFIG = [
{
  match: ["earned", "el", "annual"],
  icon: CalendarHeart,
  bg: "#E6F1FB",
  iconColor: "#185FA5",
  barColor: "#378ADD",
  badgeBg: "#E6F1FB",
  badgeColor: "#185FA5",
  detailColor: "#185FA5"
},
{
  match: ["sick", "sl", "medical"],
  icon: Moon,
  bg: "#FAEEDA",
  iconColor: "#854F0B",
  barColor: "#EF9F27",
  badgeBg: "#FAEEDA",
  badgeColor: "#854F0B",
  detailColor: "#854F0B"
},
{
  match: ["compensatory", "comp", "co"],
  icon: Clock3,
  bg: "#EEEDFE",
  iconColor: "#534AB7",
  barColor: "#7F77DD",
  badgeBg: "#EEEDFE",
  badgeColor: "#534AB7",
  detailColor: "#534AB7"
},
{
  match: ["work from home", "wfh", "remote"],
  icon: Briefcase,
  bg: "#E1F5EE",
  iconColor: "#0F6E56",
  barColor: "#1D9E75",
  badgeBg: "#E1F5EE",
  badgeColor: "#0F6E56",
  detailColor: "#0F6E56"
},
{
  match: ["without pay", "lwp", "unpaid"],
  icon: Gift,
  bg: "#FCEBEB",
  iconColor: "#A32D2D",
  barColor: "#E24B4A",
  badgeBg: "#FCEBEB",
  badgeColor: "#A32D2D",
  detailColor: "#A32D2D"
},
{
  match: ["restricted", "rh", "optional"],
  icon: Flag,
  bg: "#FBEAF0",
  iconColor: "#993556",
  barColor: "#D4537E",
  badgeBg: "#FBEAF0",
  badgeColor: "#993556",
  detailColor: "#993556"
},

{
  match: [],
  icon: CalendarHeart,
  bg: "#F0F4FF",
  iconColor: "#3B5FC0",
  barColor: "#5579DB",
  badgeBg: "#F0F4FF",
  badgeColor: "#3B5FC0",
  detailColor: "#3B5FC0"
}];



function getConfig(title = "")
{
  const t = title.toLowerCase();
  return (
    TYPE_CONFIG.find((c) => c.match.some((k) => t.includes(k))) ||
    TYPE_CONFIG[TYPE_CONFIG.length - 1]);

}

/* ── Card ───────────────────────────────────────────────────────────────── */
function LeaveCard({ item, onViewDetails })
{
  const cfg = getConfig(item.title);
  const Icon = cfg.icon;

  const progress = item.total > 0 ? Math.min(item.consumed / item.total * 100, 100) : 0;

  return (
    <div className={cssClass(
      {
        background: "#fff",
        border: "1px solid #e5eaf0",
        borderRadius: 14,
        padding: "18px 18px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        boxShadow: "0 1px 4px 0 rgba(0,0,0,0.05)"
      })}>
      
      {/* Icon + Granted badge */}
      <div className={cssClass({ display: "flex", alignItems: "flex-start", justifyContent: "space-between" })}>
        <div className={cssClass(
          {
            width: 40,
            height: 40,
            borderRadius: 10,
            background: cfg.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          })}>
          
          <Icon
            size={20}
            color={cfg.iconColor}
            strokeWidth={2} />
                  </div>
        <span className={cssClass(
          {
            fontSize: 11,
            fontWeight: 600,
            background: cfg.badgeBg,
            color: cfg.badgeColor,
            padding: "3px 9px",
            borderRadius: 20
          })}>
          
          Granted : {item.granted}
        </span>
      </div>

      {/* Title + Balance */}
      <div>
        <p className={cssClass({ fontSize: 12, color: "#6b7a8d", margin: "0 0 3px", fontWeight: 500 })}>
          {item.title}
        </p>
        <p className={cssClass({ fontSize: 34, fontWeight: 600, color: "#1a2233", margin: 0, lineHeight: 1 })}>
          {String(item.balance).padStart(2, "0")}
        </p>
        <p className={cssClass({ fontSize: 11, color: "#9ca8b5", margin: "4px 0 0" })}>days balance</p>
      </div>

      {/* Progress + footer */}
      <div>
        <div className={cssClass(
          {
            height: 5,
            borderRadius: 5,
            background: "#f0f3f8",
            overflow: "hidden"
          })}>
          
          <div className={cssClass(
            {
              height: "100%",
              width: `${progress}%`,
              background: cfg.barColor,
              borderRadius: 5,
              transition: "width 0.4s ease"
            })} />
          
        </div>
        <div className={cssClass(
          {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 6
          })}>
          
          <span className={cssClass({ fontSize: 11, color: "#9ca8b5" })}>
            {item.consumed} of {item.total || item.granted} consumed
          </span>
          {item.granted > 0 &&
          <button
            type="button"
            onClick={() => onViewDetails(item.title)} className={cssClass(
              {
                fontSize: 11,
                fontWeight: 600,
                color: cfg.detailColor,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0
              })}>
            
              View details
            </button>
          }
        </div>
      </div>
    </div>);

}

/* ── Skeleton loader ─────────────────────────────────────────────────────── */
function SkeletonCard()
{
  return (
    <div className={cssClass(
      {
        background: "#fff",
        border: "1px solid #e5eaf0",
        borderRadius: 14,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14
      })}>
      
      <div className={cssClass({ display: "flex", justifyContent: "space-between" })}>
        <div className={cssClass({ width: 40, height: 40, borderRadius: 10, background: "#f0f3f8" })} />
        <div className={cssClass({ width: 80, height: 22, borderRadius: 20, background: "#f0f3f8" })} />
      </div>
      <div>
        <div className={cssClass({ width: "55%", height: 12, borderRadius: 6, background: "#f0f3f8", marginBottom: 6 })} />
        <div className={cssClass({ width: "40%", height: 32, borderRadius: 6, background: "#e8ecf2" })} />
        <div className={cssClass({ width: "35%", height: 10, borderRadius: 6, background: "#f0f3f8", marginTop: 6 })} />
      </div>
      <div>
        <div className={cssClass({ width: "100%", height: 5, borderRadius: 5, background: "#f0f3f8" })} />
        <div className={cssClass({ width: "60%", height: 10, borderRadius: 6, background: "#f0f3f8", marginTop: 6 })} />
      </div>
    </div>);

}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function LeaveBalances()
{
  const navigate = useNavigate();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() =>
  {
    setLoading(true);
    getMyLeaveBalances({ year }).
    then((rows) =>
    {
      const mapped = (rows || []).map((r) =>
      {
        const granted = Number(r.granted ?? r.annual_quota ?? 0);
        const balance = Number(r.balance ?? r.annual_quota ?? 0);
        const opening = Number(r.opening_balance ?? 0);
        const consumed = Number(r.availed ?? 0);
        const total = granted + opening || Number(r.annual_quota ?? 0) || balance;
        return {
          leaveTypeId: r.leave_type_id,
          title: r.leave_type_name,
          granted,
          balance,
          consumed,
          total
        };
      });
      setLeaveData(mapped);
    }).
    catch(() => setLeaveData([])).
    finally(() => setLoading(false));
  }, [year]);

  if (selectedLeave)
  {
    return (
      <div className="min-h-screen bg-[#ececec] p-6">
        <LeaveBalanceDetail
          leaveType={selectedLeave}
          year={year}
          onYearChange={setYear}
          onBack={() => setSelectedLeave(null)} />
        
      </div>);

  }

  return (
    <div className={cssClass({ minHeight: "100vh", background: "#f5f7fb", padding: 24 })}>

      {/* Header */}
      <div className={cssClass({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 })}>
        <div>
          <p className={cssClass({ fontSize: 12, color: "#9ca8b5", margin: "0 0 2px" })}>Financial Year {year}</p>
          <h1 className={cssClass({ fontSize: 22, fontWeight: 600, color: "#1a2233", margin: 0 })}>Leave Balances</h1>
        </div>

        <div className={cssClass({ display: "flex", alignItems: "center", gap: 10 })}>
          <button
            onClick={() => navigate("/employee/leave/apply")} className={cssClass(
              {
                height: 38,
                padding: "0 18px",
                borderRadius: 8,
                border: "1.5px solid #2ea7ff",
                color: "#2ea7ff",
                background: "#fff",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer"
              })}>
            
            + Apply Leave
          </button>

          <button className={cssClass(
            {
              height: 38,
              width: 38,
              borderRadius: 8,
              border: "1.5px solid #e5eaf0",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#6b7a8d"
            })}>
            
            <Download size={15} />
          </button>

          <YearPicker
            value={year}
            onChange={setYear}
            selectClassName="h-[38px] w-[100px] border border-[#dbe2ea] rounded-lg bg-white px-3 text-[13px] outline-none focus:ring-2 focus:ring-[#2ea7ff]/30" />
          
        </div>
      </div>

      {/* Cards grid */}
      {loading ?
      <div className={cssClass(
        {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))",
          gap: 14
        })}>
        
          {[1, 2, 3, 4, 5, 6].map((n) => <SkeletonCard key={n} />)}
        </div> :
      leaveData.length === 0 ?
      <div className={cssClass(
        {
          background: "#fff",
          border: "1px solid #e5eaf0",
          borderRadius: 14,
          height: 180,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8
        })}>
        
          <i className={joinClasses("ti ti-calendar-off", cssClass({ fontSize: 32, color: "#d1d8e0" }))} />
          <p className={cssClass({ fontSize: 14, color: "#9ca8b5", margin: 0 })}>No leave balances found for {year}.</p>
        </div> :

      <div className={cssClass(
        {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))",
          gap: 14
        })}>
        
          {leaveData.map((item) =>
        <LeaveCard
          key={item.leaveTypeId}
          item={item}
          onViewDetails={setSelectedLeave} />

        )}
        </div>
      }
    </div>);

}

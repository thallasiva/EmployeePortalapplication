import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Coffee, LogIn, LogOut, CheckCircle2 } from "lucide-react";
import { checkIn, checkOut, breakStart, breakEnd } from "../../../../../../api/attendance.api";
/* ─── helpers ─── */
import { fmt, MONTH_NAMES, friendlyError } from "./shared";
import { Toast } from "./Toast";
function MonthNav({
  month,
  year,
  today,
  onPrevMonth,
  onNextMonth,
  onTodayRefresh
}) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { msg, type }
  const checkInTime = today ? fmt(today.check_in) : null;
  const checkOutTime = today ? fmt(today.check_out) : null;
  const isOnBreak = today?.is_on_break === 1 || today?.is_on_break === true;
  const hasCheckedIn = !!checkInTime;
  const hasCheckedOut = !!checkOutTime;
  const breakMins = today?.break_minutes || 0;
  function showToast(msg, type = "success") {
    setToast({
      msg,
      type
    });
  }
  async function punch(apiFn, action, successMsg) {
    setToast(null);
    setLoading(true);
    try {
      await apiFn({});
      if (onTodayRefresh) await onTodayRefresh();
      showToast(successMsg, "success");
    } catch (e) {
      const raw = e?.response?.data?.message || e?.message || "";
      showToast(friendlyError(raw, action), "error");
    } finally {
      setLoading(false);
    }
  }
  const now = new Date();
  const timeNow = fmt(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
  return <div style={{
    background: "#fff",
    borderBottom: "2px solid #e87500",
    position: "sticky",
    top: 0,
    zIndex: 30,
    boxShadow: "0 1px 4px rgba(0,0,0,.06)"
  }}>
      <div style={{
      maxWidth: 1100,
      margin: "0 auto",
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap"
    }}>
        {/* ── Brand + month nav ── */}
        <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10
      }}>
          <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "#e87500",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}>
            <span style={{
            color: "#fff",
            fontSize: 12,
            fontWeight: 900
          }}>AT</span>
          </div>
          <div>
            <p style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            lineHeight: 1,
            margin: 0
          }}>My Attendance</p>
            <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 3
          }}>
              <button onClick={onPrevMonth} style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
              padding: 0,
              display: "flex"
            }}>
                <ChevronLeft size={15} />
              </button>
              <span style={{
              fontSize: 15,
              fontWeight: 800,
              color: "#1e293b"
            }}>
                {MONTH_NAMES[month - 1]} {year}
              </span>
              <button onClick={onNextMonth} style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
              padding: 0,
              display: "flex"
            }}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
        {/* ── Right side: status pill + action buttons ── */}
        <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap"
      }}>
          {/* IN / BREAK / OUT time pill */}
          {hasCheckedIn && <div style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          border: "1.5px solid #e2e8f0",
          borderRadius: 10,
          overflow: "hidden",
          fontSize: 13
        }}>
              <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            background: "#f0fdf4"
          }}>
                <span style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#16a34a"
            }} />
                <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.06em"
            }}>IN</span>
                <span style={{
              fontWeight: 800,
              color: "#16a34a"
            }}>{checkInTime}</span>
              </div>
              {breakMins > 0 && <>
                  <div style={{
              width: 1,
              background: "#e2e8f0",
              alignSelf: "stretch"
            }} />
                  <div style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 10px",
              background: "#fffbeb"
            }}>
                    <Coffee size={12} color="#d97706" />
                    <span style={{
                fontWeight: 700,
                color: "#d97706",
                fontSize: 12
              }}>{breakMins}m break</span>
                  </div>
                </>}
              {isOnBreak && !hasCheckedOut && <>
                  <div style={{
              width: 1,
              background: "#e2e8f0",
              alignSelf: "stretch"
            }} />
                  <div style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 10px",
              background: "#fffbeb"
            }}>
                    <span style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#d97706",
                animation: "pulse 1.2s infinite"
              }} />
                    <span style={{
                fontWeight: 700,
                color: "#d97706",
                fontSize: 12
              }}>On Break</span>
                  </div>
                </>}
              {hasCheckedOut && <>
                  <div style={{
              width: 1,
              background: "#e2e8f0",
              alignSelf: "stretch"
            }} />
                  <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: "#fff7ed"
            }}>
                    <span style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#e87500"
              }} />
                    <span style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.06em"
              }}>OUT</span>
                    <span style={{
                fontWeight: 800,
                color: "#e87500"
              }}>{checkOutTime}</span>
                  </div>
                </>}
            </div>}
          {/* Action buttons */}
          {!hasCheckedIn && !hasCheckedOut && <button onClick={() => punch(checkIn, "check in", `Checked in successfully at ${timeNow}`)} disabled={loading} style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          borderRadius: 10,
          border: "none",
          background: "#16a34a",
          color: "#fff",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          opacity: loading ? 0.6 : 1,
          boxShadow: "0 2px 8px #16a34a44"
        }}>
              <LogIn size={15} /> {loading ? "Checking in…" : "Check In"}
            </button>}
          {hasCheckedIn && !hasCheckedOut && !isOnBreak && <>
              <button onClick={() => punch(breakStart, "start break", "Break started — enjoy your rest!")} disabled={loading} style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 10,
            border: "1.5px solid #d97706",
            background: "#fffbeb",
            color: "#d97706",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            opacity: loading ? 0.6 : 1
          }}>
                <Coffee size={14} /> {loading ? "Please wait…" : "Start Break"}
              </button>
              <button onClick={() => punch(checkOut, "check out", `Checked out at ${timeNow} — great work today!`)} disabled={loading} style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 10,
            border: "none",
            background: "#e87500",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            opacity: loading ? 0.6 : 1,
            boxShadow: "0 2px 8px #e8750044"
          }}>
                <LogOut size={14} /> {loading ? "Please wait…" : "Check Out"}
              </button>
            </>}
          {hasCheckedIn && !hasCheckedOut && isOnBreak && <button onClick={() => punch(breakEnd, "end break", "Break ended — welcome back!")} disabled={loading} style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          borderRadius: 10,
          border: "none",
          background: "#d97706",
          color: "#fff",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          opacity: loading ? 0.6 : 1,
          boxShadow: "0 2px 8px #d9770644"
        }}>
              <Coffee size={14} /> {loading ? "Please wait…" : "End Break"}
            </button>}
          {hasCheckedIn && hasCheckedOut && <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 14px",
          borderRadius: 10,
          background: "#f8fafc",
          border: "1.5px solid #e2e8f0",
          color: "#64748b",
          fontSize: 13,
          fontWeight: 600
        }}>
              <CheckCircle2 size={14} color="#16a34a" />
              Day complete
            </div>}
        </div>
      </div>
      {/* Toast notification */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>;
}
export { MonthNav };

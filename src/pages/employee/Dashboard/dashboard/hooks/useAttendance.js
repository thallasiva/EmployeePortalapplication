import { useState, useEffect, useCallback, useMemo } from "react";
import {
  checkIn as apiCheckIn,
  checkOut as apiCheckOut,
  getMyTodayAttendance,
} from "../../../../../api/attendance.api";
import { errorToast, successToast } from "../../../../../utils/ToastControllers";

export function useAttendance({ todayAtt, setTodayAtt }) {
  const checkIn = todayAtt?.check_in || todayAtt?.check_in_time || todayAtt?.checkIn || null;
  const checkOut = todayAtt?.check_out || todayAtt?.check_out_time || todayAtt?.checkOut || null;

  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!checkIn || checkOut) { setElapsed(""); return; }
    function tick() {
      try {
        const toSecs = (t) => {
          if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
            const [h, m, s = 0] = t.split(":").map(Number);
            return h * 3600 + m * 60 + s;
          }
          return new Date(t).getTime() / 1000;
        };
        const n = new Date();
        const nowSecs = n.getHours() * 3600 + n.getMinutes() * 60 + n.getSeconds();
        const diff = Math.max(0, nowSecs - toSecs(checkIn));
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        setElapsed(
          `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        );
      } catch { setElapsed(""); }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [checkIn, checkOut]);

  const workHours = useMemo(() => {
    if (!checkIn || !checkOut) return null;
    try {
      const toSecs = (t) => {
        if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
          const [h, m, s = 0] = t.split(":").map(Number);
          return h * 3600 + m * 60 + s;
        }
        return new Date(t).getTime() / 1000;
      };
      const diff = toSecs(checkOut) - toSecs(checkIn);
      if (diff <= 0) return null;
      return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
    } catch { return null; }
  }, [checkIn, checkOut]);

  const refreshAttendance = useCallback(
    () => getMyTodayAttendance().then(setTodayAtt).catch(() => {}),
    [setTodayAtt]
  );

  const handleCheckIn = useCallback(async () => {
    setCheckingIn(true);
    try {
      await apiCheckIn({});
      await refreshAttendance();
      successToast("Checked in successfully!");
    } catch (err) {
      errorToast(err?.response?.data?.message || "Check-in failed.");
    } finally {
      setCheckingIn(false);
    }
  }, [refreshAttendance]);

  const handleCheckOut = useCallback(async () => {
    setCheckingOut(true);
    try {
      await apiCheckOut({});
      await refreshAttendance();
      successToast("Checked out successfully!");
    } catch (err) {
      errorToast(err?.response?.data?.message || "Check-out failed.");
    } finally {
      setCheckingOut(false);
    }
  }, [refreshAttendance]);

  return { checkIn, checkOut, elapsed, workHours, checkingIn, checkingOut, handleCheckIn, handleCheckOut };
}

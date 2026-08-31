import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  const [checkinLocation, setCheckinLocation] = useState("");
  const [checkoutLocation, setCheckoutLocation] = useState("");
  const [onBreak, setOnBreak] = useState(false);

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

  // Reverse geocode lat/lng → readable address via OpenStreetMap Nominatim (free, no key)
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      if (!res.ok) return `${lat}, ${lng}`;
      const data = await res.json();
      const a = data.address || {};
      // Build short readable name: suburb/neighbourhood, city
      const parts = [
        a.suburb || a.neighbourhood || a.quarter || a.road || a.hamlet,
        a.city || a.town || a.village || a.county,
      ].filter(Boolean);
      return parts.length ? parts.join(", ") : (data.display_name || `${lat}, ${lng}`);
    } catch {
      return `${lat}, ${lng}`;
    }
  }, []);

  // Get GPS coordinates + human-readable location name
  const getLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve({});
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          const location = await reverseGeocode(lat, lng);
          resolve({ lat, lng, location });
        },
        () => resolve({}),
        { timeout: 5000, maximumAge: 30000 }
      );
    });
  }, [reverseGeocode]);

  const handleCheckIn = useCallback(async () => {
    setCheckingIn(true);
    try {
      const gps = await getLocation();
      await apiCheckIn(gps);
      if (gps.location) setCheckinLocation(gps.location);
      setOnBreak(false);
      await refreshAttendance();
      const isResuming = !!checkOut;
      successToast((isResuming ? "Break ended — resumed!" : "Checked in successfully!") + (gps.location ? ` 📍 ${gps.location}` : ""));
    } catch (err) {
      errorToast(err?.response?.data?.message || "Check-in failed.");
    } finally {
      setCheckingIn(false);
    }
  }, [refreshAttendance, getLocation, checkOut]);

  const handleCheckOut = useCallback(async () => {
    setCheckingOut(true);
    try {
      const gps = await getLocation();
      await apiCheckOut(gps);
      if (gps.location) setCheckoutLocation(gps.location);
      setOnBreak(true);
      await refreshAttendance();
      successToast("Checked out — on break!" + (gps.location ? ` 📍 ${gps.location}` : ""));
    } catch (err) {
      errorToast(err?.response?.data?.message || "Check-out failed.");
    } finally {
      setCheckingOut(false);
    }
  }, [refreshAttendance, getLocation]);

  return { checkIn, checkOut, elapsed, workHours, checkingIn, checkingOut, handleCheckIn, handleCheckOut, checkinLocation, checkoutLocation, onBreak };
}

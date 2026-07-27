import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logout as logoutApi } from "../api/auth.api";
import { clearAuthSession } from "../api/client";



















export function useIdleLogout({ timeoutMs = 5 * 60 * 1000, enabled = true } = {}) {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const enabledRef = useRef(enabled);


  useEffect(() => {enabledRef.current = enabled;}, [enabled]);

  const doLogout = useCallback(async () => {
    try {await logoutApi();} catch {}
    clearAuthSession();
    navigate("/login?reason=idle", { replace: true });
  }, [navigate]);

  const resetTimer = useCallback(() => {
    if (!enabledRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doLogout, timeoutMs);
  }, [doLogout, timeoutMs]);

  useEffect(() => {
    if (!enabled) return;

    const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    EVENTS.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timerRef.current);
      EVENTS.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [enabled, resetTimer]);
}

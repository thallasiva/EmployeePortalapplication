import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logout as logoutApi } from "../api/auth.api";
import { clearAuthSession } from "../api/client";

/**
 * useIdleLogout
 * =============
 * Automatically logs the user out after a configurable period of inactivity.
 *
 * Monitored events: mousemove, mousedown, keydown, scroll, touchstart.
 * When any event fires the idle timer resets.
 *
 * On timeout:
 *  1. Calls POST /auth/logout so the server clears httpOnly cookies.
 *  2. Clears local auth state.
 *  3. Redirects to /login with a ?reason=idle query param so the login
 *     page can display "You were signed out due to inactivity."
 *
 * @param {object} options
 * @param {number} [options.timeoutMs=300_000]  Inactivity window in ms (default 5 min)
 * @param {boolean} [options.enabled=true]      Set to false to disable (e.g. on login page)
 */
export function useIdleLogout({ timeoutMs = 5 * 60 * 1000, enabled = true } = {}) {
  const navigate  = useNavigate();
  const timerRef  = useRef(null);
  const enabledRef = useRef(enabled);

  // Keep ref in sync so the event handler closure always reads the latest value
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  const doLogout = useCallback(async () => {
    try { await logoutApi(); } catch { /* best-effort — server may be unreachable */ }
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
    resetTimer(); // start the initial timer

    return () => {
      clearTimeout(timerRef.current);
      EVENTS.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [enabled, resetTimer]);
}

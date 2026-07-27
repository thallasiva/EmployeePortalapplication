import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearAuthSession } from "../api/client";
import { getHomePath, normalizeRole, resolveRoleForUser, ROLE_ADMIN, ROLE_EMPLOYEE, ROLE_REPORTING_MANAGER, ROLE_RECRUITER, ROLE_RECRUITER_LEAD } from "../data/auth";

/* ─── helpers ────────────────────────────────────────────────────────────── */
function readStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ─── context ────────────────────────────────────────────────────────────── */
const AuthContext = createContext(null);

/* ─── provider ───────────────────────────────────────────────────────────── */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  /* sync across tabs */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "user") {
        setUser(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const login = useCallback((userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setUser(null);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(() => {
    const role = resolveRoleForUser(user);
    return {
      user,
      role,
      isAuthenticated: !!user,
      homePath: getHomePath(user),
      isAdmin: role === ROLE_ADMIN,
      isEmployee: role === ROLE_EMPLOYEE,
      isManager: role === ROLE_REPORTING_MANAGER,
      isRecruiter: role === ROLE_RECRUITER || role === ROLE_RECRUITER_LEAD,
      isRecruiterLead: role === ROLE_RECRUITER_LEAD,
      login,
      logout,
      updateUser,
    };
  }, [user, login, logout, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ─── hook ───────────────────────────────────────────────────────────────── */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export default AuthContext;

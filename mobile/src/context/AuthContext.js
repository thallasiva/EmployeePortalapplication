import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api';
import { Storage } from '../utils/storage';
import { setClientToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          Storage.getToken().catch(() => null),
          Storage.getUser().catch(() => null),
        ]);
        if (storedToken && storedUser) {
          setClientToken(storedToken);   // ← arm the API client immediately
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);

    const accessToken = data?.token || data?.accessToken;
    const refreshToken = data?.refreshToken;
    const userData = data?.user || data;

    if (!accessToken) {
      throw Object.assign(new Error('Authentication failed: no token received'), { code: 'NO_TOKEN' });
    }

    // Arm the API client FIRST so subsequent requests work immediately
    setClientToken(accessToken);

    // Persist to SecureStore (best-effort — failure is non-fatal)
    try {
      await Storage.setToken(accessToken);
      if (refreshToken) await Storage.setRefreshToken(refreshToken);
      if (userData) await Storage.setUser(userData);
    } catch (storageErr) {
      console.warn('[Auth] SecureStore failed, using in-memory only:', storageErr?.message);
    }

    setToken(accessToken);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch (_) {}
    setClientToken(null);              // ← clear the API client token
    await Storage.clear().catch(() => {});
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.me();
      const updated = data.employee || data;
      await Storage.setUser(updated).catch(() => {});
      setUser(updated);
    } catch (_) {}
  }, []);

  const isAdmin = user?.role === 1 || user?.role === '1';
  const isHRManager = user?.role === 2 || user?.role === '2';
  const isTL = user?.role === 3 || user?.role === 4;
  const isRecruiter = user?.role === 5 || user?.role === '5';
  const isEmployee = !isAdmin && !isHRManager && !isTL && !isRecruiter;
  const canManage = isAdmin || isHRManager;

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, logout, refreshUser,
      isAdmin, isHRManager, isTL, isRecruiter, isEmployee, canManage,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

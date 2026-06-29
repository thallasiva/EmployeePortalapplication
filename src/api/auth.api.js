import apiClient, { unwrap } from "./client";

/** POST /auth/login -> { accessToken, refreshToken, user } OR { mfaRequired, mfaTempToken } */
export const login = (email, password) =>
  apiClient.post("/auth/login", { email, password }).then(unwrap);

/** POST /auth/register */
export const register = (payload) =>
  apiClient.post("/auth/register", payload).then(unwrap);

/** POST /auth/refresh — cookies handled automatically */
export const refresh = () =>
  apiClient.post("/auth/refresh", {}).then(unwrap);

/** GET /auth/me — cached for 60 s so repeated calls across components share one fetch */
let _meCache = null;
let _meCacheAt = 0;
const ME_TTL = 60_000;

export const getCurrentUser = () => {
  const now = Date.now();
  if (_meCache && now - _meCacheAt < ME_TTL) return Promise.resolve(_meCache);
  return apiClient.get("/auth/me").then(unwrap).then((data) => {
    _meCache = data;
    _meCacheAt = Date.now();
    return data;
  });
};

/** Bust the /me cache after logout or profile updates */
export const bustMeCache = () => { _meCache = null; _meCacheAt = 0; };

/** POST /auth/change-password */
export const changePassword = (currentPassword, newPassword) =>
  apiClient.post("/auth/change-password", { currentPassword, newPassword }).then(unwrap);

/** POST /auth/forgot-password */
export const forgotPassword = (email) =>
  apiClient.post("/auth/forgot-password", { email }).then(unwrap);

/** POST /auth/reset-password */
export const resetPassword = (token, newPassword) =>
  apiClient.post("/auth/reset-password", { token, newPassword }).then(unwrap);

/** POST /auth/logout — server clears httpOnly cookies */
export const logout = () =>
  apiClient.post("/auth/logout", {}).then(unwrap).finally(bustMeCache);

/* ── MFA ─────────────────────────────────────────────────────────────── */

/** POST /auth/mfa/verify — verify TOTP code after login */
export const verifyMfa = (mfaTempToken, code) =>
  apiClient.post("/auth/mfa/verify", { mfaTempToken, code }).then(unwrap);

/** GET /auth/mfa/status */
export const getMfaStatus = () =>
  apiClient.get("/auth/mfa/status").then(unwrap);

/** POST /auth/mfa/setup — generate TOTP secret + QR code */
export const setupMfa = () =>
  apiClient.post("/auth/mfa/setup", {}).then(unwrap);

/** POST /auth/mfa/enable — confirm TOTP code to activate MFA */
export const enableMfa = (code) =>
  apiClient.post("/auth/mfa/enable", { code }).then(unwrap);

/** POST /auth/mfa/disable — turn off MFA */
export const disableMfa = (code) =>
  apiClient.post("/auth/mfa/disable", { code }).then(unwrap);

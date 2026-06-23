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

/** GET /auth/me */
export const getCurrentUser = () => apiClient.get("/auth/me").then(unwrap);

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
export const logout = () => apiClient.post("/auth/logout").then(unwrap);

// ── MFA ───────────────────────────────────────────────────────────────────────

/** GET /auth/mfa/status -> { mfaEnabled: boolean } */
export const getMfaStatus = () => apiClient.get("/auth/mfa/status").then(unwrap);

/** GET /auth/mfa/setup -> { qrDataUrl, otpauthUrl } */
export const setupMfa = () => apiClient.get("/auth/mfa/setup").then(unwrap);

/** POST /auth/mfa/enable — confirm setup with first TOTP code */
export const enableMfa = (code) =>
  apiClient.post("/auth/mfa/enable", { code }).then(unwrap);

/** POST /auth/mfa/verify — second step of login when MFA is on */
export const verifyMfa = (mfaTempToken, code) =>
  apiClient.post("/auth/mfa/verify", { mfaTempToken, code }).then(unwrap);

/** POST /auth/mfa/disable — turn off MFA (requires current TOTP) */
export const disableMfa = (code) =>
  apiClient.post("/auth/mfa/disable", { code }).then(unwrap);

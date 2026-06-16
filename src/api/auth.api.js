import apiClient, { unwrap } from "./client";

/** POST /auth/login -> { accessToken, refreshToken, user } */
export const login = (email, password) =>
  apiClient.post("/auth/login", { email, password }).then(unwrap);

/** POST /auth/register */
export const register = (payload) =>
  apiClient.post("/auth/register", payload).then(unwrap);

/** POST /auth/refresh -> { accessToken, refreshToken, user } */
export const refresh = (refreshToken) =>
  apiClient.post("/auth/refresh", { refreshToken }).then(unwrap);

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

/** POST /auth/logout */
export const logout = () => apiClient.post("/auth/logout").then(unwrap);

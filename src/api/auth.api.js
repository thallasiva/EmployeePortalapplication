import apiClient, { unwrap } from "./client";


export const login = (email, password) =>
apiClient.post("/auth/login", { email, password }).then(unwrap);


export const register = (payload) =>
apiClient.post("/auth/register", payload).then(unwrap);


export const refresh = () =>
apiClient.post("/auth/refresh", {}).then(unwrap);


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


export const bustMeCache = () => {_meCache = null;_meCacheAt = 0;};


export const changePassword = (currentPassword, newPassword) =>
apiClient.post("/auth/change-password", { currentPassword, newPassword }).then(unwrap);


export const forgotPassword = (email) =>
apiClient.post("/auth/forgot-password", { email }).then(unwrap);


export const resetPassword = (token, newPassword) =>
apiClient.post("/auth/reset-password", { token, newPassword }).then(unwrap);


export const logout = () =>
apiClient.post("/auth/logout", {}).then(unwrap).finally(bustMeCache);




export const verifyMfa = (mfaTempToken, code) =>
apiClient.post("/auth/mfa/verify", { mfaTempToken, code }).then(unwrap);


export const getMfaStatus = () =>
apiClient.get("/auth/mfa/status").then(unwrap);


export const setupMfa = () =>
apiClient.post("/auth/mfa/setup", {}).then(unwrap);


export const enableMfa = (code) =>
apiClient.post("/auth/mfa/enable", { code }).then(unwrap);


export const disableMfa = (code) =>
apiClient.post("/auth/mfa/disable", { code }).then(unwrap);

import axios from "axios";

export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// ── Token storage ─────────────────────────────────────────────────────────────
// Access and refresh tokens are now stored in httpOnly cookies set by the
// server. They are NOT readable by JavaScript. The functions below are kept
// for backward compatibility but no longer touch localStorage tokens.

export function getAccessToken()  { return null; } // tokens live in httpOnly cookies
export function getRefreshToken() { return null; }

export function setAuthTokens() {
  // No-op: server sets httpOnly cookies automatically on login/refresh
}

export function clearAuthSession() {
  // Only clear user profile from localStorage — tokens are cleared by the
  // server's Set-Cookie on POST /auth/logout (clearTokenCookies).
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  // Legacy cleanup
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,  // ← sends httpOnly cookies on every request
});

// No Authorization header interceptor needed — cookies are automatic.

let isRefreshing = false;
let pendingRequests = [];

const onRefreshed = (ok) => {
  pendingRequests.forEach((cb) => cb(ok));
  pendingRequests = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (!response) return Promise.reject(error);

    const isAuthEndpoint =
      config?.url?.includes("/auth/login") ||
      config?.url?.includes("/auth/refresh") ||
      config?.url?.includes("/auth/register") ||
      config?.url?.includes("/auth/mfa");

    if (response.status === 401 && !config._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push((ok) => {
            if (!ok) { reject(error); return; }
            config._retry = true;
            resolve(apiClient(config));
          });
        });
      }

      isRefreshing = true;
      try {
        // Token refresh — cookie is sent automatically via withCredentials
        await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        onRefreshed(true);
        config._retry = true;
        return apiClient(config);
      } catch (refreshError) {
        onRefreshed(false);
        clearAuthSession();
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/** Extracts the `data` field from a successful `{ success, data, message, meta }` response. */
export function unwrap(response) {
  return response?.data?.data;
}

/** Extracts `{ data, meta }` from a successful paginated response. */
export function unwrapList(response) {
  return {
    data: response?.data?.data ?? [],
    meta: response?.data?.meta,
  };
}

/** Extracts a friendly error message from an Axios error. */
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    fallback
  );
}

export default apiClient;

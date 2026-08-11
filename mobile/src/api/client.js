import axios from 'axios';
import { Storage } from '../utils/storage';
import CONFIG from '../constants/config';

// ─── In-memory token store ────────────────────────────────────────────────────
// The interceptor reads from here instead of SecureStore on every request.
// AuthContext calls setClientToken() immediately after login so the token is
// available even if SecureStore silently fails.
let _token = null;

export function setClientToken(token) {
  _token = token || null;
}

export function getClientToken() {
  return _token;
}
// ─────────────────────────────────────────────────────────────────────────────

const client = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(async (config) => {
  const skipAuth = config.url?.includes('/auth/login') || config.url?.includes('/auth/refresh');
  if (!skipAuth) {
    // Prefer in-memory token (set by AuthContext on login / restore)
    // Fall back to SecureStore in case app was cold-started with a saved session
    const token = _token || (await Storage.getToken().catch(() => null));
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Keep in-memory in sync if we fell back to storage
      if (!_token) _token = token;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return client(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = await Storage.getRefreshToken().catch(() => null);
        if (refreshToken) {
          const res = await axios.post(`${CONFIG.API_URL}/auth/refresh`, { refreshToken });
          const newToken = res.data?.data?.token || res.data?.token;
          if (newToken) {
            _token = newToken;
            await Storage.setToken(newToken).catch(() => {});
            original.headers.Authorization = `Bearer ${newToken}`;
            processQueue(null, newToken);
            return client(original);
          }
        }
      } catch (e) {
        processQueue(e, null);
        _token = null;
        await Storage.clear().catch(() => {});
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default client;

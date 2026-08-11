import * as SecureStore from 'expo-secure-store';

const KEYS = {
  TOKEN: 'hrms_token',
  REFRESH_TOKEN: 'hrms_refresh_token',
  USER: 'hrms_user',
};

export const Storage = {
  async setToken(token) {
    if (!token) return;
    await SecureStore.setItemAsync(KEYS.TOKEN, String(token));
  },
  async getToken() {
    return await SecureStore.getItemAsync(KEYS.TOKEN);
  },
  async setRefreshToken(token) {
    if (!token) return;
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, String(token));
  },
  async getRefreshToken() {
    return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  },
  async setUser(user) {
    if (!user) return;
    await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
  },
  async getUser() {
    const data = await SecureStore.getItemAsync(KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  async clear() {
    await Promise.allSettled([
      SecureStore.deleteItemAsync(KEYS.TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(KEYS.USER),
    ]);
  },
};

/**
 * notificationsSlice — app-wide notification bell badge count + list.
 *
 * Requires: @reduxjs/toolkit react-redux
 */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient, { unwrap } from "../../api/client";

/* ─── thunks ─────────────────────────────────────────────────────────────── */
export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return await apiClient.get("/notifications").then(unwrap);
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message ?? e.message);
    }
  }
);

export const markAllRead = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.post("/notifications/read-all");
      return true;
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message ?? e.message);
    }
  }
);

/* ─── slice ──────────────────────────────────────────────────────────────── */
const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    items:   [],
    unread:  0,
    status:  "idle",
    error:   null,
  },
  reducers: {
    clearNotifications: (state) => {
      state.items  = [];
      state.unread = 0;
      state.status = "idle";
    },
    addNotification: (state, action) => {
      state.items.unshift(action.payload);
      if (!action.payload.read) state.unread += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending,  (s) => { s.status = "loading"; })
      .addCase(fetchNotifications.fulfilled,(s, a) => {
        s.status = "succeeded";
        s.items  = a.payload ?? [];
        s.unread = (a.payload ?? []).filter((n) => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (s, a) => { s.status = "failed"; s.error = a.payload; })
      .addCase(markAllRead.fulfilled, (s) => {
        s.unread = 0;
        s.items  = s.items.map((n) => ({ ...n, read: true }));
      });
  },
});

/* ─── selectors ──────────────────────────────────────────────────────────── */
export const selectNotifications = (state) => state.notifications;
export const selectUnreadCount   = (state) => state.notifications.unread;

export const { clearNotifications, addNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;

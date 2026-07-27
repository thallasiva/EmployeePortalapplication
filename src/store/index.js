/**
 * Redux Toolkit store.
 *
 * SETUP (one-time):
 *   npm install @reduxjs/toolkit react-redux
 *
 * Then wrap your app in index.js:
 *   import { Provider } from "react-redux";
 *   import { store } from "./store";
 *   <Provider store={store}><App /></Provider>
 */
import { configureStore } from "@reduxjs/toolkit";
import referenceDataReducer from "./slices/referenceDataSlice";
import notificationsReducer from "./slices/notificationsSlice";

export const store = configureStore({
  reducer: {
    referenceData: referenceDataReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        /* ignore non-serializable values in these paths (e.g. File objects) */
        ignoredActions: ["referenceData/fetchDepartments/fulfilled"],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

export default store;

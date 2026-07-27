/**
 * referenceDataSlice — shared drop-down / lookup data fetched once and reused app-wide.
 *
 * Covers: departments, designations, leave types.
 * Avoids redundant API calls from multiple page-level components.
 *
 * Requires: @reduxjs/toolkit react-redux
 * Install : npm install @reduxjs/toolkit react-redux
 */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { listDepartments }  from "../../api/department.api";
import { listLeaveTypes }   from "../../api/leaveType.api";

/* ─── thunks ─────────────────────────────────────────────────────────────── */
export const fetchDepartments = createAsyncThunk(
  "referenceData/fetchDepartments",
  async (_, { rejectWithValue }) => {
    try { return await listDepartments(); }
    catch (e) { return rejectWithValue(e?.response?.data?.message ?? e.message); }
  }
);

export const fetchLeaveTypes = createAsyncThunk(
  "referenceData/fetchLeaveTypes",
  async (_, { rejectWithValue }) => {
    try { return await listLeaveTypes(); }
    catch (e) { return rejectWithValue(e?.response?.data?.message ?? e.message); }
  }
);

/* ─── slice ──────────────────────────────────────────────────────────────── */
const referenceDataSlice = createSlice({
  name: "referenceData",
  initialState: {
    departments:  { data: [], status: "idle", error: null },
    leaveTypes:   { data: [], status: "idle", error: null },
  },
  reducers: {
    resetReferenceData: (state) => {
      state.departments = { data: [], status: "idle", error: null };
      state.leaveTypes  = { data: [], status: "idle", error: null };
    },
  },
  extraReducers: (builder) => {
    /* departments */
    builder
      .addCase(fetchDepartments.pending,  (s) => { s.departments.status = "loading"; })
      .addCase(fetchDepartments.fulfilled,(s, a) => { s.departments.status = "succeeded"; s.departments.data = a.payload ?? []; })
      .addCase(fetchDepartments.rejected, (s, a) => { s.departments.status = "failed"; s.departments.error = a.payload; });

    /* leave types */
    builder
      .addCase(fetchLeaveTypes.pending,   (s) => { s.leaveTypes.status = "loading"; })
      .addCase(fetchLeaveTypes.fulfilled, (s, a) => { s.leaveTypes.status = "succeeded"; s.leaveTypes.data = a.payload ?? []; })
      .addCase(fetchLeaveTypes.rejected,  (s, a) => { s.leaveTypes.status = "failed"; s.leaveTypes.error = a.payload; });
  },
});

/* ─── selectors ──────────────────────────────────────────────────────────── */
export const selectDepartments = (state) => state.referenceData.departments;
export const selectLeaveTypes  = (state) => state.referenceData.leaveTypes;

export const { resetReferenceData } = referenceDataSlice.actions;
export default referenceDataSlice.reducer;

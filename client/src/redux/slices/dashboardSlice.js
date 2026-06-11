import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchDashboardStats = createAsyncThunk('dashboard/fetchStats', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/dashboard/stats'); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchAnalytics = createAsyncThunk('dashboard/fetchAnalytics', async (period, { rejectWithValue }) => {
  try { const { data } = await api.get('/dashboard/analytics', { params: { period } }); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: { stats: null, analytics: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => { state.loading = true; })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => { state.loading = false; state.stats = action.payload; })
      .addCase(fetchDashboardStats.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchAnalytics.fulfilled, (state, action) => { state.analytics = action.payload; });
  },
});

export default dashboardSlice.reducer;

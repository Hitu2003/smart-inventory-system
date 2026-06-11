import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const fetchCustomers = createAsyncThunk('customers/fetchAll', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/customers', { params }); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchCustomer = createAsyncThunk('customers/fetchOne', async (id, { rejectWithValue }) => {
  try { const { data } = await api.get(`/customers/${id}`); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const createCustomer = createAsyncThunk('customers/create', async (customerData, { rejectWithValue }) => {
  try { const { data } = await api.post('/customers', customerData); toast.success('Customer added successfully'); return data.data; }
  catch (err) { toast.error(err.response?.data?.message || 'Failed to add customer'); return rejectWithValue(err.response?.data?.message); }
});

export const updateCustomer = createAsyncThunk('customers/update', async ({ id, data: customerData }, { rejectWithValue }) => {
  try { const { data } = await api.put(`/customers/${id}`, customerData); toast.success('Customer updated'); return data.data; }
  catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); return rejectWithValue(err.response?.data?.message); }
});

export const deleteCustomer = createAsyncThunk('customers/delete', async (id, { rejectWithValue }) => {
  try { await api.delete(`/customers/${id}`); toast.success('Customer deactivated'); return id; }
  catch (err) { toast.error(err.response?.data?.message || 'Failed'); return rejectWithValue(err.response?.data?.message); }
});

export const fetchCustomerStats = createAsyncThunk('customers/stats', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/customers/stats'); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const customerSlice = createSlice({
  name: 'customers',
  initialState: { items: [], currentCustomer: null, stats: null, loading: false, error: null, total: 0, pages: 1 },
  reducers: { clearCurrentCustomer: (state) => { state.currentCustomer = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => { state.loading = true; })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
      })
      .addCase(fetchCustomers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchCustomer.fulfilled, (state, action) => { state.currentCustomer = action.payload; })
      .addCase(createCustomer.fulfilled, (state, action) => { state.items.unshift(action.payload); state.total += 1; })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const idx = state.items.findIndex((c) => c._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        const idx = state.items.findIndex((c) => c._id === action.payload);
        if (idx !== -1) state.items[idx].status = 'inactive';
      })
      .addCase(fetchCustomerStats.fulfilled, (state, action) => { state.stats = action.payload; });
  },
});

export const { clearCurrentCustomer } = customerSlice.actions;
export default customerSlice.reducer;

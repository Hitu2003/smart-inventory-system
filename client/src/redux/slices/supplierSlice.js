import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const fetchSuppliers = createAsyncThunk('suppliers/fetchAll', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/suppliers', { params }); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const createSupplier = createAsyncThunk('suppliers/create', async (supplierData, { rejectWithValue }) => {
  try { const { data } = await api.post('/suppliers', supplierData); toast.success('Supplier created'); return data.data; }
  catch (err) { toast.error(err.response?.data?.message || 'Failed'); return rejectWithValue(err.response?.data?.message); }
});

export const updateSupplier = createAsyncThunk('suppliers/update', async ({ id, data: supplierData }, { rejectWithValue }) => {
  try { const { data } = await api.put(`/suppliers/${id}`, supplierData); toast.success('Supplier updated'); return data.data; }
  catch (err) { toast.error(err.response?.data?.message || 'Failed'); return rejectWithValue(err.response?.data?.message); }
});

export const deleteSupplier = createAsyncThunk('suppliers/delete', async (id, { rejectWithValue }) => {
  try { await api.delete(`/suppliers/${id}`); toast.success('Supplier deleted'); return id; }
  catch (err) { toast.error(err.response?.data?.message || 'Failed'); return rejectWithValue(err.response?.data?.message); }
});

const supplierSlice = createSlice({
  name: 'suppliers',
  initialState: { items: [], loading: false, error: null, total: 0 },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (state) => { state.loading = true; })
      .addCase(fetchSuppliers.fulfilled, (state, action) => { state.loading = false; state.items = action.payload.data; state.total = action.payload.total; })
      .addCase(fetchSuppliers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createSupplier.fulfilled, (state, action) => { state.items.unshift(action.payload); state.total += 1; })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        const idx = state.items.findIndex((s) => s._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteSupplier.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s._id !== action.payload);
        state.total -= 1;
      });
  },
});

export default supplierSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const fetchTransactions = createAsyncThunk('transactions/fetchAll', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/transactions', { params }); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchTransaction = createAsyncThunk('transactions/fetchOne', async (id, { rejectWithValue }) => {
  try { const { data } = await api.get(`/transactions/${id}`); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const createTransaction = createAsyncThunk('transactions/create', async (txData, { rejectWithValue }) => {
  try { const { data } = await api.post('/transactions', txData); toast.success('Transaction created'); return data.data; }
  catch (err) { toast.error(err.response?.data?.message || 'Failed'); return rejectWithValue(err.response?.data?.message); }
});

export const deleteTransaction = createAsyncThunk('transactions/delete', async (id, { rejectWithValue }) => {
  try { await api.delete(`/transactions/${id}`); toast.success('Transaction deleted'); return id; }
  catch (err) { toast.error(err.response?.data?.message || 'Failed'); return rejectWithValue(err.response?.data?.message); }
});

const transactionSlice = createSlice({
  name: 'transactions',
  initialState: { items: [], currentTransaction: null, loading: false, error: null, total: 0, page: 1, pages: 1 },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => { state.loading = true; })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
      })
      .addCase(fetchTransactions.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchTransaction.fulfilled, (state, action) => { state.currentTransaction = action.payload; })
      .addCase(createTransaction.fulfilled, (state, action) => { state.items.unshift(action.payload); state.total += 1; })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t._id !== action.payload);
        state.total -= 1;
      });
  },
});

export default transactionSlice.reducer;

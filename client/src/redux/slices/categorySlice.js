import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const fetchCategories = createAsyncThunk('categories/fetchAll', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/categories'); return data.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const createCategory = createAsyncThunk('categories/create', async (catData, { rejectWithValue }) => {
  try { const { data } = await api.post('/categories', catData); toast.success('Category created'); return data.data; }
  catch (err) { toast.error(err.response?.data?.message || 'Failed'); return rejectWithValue(err.response?.data?.message); }
});

export const updateCategory = createAsyncThunk('categories/update', async ({ id, data: catData }, { rejectWithValue }) => {
  try { const { data } = await api.put(`/categories/${id}`, catData); toast.success('Category updated'); return data.data; }
  catch (err) { toast.error(err.response?.data?.message || 'Failed'); return rejectWithValue(err.response?.data?.message); }
});

export const deleteCategory = createAsyncThunk('categories/delete', async (id, { rejectWithValue }) => {
  try { await api.delete(`/categories/${id}`); toast.success('Category deleted'); return id; }
  catch (err) { toast.error(err.response?.data?.message || 'Failed'); return rejectWithValue(err.response?.data?.message); }
});

const categorySlice = createSlice({
  name: 'categories',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => { state.loading = true; })
      .addCase(fetchCategories.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchCategories.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createCategory.fulfilled, (state, action) => { state.items.push(action.payload); })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const idx = state.items.findIndex((c) => c._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c._id !== action.payload);
      });
  },
});

export default categorySlice.reducer;

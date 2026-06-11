import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const fetchProducts = createAsyncThunk('products/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/products', { params });
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchProduct = createAsyncThunk('products/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/products/${id}`);
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const createProduct = createAsyncThunk('products/create', async (productData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/products', productData);
    toast.success('Product created successfully');
    return data.data;
  } catch (err) { toast.error(err.response?.data?.message || 'Failed to create product'); return rejectWithValue(err.response?.data?.message); }
});

export const updateProduct = createAsyncThunk('products/update', async ({ id, data: productData }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/products/${id}`, productData);
    toast.success('Product updated successfully');
    return data.data;
  } catch (err) { toast.error(err.response?.data?.message || 'Failed to update product'); return rejectWithValue(err.response?.data?.message); }
});

export const deleteProduct = createAsyncThunk('products/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/products/${id}`);
    toast.success('Product deleted successfully');
    return id;
  } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete product'); return rejectWithValue(err.response?.data?.message); }
});

export const fetchLowStockProducts = createAsyncThunk('products/lowStock', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/products/low-stock');
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

export const fetchProductStats = createAsyncThunk('products/stats', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/products/stats');
    return data.data;
  } catch (err) { return rejectWithValue(err.response?.data?.message); }
});

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    currentProduct: null,
    lowStockItems: [],
    stats: null,
    loading: false,
    error: null,
    total: 0,
    page: 1,
    pages: 1,
  },
  reducers: {
    clearCurrentProduct: (state) => { state.currentProduct = null; },
    updateProductInList: (state, action) => {
      const idx = state.items.findIndex((p) => p._id === action.payload._id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.loading = true; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
      })
      .addCase(fetchProducts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchProduct.fulfilled, (state, action) => { state.currentProduct = action.payload; })
      .addCase(createProduct.fulfilled, (state, action) => { state.items.unshift(action.payload); state.total += 1; })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const idx = state.items.findIndex((p) => p._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.currentProduct?._id === action.payload._id) state.currentProduct = action.payload;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p._id !== action.payload);
        state.total -= 1;
      })
      .addCase(fetchLowStockProducts.fulfilled, (state, action) => { state.lowStockItems = action.payload; })
      .addCase(fetchProductStats.fulfilled, (state, action) => { state.stats = action.payload; });
  },
});

export const { clearCurrentProduct, updateProductInList } = productSlice.actions;
export default productSlice.reducer;

'use client';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Fetch recently viewed products
export const fetchRecentlyViewedProducts = createAsyncThunk(
  'recentlyViewed/fetchRecentlyViewedProducts',
  async (limit, { rejectWithValue }) => {
    try {
      const url = limit 
        ? `/api/recently-seen?limit=${limit}` 
        : '/api/recently-seen';
      
      const response = await axios.get(url);
      return response.data.data;
    } catch (error) {
      // If user is not authenticated, don't show an error
      if (error.response?.status === 401) {
        return [];
      }
      return rejectWithValue("Failed to fetch recently viewed products");
    }
  }
);

// Clear all recently viewed products
export const clearRecentlyViewedProducts = createAsyncThunk(
  'recentlyViewed/clearRecentlyViewedProducts',
  async (_, { rejectWithValue }) => {
    try {
      await axios.delete('/api/recently-seen/clear');
      return true;
    } catch (error) {
      return rejectWithValue("Failed to clear recently viewed products");
    }
  }
);

const initialState = {
  products: [],
  loading: false,
  error: null,
};

const recentlyViewedSlice = createSlice({
  name: 'recentlyViewed',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Recently Viewed Products
      .addCase(fetchRecentlyViewedProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecentlyViewedProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchRecentlyViewedProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Clear Recently Viewed Products
      .addCase(clearRecentlyViewedProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(clearRecentlyViewedProducts.fulfilled, (state) => {
        state.loading = false;
        state.products = [];
      })
      .addCase(clearRecentlyViewedProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default recentlyViewedSlice.reducer; 
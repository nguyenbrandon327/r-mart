'use client';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunks
export const searchProducts = createAsyncThunk(
  'search/searchProducts',
  async ({ query, category, minPrice, maxPrice, sort = 'best_match', limit = 20, offset = 0 }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        q: query,
        ...(category && { category }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
        sort,
        limit,
        offset
      });

      const response = await axios.get(`/api/search/products?${params}`);
      return response.data;
    } catch (err) {
      if (err.response?.status === 429) return rejectWithValue("Rate limit exceeded");
      return rejectWithValue(err.response?.data?.message || "Search failed");
    }
  }
);

export const fetchSearchSuggestions = createAsyncThunk(
  'search/fetchSuggestions',
  async (query, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
      return response.data.suggestions;
    } catch (err) {
      return rejectWithValue("Failed to fetch suggestions");
    }
  }
);

const initialState = {
  searchQuery: '',
  searchResults: [],
  suggestions: [],
  total: 0,
  limit: 20,
  offset: 0,
  loading: false,
  suggestionsLoading: false,
  error: null,
  filters: {
    category: '',
    minPrice: '',
    maxPrice: '',
    sort: 'best_match'
  },
  showSuggestions: false
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
      state.suggestions = [];
      state.total = 0;
      state.offset = 0;
      state.error = null;
    },
    setShowSuggestions: (state, action) => {
      state.showSuggestions = action.payload;
    },
    clearSuggestions: (state) => {
      state.suggestions = [];
      state.showSuggestions = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Search Products
      .addCase(searchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading = false;
        // If offset is 0, replace results; otherwise append for pagination
        if (action.payload.offset === 0) {
          state.searchResults = action.payload.data;
        } else {
          state.searchResults = [...state.searchResults, ...action.payload.data];
        }
        state.total = action.payload.total;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.searchResults = [];
      })
      // Fetch Suggestions
      .addCase(fetchSearchSuggestions.pending, (state) => {
        state.suggestionsLoading = true;
      })
      .addCase(fetchSearchSuggestions.fulfilled, (state, action) => {
        state.suggestionsLoading = false;
        state.suggestions = action.payload;
        state.showSuggestions = action.payload.length > 0;
      })
      .addCase(fetchSearchSuggestions.rejected, (state) => {
        state.suggestionsLoading = false;
        state.suggestions = [];
      });
  },
});

export const { 
  setSearchQuery, 
  setFilters, 
  clearFilters, 
  clearSearch, 
  setShowSuggestions,
  clearSuggestions 
} = searchSlice.actions;

export default searchSlice.reducer; 
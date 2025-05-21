import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { enableMapSet } from "immer";

// Enable MapSet support for Immer (used by Redux Toolkit)
enableMapSet();

// Async thunk for fetching saved products
export const fetchSavedProducts = createAsyncThunk(
  "savedProducts/fetchSavedProducts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/saved-products", {
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to fetch saved products");
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || "Network error");
    }
  }
);

// Async thunk for saving a product
export const saveProduct = createAsyncThunk(
  "savedProducts/saveProduct",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/saved-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ productId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to save product");
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || "Network error");
    }
  }
);

// Async thunk for removing a saved product
export const unsaveProduct = createAsyncThunk(
  "savedProducts/unsaveProduct",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/saved-products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to remove saved product");
      }
      
      return productId;
    } catch (error) {
      return rejectWithValue(error.message || "Network error");
    }
  }
);

// Async thunk for checking if a product is saved
export const checkIsSaved = createAsyncThunk(
  "savedProducts/checkIsSaved",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/saved-products/${productId}/check`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "Failed to check saved status");
      }
      
      const data = await response.json();
      return { productId, isSaved: data.isSaved };
    } catch (error) {
      return rejectWithValue(error.message || "Network error");
    }
  }
);

const savedProductsSlice = createSlice({
  name: "savedProducts",
  initialState: {
    items: [],
    savedProductIds: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearSavedProducts: (state) => {
      state.items = [];
      state.savedProductIds = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch saved products
      .addCase(fetchSavedProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSavedProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.savedProductIds = action.payload.map(product => product.id);
      })
      .addCase(fetchSavedProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch saved products";
      })
      
      // Save product
      .addCase(saveProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveProduct.fulfilled, (state, action) => {
        state.loading = false;
        // Add the saved product ID to the savedProductIds array
        const productId = parseInt(action.payload.product_id);
        if (!state.savedProductIds.includes(productId)) {
          state.savedProductIds.push(productId);
        }
      })
      .addCase(saveProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to save product";
      })
      
      // Unsave product
      .addCase(unsaveProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unsaveProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item.id !== action.payload);
        state.savedProductIds = state.savedProductIds.filter(id => id !== action.payload);
      })
      .addCase(unsaveProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to remove saved product";
      })
      
      // Check is saved
      .addCase(checkIsSaved.fulfilled, (state, action) => {
        const { productId, isSaved } = action.payload;
        if (isSaved) {
          if (!state.savedProductIds.includes(productId)) {
            state.savedProductIds.push(productId);
          }
        } else {
          state.savedProductIds = state.savedProductIds.filter(id => id !== productId);
        }
      });
  },
});

export const { clearSavedProducts } = savedProductsSlice.actions;
export default savedProductsSlice.reducer; 
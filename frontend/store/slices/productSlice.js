'use client';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import toast from 'react-hot-toast';

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/products');
      return response.data.data;
    } catch (err) {
      if (err.status === 429) return rejectWithValue("Rate limit exceeded");
      return rejectWithValue("Something went wrong");
    }
  }
);

export const fetchProductsByCategory = createAsyncThunk(
  'products/fetchProductsByCategory',
  async (category, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/products/category/${category}`);
      return response.data.data;
    } catch (err) {
      if (err.status === 429) return rejectWithValue("Rate limit exceeded");
      return rejectWithValue("Something went wrong");
    }
  }
);

export const addProduct = createAsyncThunk(
  'products/addProduct',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success("Product added successfully");
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      return rejectWithValue(error.message);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/products/${id}`);
      toast.success("Product deleted successfully");
      return id;
    } catch (error) {
      toast.error("Something went wrong");
      return rejectWithValue(error.message);
    }
  }
);

export const fetchProduct = createAsyncThunk(
  'products/fetchProduct',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/products/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue("Something went wrong");
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success("Product updated successfully");
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      return rejectWithValue(error.message);
    }
  }
);

export const deleteProductImage = createAsyncThunk(
  'products/deleteProductImage',
  async ({ productId, imageUrl }, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/products/${productId}/image`, {
        data: { imageUrl }
      });
      toast.success("Image deleted successfully");
      return { productId, imageUrl };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete image");
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  products: [],
  loading: false,
  error: null,
  currentProduct: null,
  formData: {
    name: "",
    price: "",
    description: "",
    category: "",
  },
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFormData: (state, action) => {
      state.formData = action.payload;
    },
    resetForm: (state) => {
      state.formData = { name: "", price: "", description: "", category: "" };
    },
    populateFormData: (state) => {
      if (state.currentProduct) {
        state.formData = {
          name: state.currentProduct.name,
          price: state.currentProduct.price,
          description: state.currentProduct.description,
          category: state.currentProduct.category,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.products = [];
      })
      // Fetch Products by Category
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.products = [];
      })
      // Add Product
      .addCase(addProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.formData = initialState.formData;
        state.products.push(action.payload);
      })
      .addCase(addProduct.rejected, (state) => {
        state.loading = false;
      })
      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter(product => product.id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state) => {
        state.loading = false;
      })
      // Fetch Single Product
      .addCase(fetchProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
        state.formData = {
          name: action.payload.name,
          price: action.payload.price,
          description: action.payload.description,
          category: action.payload.category,
        };
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.currentProduct = null;
      })
      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProduct = action.payload;
        // Update formData with the updated product information
        state.formData = {
          name: action.payload.name,
          price: action.payload.price,
          description: action.payload.description,
          category: action.payload.category,
        };
      })
      .addCase(updateProduct.rejected, (state) => {
        state.loading = false;
      })
      // Delete Product Image
      .addCase(deleteProductImage.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteProductImage.fulfilled, (state, action) => {
        state.loading = false;
        const { productId, imageUrl } = action.payload;
        
        // Update the current product if it's the one being modified
        if (state.currentProduct && state.currentProduct.id === productId) {
          state.currentProduct.images = state.currentProduct.images.filter(
            img => img !== imageUrl
          );
        }
        
        // Update the product in the products list if it exists there
        const productIndex = state.products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
          state.products[productIndex].images = state.products[productIndex].images.filter(
            img => img !== imageUrl
          );
        }
      })
      .addCase(deleteProductImage.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { setFormData, resetForm, populateFormData } = productSlice.actions;
export default productSlice.reducer; 
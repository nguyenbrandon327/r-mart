'use client';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import toast from 'react-hot-toast';

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ excludeRecentlyViewed = false, sort = 'best_match' } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (excludeRecentlyViewed) params.append('excludeRecentlyViewed', 'true');
      if (sort) params.append('sort', sort);
      
      const queryString = params.toString();
      const response = await axios.get(`/api/products${queryString ? `?${queryString}` : ''}`);
      return response.data.data;
    } catch (err) {
      if (err.status === 429) return rejectWithValue("Rate limit exceeded");
      return rejectWithValue("Something went wrong");
    }
  }
);

export const fetchProductsByCategory = createAsyncThunk(
  'products/fetchProductsByCategory',
  async ({ category, sort = 'best_match' }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ sort });
      const response = await axios.get(`/api/products/category/${category}?${params}`);
      return response.data.data;
    } catch (err) {
      if (err.status === 429) return rejectWithValue("Rate limit exceeded");
      return rejectWithValue("Something went wrong");
    }
  }
);

export const fetchProductsByLocation = createAsyncThunk(
  'products/fetchProductsByLocation',
  async ({ category, maxDistance = 10, sort = 'distance' }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ 
        ...(category && { category }),
        maxDistance: maxDistance.toString(),
        sort 
      });
      const response = await axios.get(`/api/products/by-location?${params}`);
      return { 
        products: response.data.data, 
        userLocation: response.data.userLocation 
      };
    } catch (err) {
      if (err.response?.status === 401) {
        return rejectWithValue("Please log in to use location-based filtering");
      }
      if (err.response?.status === 400) {
        return rejectWithValue(err.response.data.message || "Location not set");
      }
      if (err.response?.status === 429) {
        return rejectWithValue("Rate limit exceeded");
      }
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

export const fetchSellerOtherProducts = createAsyncThunk(
  'products/fetchSellerOtherProducts',
  async ({ userId, excludeProductId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/products/seller/${userId}/other/${excludeProductId}`);
      return response.data.data;
    } catch (err) {
      if (err.status === 429) return rejectWithValue("Rate limit exceeded");
      return rejectWithValue("Something went wrong");
    }
  }
);

export const markProductAsSold = createAsyncThunk(
  'products/markProductAsSold',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/api/products/${productId}/sold`);
      toast.success("Product marked as sold");
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark product as sold");
      return rejectWithValue(error.message);
    }
  }
);

export const markProductAsAvailable = createAsyncThunk(
  'products/markProductAsAvailable',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/api/products/${productId}/available`);
      toast.success("Product marked as available");
      return response.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark product as available");
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  products: [],
  loading: false,
  error: null,
  currentProduct: null,
  sellerOtherProducts: [],
  sellerOtherProductsLoading: false,
  sort: 'best_match',
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
    setSort: (state, action) => {
      state.sort = action.payload;
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
      // Fetch Products by Location
      .addCase(fetchProductsByLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsByLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
      })
      .addCase(fetchProductsByLocation.rejected, (state, action) => {
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
      })
      // Fetch Seller Other Products
      .addCase(fetchSellerOtherProducts.pending, (state) => {
        state.sellerOtherProductsLoading = true;
        state.error = null;
      })
      .addCase(fetchSellerOtherProducts.fulfilled, (state, action) => {
        state.sellerOtherProductsLoading = false;
        state.sellerOtherProducts = action.payload;
      })
      .addCase(fetchSellerOtherProducts.rejected, (state, action) => {
        state.sellerOtherProductsLoading = false;
        state.error = action.payload;
        state.sellerOtherProducts = [];
      })
      // Mark Product as Sold
      .addCase(markProductAsSold.pending, (state) => {
        state.loading = true;
      })
      .addCase(markProductAsSold.fulfilled, (state, action) => {
        state.loading = false;
        const updatedProduct = action.payload;
        
        // Update the current product if it's the one being modified
        if (state.currentProduct && state.currentProduct.id === updatedProduct.id) {
          state.currentProduct.is_sold = updatedProduct.is_sold;
        }
        
        // Update the product in the products list if it exists there
        const productIndex = state.products.findIndex(p => p.id === updatedProduct.id);
        if (productIndex !== -1) {
          state.products[productIndex].is_sold = updatedProduct.is_sold;
        }
      })
      .addCase(markProductAsSold.rejected, (state) => {
        state.loading = false;
      })
      // Mark Product as Available
      .addCase(markProductAsAvailable.pending, (state) => {
        state.loading = true;
      })
      .addCase(markProductAsAvailable.fulfilled, (state, action) => {
        state.loading = false;
        const updatedProduct = action.payload;
        
        // Update the current product if it's the one being modified
        if (state.currentProduct && state.currentProduct.id === updatedProduct.id) {
          state.currentProduct.is_sold = updatedProduct.is_sold;
        }
        
        // Update the product in the products list if it exists there
        const productIndex = state.products.findIndex(p => p.id === updatedProduct.id);
        if (productIndex !== -1) {
          state.products[productIndex].is_sold = updatedProduct.is_sold;
        }
      })
      .addCase(markProductAsAvailable.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { setFormData, resetForm, populateFormData, setSort } = productSlice.actions;
export default productSlice.reducer; 
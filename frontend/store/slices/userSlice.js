'use client';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.NODE_ENV === "development" ? "http://localhost:3000/api/users" : "/api/users";

axios.defaults.withCredentials = true;

const initialState = {
  currentUserProfile: null,
  viewedUserProfile: null,
  userProducts: [],
  isLoading: false,
  error: null,
  message: null
};

// Get current user's profile
export const getCurrentUserProfile = createAsyncThunk(
  'user/getCurrentUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/profile`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error fetching profile");
    }
  }
);

// Get user by username (for profile pages)
export const getUserByUsername = createAsyncThunk(
  'user/getUserByUsername',
  async (username, { rejectWithValue }) => {
    try {
      // First get user by email pattern (username@domain)
      const response = await axios.get(`${API_URL}/by-username/${username}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "User not found");
    }
  }
);

// Update user profile
export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async ({ name, description, major }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/profile`, { name, description, major });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error updating profile");
    }
  }
);

// Upload profile picture
export const uploadProfilePic = createAsyncThunk(
  'user/uploadProfilePic',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/profile-pic`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error uploading profile picture");
    }
  }
);

// Delete profile picture
export const deleteProfilePic = createAsyncThunk(
  'user/deleteProfilePic',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/profile-pic`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error deleting profile picture");
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
    clearViewedUserProfile: (state) => {
      state.viewedUserProfile = null;
      state.userProducts = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Get current user profile
      .addCase(getCurrentUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUserProfile = action.payload.user;
      })
      .addCase(getCurrentUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get user by username
      .addCase(getUserByUsername.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserByUsername.fulfilled, (state, action) => {
        state.isLoading = false;
        state.viewedUserProfile = action.payload.user;
        state.userProducts = action.payload.products || [];
      })
      .addCase(getUserByUsername.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUserProfile = action.payload.user;
        // Also update viewedUserProfile if it's the same user
        if (state.viewedUserProfile && state.viewedUserProfile.id === action.payload.user.id) {
          state.viewedUserProfile = {
            ...action.payload.user,
            year: action.payload.user.year,
            major: action.payload.user.major
          };
        }
        state.message = action.payload.message;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Upload profile picture
      .addCase(uploadProfilePic.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadProfilePic.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUserProfile = action.payload.user;
        // Also update viewedUserProfile if it's the same user
        if (state.viewedUserProfile && state.viewedUserProfile.id === action.payload.user.id) {
          state.viewedUserProfile = action.payload.user;
        }
        state.message = action.payload.message;
      })
      .addCase(uploadProfilePic.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete profile picture
      .addCase(deleteProfilePic.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProfilePic.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUserProfile = action.payload.user;
        // Also update viewedUserProfile if it's the same user
        if (state.viewedUserProfile && state.viewedUserProfile.id === action.payload.user.id) {
          state.viewedUserProfile = action.payload.user;
        }
        state.message = action.payload.message;
      })
      .addCase(deleteProfilePic.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearMessage, clearViewedUserProfile } = userSlice.actions;
export default userSlice.reducer; 
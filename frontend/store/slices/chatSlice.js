'use client';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NODE_ENV === "development" ? "http://localhost:3000/api/message" : "/api/message";

axios.defaults.withCredentials = true;

const initialState = {
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  error: null,
  onlineUsers: []
};

// Async thunks
export const getUsers = createAsyncThunk(
  'chat/getUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch users";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const getMessages = createAsyncThunk(
  'chat/getMessages',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${userId}`);
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch messages";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ messageData, selectedUserId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/send/${selectedUserId}`, messageData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to send message";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSelectedUser: (state, action) => {
      console.log('Redux setSelectedUser - Previous user:', state.selectedUser?.id);
      console.log('Redux setSelectedUser - New user:', action.payload?.id);
      state.selectedUser = action.payload;
    },
    addMessage: (state, action) => {
      console.log('Redux addMessage - Current messages count:', state.messages.length);
      console.log('Redux addMessage - Adding message:', action.payload);
      state.messages.push(action.payload);
      console.log('Redux addMessage - New messages count:', state.messages.length);
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearMessages: (state) => {
      console.log('Redux clearMessages - Clearing', state.messages.length, 'messages');
      state.messages = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Users
      .addCase(getUsers.pending, (state) => {
        state.isUsersLoading = true;
        state.error = null;
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        state.isUsersLoading = false;
        state.users = action.payload;
      })
      .addCase(getUsers.rejected, (state, action) => {
        state.isUsersLoading = false;
        state.error = action.payload;
      })
      
      // Get Messages
      .addCase(getMessages.pending, (state) => {
        state.isMessagesLoading = true;
        state.error = null;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.isMessagesLoading = false;
        state.messages = action.payload;
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.isMessagesLoading = false;
        state.error = action.payload;
      })
      
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { 
  setSelectedUser, 
  addMessage, 
  setOnlineUsers, 
  clearError, 
  clearMessages 
} = chatSlice.actions;

export default chatSlice.reducer; 
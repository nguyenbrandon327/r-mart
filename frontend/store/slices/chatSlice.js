'use client';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NODE_ENV === "development" ? "http://localhost:3000/api/message" : "/api/message";

axios.defaults.withCredentials = true;

const initialState = {
  messages: [],
  chats: [],
  selectedChat: null,
  isChatsLoading: false,
  isMessagesLoading: false,
  error: null,
  onlineUsers: [],
  typingUsers: {} // { chatId: [userId1, userId2] }
};

// Async thunks
export const createChat = createAsyncThunk(
  'chat/createChat',
  async ({ otherUserId, productId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/create`, {
        otherUserId,
        productId
      });
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to create chat";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const getChats = createAsyncThunk(
  'chat/getChats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/chats`);
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch chats";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteChat = createAsyncThunk(
  'chat/deleteChat',
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/chat/${chatId}`);
      return { chatId, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to delete chat";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const getMessages = createAsyncThunk(
  'chat/getMessages',
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/chat/${chatId}`);
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
  async ({ messageData, chatId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/chat/${chatId}`, messageData, {
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

export const markMessagesAsSeen = createAsyncThunk(
  'chat/markMessagesAsSeen',
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/chat/${chatId}/seen`);
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to mark messages as seen";
      return rejectWithValue(errorMessage);
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSelectedChat: (state, action) => {
      console.log('Redux setSelectedChat - Previous chat:', state.selectedChat?.id);
      console.log('Redux setSelectedChat - New chat:', action.payload?.id);
      state.selectedChat = action.payload;
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
    setUserTyping: (state, action) => {
      const { userId, chatId, isTyping } = action.payload;
      
      if (!state.typingUsers[chatId]) {
        state.typingUsers[chatId] = [];
      }
      
      if (isTyping) {
        // Add user to typing list if not already there
        if (!state.typingUsers[chatId].includes(userId)) {
          state.typingUsers[chatId].push(userId);
        }
      } else {
        // Remove user from typing list
        state.typingUsers[chatId] = state.typingUsers[chatId].filter(id => id !== userId);
        if (state.typingUsers[chatId].length === 0) {
          delete state.typingUsers[chatId];
        }
      }
    },
    markMessagesAsSeenLocal: (state, action) => {
      const { messageIds } = action.payload;
      state.messages = state.messages.map(message => {
        if (messageIds.includes(message.id)) {
          return { ...message, seen_at: new Date().toISOString() };
        }
        return message;
      });
    },
    clearError: (state) => {
      state.error = null;
    },
    clearMessages: (state) => {
      console.log('Redux clearMessages - Clearing', state.messages.length, 'messages');
      state.messages = [];
    },
    clearTypingUsers: (state) => {
      state.typingUsers = {};
    },
    updateChatLastMessage: (state, action) => {
      const { chatId, message, timestamp } = action.payload;
      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].last_message = message;
        state.chats[chatIndex].last_message_at = timestamp;
        // Move chat to top of list
        const updatedChat = state.chats[chatIndex];
        state.chats.splice(chatIndex, 1);
        state.chats.unshift(updatedChat);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Chat
      .addCase(createChat.pending, (state) => {
        state.error = null;
      })
      .addCase(createChat.fulfilled, (state, action) => {
        // Add new chat to the list if it doesn't exist
        const existingChat = state.chats.find(chat => chat.id === action.payload.id);
        if (!existingChat) {
          // Add basic chat info, will be enriched when getChats is called
          state.chats.unshift(action.payload);
        }
        toast.success("Chat created successfully!");
      })
      .addCase(createChat.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Get Chats
      .addCase(getChats.pending, (state) => {
        state.isChatsLoading = true;
        state.error = null;
      })
      .addCase(getChats.fulfilled, (state, action) => {
        state.isChatsLoading = false;
        state.chats = action.payload;
      })
      .addCase(getChats.rejected, (state, action) => {
        state.isChatsLoading = false;
        state.error = action.payload;
      })

      // Delete Chat
      .addCase(deleteChat.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteChat.fulfilled, (state, action) => {
        state.chats = state.chats.filter(chat => chat.id !== action.payload.chatId);
        if (state.selectedChat?.id === action.payload.chatId) {
          state.selectedChat = null;
          state.messages = [];
        }
        toast.success(action.payload.message);
      })
      .addCase(deleteChat.rejected, (state, action) => {
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
      })

      // Mark Messages as Seen
      .addCase(markMessagesAsSeen.fulfilled, (state, action) => {
        // Update local state to mark messages as seen
        const seenMessageIds = action.payload.map(msg => msg.id);
        state.messages = state.messages.map(message => {
          if (seenMessageIds.includes(message.id)) {
            return { ...message, seen_at: new Date().toISOString() };
          }
          return message;
        });
      });
  }
});

export const { 
  setSelectedChat, 
  addMessage, 
  setOnlineUsers, 
  setUserTyping,
  markMessagesAsSeenLocal,
  clearError, 
  clearMessages,
  clearTypingUsers,
  updateChatLastMessage 
} = chatSlice.actions;

export default chatSlice.reducer; 
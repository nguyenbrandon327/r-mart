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
  typingUsers: {}, // { chatId: [userId1, userId2] }
  unreadCount: 0, // Total number of chats with unread messages
  chatsWithUnreadMessages: [] // Array of chat IDs that have unread messages
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

export const getUnreadCount = createAsyncThunk(
  'chat/getUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/unread-count`);
      return response.data.data; // Returns { unreadCount, chatsWithUnreadMessages }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to get unread count";
      return rejectWithValue(errorMessage);
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSelectedChat: (state, action) => {
      state.selectedChat = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
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
      state.messages = [];
    },
    clearTypingUsers: (state) => {
      state.typingUsers = {};
    },
    updateChatLastMessage: (state, action) => {
      const { chatId, message, timestamp, isFromCurrentUser = false } = action.payload;
      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].last_message = message;
        state.chats[chatIndex].last_message_at = timestamp;
        
        // If message is not from current user, increment unread count
        if (!isFromCurrentUser) {
          state.chats[chatIndex].unread_count = parseInt(state.chats[chatIndex].unread_count || 0) + 1;
          // Add to unread chats if not already there
          if (!state.chatsWithUnreadMessages.includes(chatId)) {
            state.chatsWithUnreadMessages.push(chatId);
            state.unreadCount = state.chatsWithUnreadMessages.length;
          }
        }
        
        // Move chat to top of list
        const updatedChat = state.chats[chatIndex];
        state.chats.splice(chatIndex, 1);
        state.chats.unshift(updatedChat);
      }
    },
    addChatToUnread: (state, action) => {
      const { chatId } = action.payload;
      console.log('🔴 REDUX: addChatToUnread called for chat:', chatId);
      console.log('🔴 REDUX: Current unread chats before:', [...state.chatsWithUnreadMessages]);
      if (!state.chatsWithUnreadMessages.includes(chatId)) {
        state.chatsWithUnreadMessages.push(chatId);
        state.unreadCount = state.chatsWithUnreadMessages.length;
        console.log('🔴 REDUX: Added to unread. New count:', state.unreadCount);
        console.log('🔴 REDUX: New unread chats:', [...state.chatsWithUnreadMessages]);
      } else {
        console.log('🔴 REDUX: Chat already in unread list, no change');
      }
    },
    removeChatFromUnread: (state, action) => {
      const { chatId } = action.payload;
      console.log('🟢 REDUX: removeChatFromUnread called for chat:', chatId);
      console.log('🟢 REDUX: Current unread chats before:', [...state.chatsWithUnreadMessages]);
      const index = state.chatsWithUnreadMessages.indexOf(chatId);
      if (index !== -1) {
        state.chatsWithUnreadMessages.splice(index, 1);
        state.unreadCount = state.chatsWithUnreadMessages.length;
        console.log('🟢 REDUX: Removed from unread. New count:', state.unreadCount);
        console.log('🟢 REDUX: New unread chats:', [...state.chatsWithUnreadMessages]);
      } else {
        console.log('🟢 REDUX: Chat not found in unread list, no change');
      }
      
      // Also reset unread count for the specific chat
      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].unread_count = 0;
      }
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    setChatsWithUnreadMessages: (state, action) => {
      console.log('🟡 REDUX: setChatsWithUnreadMessages called with:', action.payload);
      state.chatsWithUnreadMessages = action.payload;
      state.unreadCount = action.payload.length;
    },
    resetUnreadCount: (state) => {
      console.log('🔵 REDUX: resetUnreadCount called');
      state.unreadCount = 0;
      state.chatsWithUnreadMessages = [];
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
        // Ensure unread_count is a number for all chats
        state.chats = action.payload.map(chat => ({
          ...chat,
          unread_count: parseInt(chat.unread_count || 0)
        }));
        // Update unread state based on chats data
        const chatsWithUnread = state.chats
          .filter(chat => chat.unread_count > 0)
          .map(chat => chat.id);
        state.chatsWithUnreadMessages = chatsWithUnread;
        state.unreadCount = chatsWithUnread.length;
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
        
        // If we're in a chat and messages were seen, remove from unread
        if (state.selectedChat && action.payload.length > 0) {
          const chatId = state.selectedChat.id;
          const index = state.chatsWithUnreadMessages.indexOf(chatId);
          if (index !== -1) {
            state.chatsWithUnreadMessages.splice(index, 1);
            state.unreadCount = state.chatsWithUnreadMessages.length;
          }
          
          // Reset unread count for the specific chat
          const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
          if (chatIndex !== -1) {
            state.chats[chatIndex].unread_count = 0;
          }
        }
      })

      // Get Unread Count
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        console.log('🟠 REDUX: getUnreadCount.fulfilled called with:', action.payload);
        state.unreadCount = action.payload.unreadCount;
        state.chatsWithUnreadMessages = action.payload.chatsWithUnreadMessages;
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
  updateChatLastMessage,
  addChatToUnread,
  removeChatFromUnread,
  setUnreadCount,
  setChatsWithUnreadMessages,
  resetUnreadCount
} = chatSlice.actions;

export default chatSlice.reducer; 
'use client';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NODE_ENV === "development" ? "http://localhost:3000/api/message" : "/api/message";

axios.defaults.withCredentials = true;

const initialState = {
  messages: {}, // Change to object: { chatId: [messages] }
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
      // Don't show toast for unauthorized errors - AuthGuard will handle redirects
      if (error.response?.status !== 401) {
        toast.error(errorMessage);
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteChat = createAsyncThunk(
  'chat/deleteChat',
  async (chatULID, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/chat/${chatULID}`);
      return { chatULID, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to delete chat";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const getMessages = createAsyncThunk(
  'chat/getMessages',
  async (chatULID, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/chat/${chatULID}`);
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch messages";
      // Don't show toast for unauthorized errors - AuthGuard will handle redirects
      if (error.response?.status !== 401) {
        toast.error(errorMessage);
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ messageData, chatULID }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/chat/${chatULID}`, messageData, {
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
  async (chatULID, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/chat/${chatULID}/seen`);
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
      // Don't show toast for unauthorized errors - user may not be logged in
      if (error.response?.status !== 401) {
        toast.error(errorMessage);
      }
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
      const message = action.payload;
      const chatId = message.chat_id;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      state.messages[chatId].push(message);
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
      const { messageIds, chatId } = action.payload;
      if (state.messages[chatId]) {
        state.messages[chatId] = state.messages[chatId].map(message => {
          if (messageIds.includes(message.id)) {
            return { ...message, seen_at: new Date().toISOString() };
          }
          return message;
        });
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    clearMessages: (state) => {
      state.messages = {};
    },
    clearTypingUsers: (state) => {
      state.typingUsers = {};
    },
    updateChatLastMessage: (state, action) => {
      const { chatId, message, timestamp, isFromCurrentUser = false } = action.payload;
      console.log('💬 REDUX: updateChatLastMessage called:', { chatId, message, timestamp, isFromCurrentUser });
      console.log('💬 REDUX: Current chats before update:', state.chats.length);
      
      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1) {
        console.log('💬 REDUX: Found chat at index:', chatIndex);
        state.chats[chatIndex].last_message = message;
        state.chats[chatIndex].last_message_at = timestamp;
        
        // Move chat to top of list
        const updatedChat = state.chats[chatIndex];
        state.chats.splice(chatIndex, 1);
        state.chats.unshift(updatedChat);
        console.log('💬 REDUX: Moved chat to top, new order:', state.chats.map(c => c.id));
      } else {
        console.log('💬 REDUX: Chat not found with ID:', chatId);
      }
    },
    addChatToUnread: (state, action) => {
      const { chatId } = action.payload;
      console.log('🔴 REDUX: addChatToUnread called for chat:', chatId);
      console.log('🔴 REDUX: Current unread chats before:', [...state.chatsWithUnreadMessages]);
      console.log('🔴 REDUX: Current unread count before:', state.unreadCount);
      
      // Find the chat and increment its unread count
      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1) {
        const oldCount = state.chats[chatIndex].unread_count;
        state.chats[chatIndex].unread_count = parseInt(state.chats[chatIndex].unread_count || 0) + 1;
        console.log('🔴 REDUX: Updated chat unread count from', oldCount, 'to', state.chats[chatIndex].unread_count);
      } else {
        console.log('🔴 REDUX: Chat not found for unread update:', chatId);
      }
      
      // Add to global unread list if not already there
      if (!state.chatsWithUnreadMessages.includes(chatId)) {
        state.chatsWithUnreadMessages.push(chatId);
        state.unreadCount = state.chatsWithUnreadMessages.length;
        console.log('🔴 REDUX: Added to unread. New count:', state.unreadCount);
        console.log('🔴 REDUX: New unread chats:', [...state.chatsWithUnreadMessages]);
      } else {
        console.log('🔴 REDUX: Chat already in unread list, but incremented individual count');
      }
      
      console.log('🔴 REDUX: Final state - unreadCount:', state.unreadCount, 'chatsWithUnreadMessages:', [...state.chatsWithUnreadMessages]);
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
        state.chats = state.chats.filter(chat => chat.ulid !== action.payload.chatULID);
        if (state.selectedChat?.ulid === action.payload.chatULID) {
          state.selectedChat = null;
          state.messages = {}; // Clear messages for the deleted chat
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
        // Store messages for the current chat
        if (state.selectedChat) {
          state.messages[state.selectedChat.id] = action.payload;
        }
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
        // Message will be added via socket event (newMessage -> addMessage)
        // This prevents duplicate messages in the UI
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Mark Messages as Seen
      .addCase(markMessagesAsSeen.fulfilled, (state, action) => {
        // Update local state to mark messages as seen
        const seenMessageIds = action.payload.map(msg => msg.id);
        if (state.selectedChat && state.messages[state.selectedChat.id]) {
          state.messages[state.selectedChat.id] = state.messages[state.selectedChat.id].map(message => {
            if (seenMessageIds.includes(message.id)) {
              return { ...message, seen_at: new Date().toISOString() };
            }
            return message;
          });
        }
        
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

// Selector to get messages for a specific chat
export const selectMessagesForChat = (state, chatULID) => {
  // Find the chat by ULID and return its messages using the internal ID
  const chat = state.chat.chats.find(c => c.ulid === chatULID);
  if (!chat) return [];
  return state.chat.messages[chat.id] || [];
};

export default chatSlice.reducer; 
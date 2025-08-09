'use client';

import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  signup as signupAction,
  login as loginAction,
  logout as logoutAction, 
  verifyEmail as verifyEmailAction,
  checkAuth as checkAuthAction,
  forgotPassword as forgotPasswordAction,
  resetPassword as resetPasswordAction,
  resendVerificationCode as resendVerificationCodeAction,
  clearError,
  clearMessage 
} from './slices/authSlice';
import {
  createChat as createChatAction,
  getChats as getChatsAction,
  deleteChat as deleteChatAction,
  getMessages as getMessagesAction,
  sendMessage as sendMessageAction,
  markMessagesAsSeen as markMessagesAsSeenAction,
  getUnreadCount as getUnreadCountAction,
  setSelectedChat,
  addMessage,
  setOnlineUsers,
  setUserTyping,
  markMessagesAsSeenLocal,
  clearError as clearChatError,
  clearMessages,
  clearTypingUsers,
  updateChatLastMessage,
  addChatToUnread,
  removeChatFromUnread,
  setUnreadCount,
  setChatsWithUnreadMessages,
  resetUnreadCount
} from './slices/chatSlice';

export const useAuthStore = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  return {
    // State
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    error: auth.error,
    isLoading: auth.isLoading,
    isCheckingAuth: auth.isCheckingAuth,
    message: auth.message,
    socket: auth.socket,

    // Actions
    signup: async ({ email, password, name, captchaToken }) => {
      return await dispatch(signupAction({ email, password, name, captchaToken }));
    },

    login: async (email, password) => {
      try {
        await dispatch(loginAction({ email, password })).unwrap();
      } catch (error) {
        throw error;
      }
    },

    logout: async () => {
      try {
        await dispatch(logoutAction()).unwrap();
      } catch (error) {
        throw error;
      }
    },

    verifyEmail: async (code) => {
      try {
        const result = await dispatch(verifyEmailAction(code)).unwrap();
        return result;
      } catch (error) {
        throw error;
      }
    },

    checkAuth: async () => {
      try {
        await dispatch(checkAuthAction()).unwrap();
      } catch (error) {
        // Error is handled in the reducer
      }
    },

    forgotPassword: async (email) => {
      try {
        await dispatch(forgotPasswordAction(email)).unwrap();
      } catch (error) {
        throw error;
      }
    },

    resetPassword: async (token, password) => {
      try {
        await dispatch(resetPasswordAction({ token, password })).unwrap();
      } catch (error) {
        throw error;
      }
    },

    resendVerificationCode: async () => {
      try {
        await dispatch(resendVerificationCodeAction()).unwrap();
      } catch (error) {
        throw error;
      }
    },

    clearError: () => dispatch(clearError()),
    clearMessage: () => dispatch(clearMessage())
  };
};

export const useChatStore = () => {
  const dispatch = useDispatch();
  const chat = useSelector((state) => state.chat);
  const auth = useSelector((state) => state.auth);

  return {
    // State (messages removed - now accessed via selector)
    chats: chat.chats,
    selectedChat: chat.selectedChat,
    isChatsLoading: chat.isChatsLoading,
    isMessagesLoading: chat.isMessagesLoading,
    error: chat.error,
    onlineUsers: chat.onlineUsers,
    typingUsers: chat.typingUsers,
    unreadCount: chat.unreadCount,

    // Actions
    createChat: async (otherUserId, productId) => {
      try {
        const result = await dispatch(createChatAction({ otherUserId, productId })).unwrap();
        return result;
      } catch (error) {
        throw error;
      }
    },

    getChats: useCallback(async () => {
      try {
        await dispatch(getChatsAction()).unwrap();
      } catch (error) {
        throw error;
      }
    }, [dispatch]),

    deleteChat: async (chatULID) => {
      try {
        await dispatch(deleteChatAction(chatULID)).unwrap();
      } catch (error) {
        throw error;
      }
    },

    getMessages: useCallback(async (chatULID) => {
      try {
        await dispatch(getMessagesAction(chatULID)).unwrap();
      } catch (error) {
        throw error;
      }
    }, [dispatch]),

    sendMessage: async (messageData, chatULID) => {
      if (!chatULID) {
        throw new Error("No chat selected");
      }
      
      try {
        await dispatch(sendMessageAction({ messageData, chatULID })).unwrap();
      } catch (error) {
        throw error;
      }
    },

    markMessagesAsSeen: useCallback(async (chatULID) => {
      try {
        await dispatch(markMessagesAsSeenAction(chatULID)).unwrap();
      } catch (error) {
        throw error;
      }
    }, [dispatch]),

    getUnreadCount: async () => {
      try {
        await dispatch(getUnreadCountAction()).unwrap();
      } catch (error) {
        throw error;
      }
    },

    emitTyping: (chatId, isTyping) => {
      const socket = auth.socket;
      if (!socket || !socket.connected || !chatId) {
        return;
      }
      
      socket.emit("typing", { chatId, isTyping });
    },

    joinChatRoom: (chatId) => {
      const socket = auth.socket;
      if (!socket || !socket.connected || !chatId) {
        return;
      }
      
      socket.emit("joinChat", chatId);
    },

    leaveChatRoom: (chatId) => {
      const socket = auth.socket;
      if (!socket || !socket.connected || !chatId) {
        return;
      }
      
      socket.emit("leaveChat", chatId);
    },

    subscribeToMessages: () => {
      const socket = auth.socket;
      if (!socket || !socket.connected) {
        return;
      }

      // Only remove messagesSeen listeners to avoid conflicts with global handlers
      socket.removeAllListeners("messagesSeen");

      // Handle messages seen
      const messagesSeenHandler = ({ messageIds, chatId }) => {
        dispatch(markMessagesAsSeenLocal({ messageIds, chatId }));
      };

      // Only set up messagesSeen handler - newMessage and userTyping are handled globally
      socket.on("messagesSeen", messagesSeenHandler);
    },

    unsubscribeFromMessages: () => {
      const socket = auth.socket;
      if (!socket) {
        return;
      }
      // Only remove the messagesSeen listener we set up locally - don't touch global handlers
      socket.removeAllListeners("messagesSeen");
    },

    subscribeToOnlineUsers: () => {
      const socket = auth.socket;
      if (!socket) return;

      socket.on("getOnlineUsers", (onlineUsers) => {
        dispatch(setOnlineUsers(onlineUsers));
      });
    },

    unsubscribeFromOnlineUsers: () => {
      const socket = auth.socket;
      if (!socket) return;
      
      socket.off("getOnlineUsers");
    },

    setSelectedChat: useCallback((chat) => dispatch(setSelectedChat(chat)), [dispatch]),
    clearError: () => dispatch(clearChatError()),
    clearMessages: () => dispatch(clearMessages()),
    clearTypingUsers: () => dispatch(clearTypingUsers()),
    updateChatLastMessage: (chatId, message, timestamp) => dispatch(updateChatLastMessage({ chatId, message, timestamp })),
    addChatToUnread: (chatId) => dispatch(addChatToUnread({ chatId })),
    removeChatFromUnread: useCallback((chatId) => dispatch(removeChatFromUnread({ chatId })), [dispatch]),
    setUnreadCount: (count) => dispatch(setUnreadCount(count)),
    setChatsWithUnreadMessages: (chatIds) => dispatch(setChatsWithUnreadMessages(chatIds)),
    resetUnreadCount: () => dispatch(resetUnreadCount())
  };
}; 
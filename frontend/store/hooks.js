'use client';

import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  signup as signupAction,
  login as loginAction,
  logout as logoutAction, 
  verifyEmail as verifyEmailAction,
  checkAuth as checkAuthAction,
  forgotPassword as forgotPasswordAction,
  resetPassword as resetPasswordAction,
  clearError,
  clearMessage,
  setSocket
} from './slices/authSlice';
import {
  getUsers as getUsersAction,
  getMessages as getMessagesAction,
  sendMessage as sendMessageAction,
  setSelectedUser,
  addMessage,
  setOnlineUsers,
  clearError as clearChatError,
  clearMessages
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
    signup: async (email, password, name) => {
      try {
        await dispatch(signupAction({ email, password, name })).unwrap();
      } catch (error) {
        throw error;
      }
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

    clearError: () => dispatch(clearError()),
    clearMessage: () => dispatch(clearMessage()),

    // Socket methods
    connectSocket: () => {
      if (auth.user && !auth.socket) {
        const socketUrl = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "";
        const socket = io(socketUrl, {
          query: {
            userId: auth.user.id,
          },
        });
        dispatch(setSocket(socket));
      }
    },

    disconnectSocket: () => {
      if (auth.socket) {
        auth.socket.close();
        dispatch(setSocket(null));
      }
    }
  };
};

export const useChatStore = () => {
  const dispatch = useDispatch();
  const chat = useSelector((state) => state.chat);
  const auth = useSelector((state) => state.auth);

  return {
    // State
    messages: chat.messages,
    users: chat.users,
    selectedUser: chat.selectedUser,
    isUsersLoading: chat.isUsersLoading,
    isMessagesLoading: chat.isMessagesLoading,
    error: chat.error,
    onlineUsers: chat.onlineUsers,

    // Actions
    getUsers: async () => {
      try {
        await dispatch(getUsersAction()).unwrap();
      } catch (error) {
        throw error;
      }
    },

    getMessages: async (userId) => {
      try {
        await dispatch(getMessagesAction(userId)).unwrap();
      } catch (error) {
        throw error;
      }
    },

    sendMessage: async (messageData) => {
      if (!chat.selectedUser) return;
      try {
        await dispatch(sendMessageAction({ 
          userId: chat.selectedUser.id, 
          messageData 
        })).unwrap();
      } catch (error) {
        throw error;
      }
    },

    subscribeToMessages: () => {
      if (!chat.selectedUser || !auth.socket) return;

      auth.socket.on("newMessage", (newMessage) => {
        const isPartOfCurrentConversation = 
          (newMessage.sender_id === chat.selectedUser.id && newMessage.receiver_id === auth.user.id) || 
          (newMessage.receiver_id === chat.selectedUser.id && newMessage.sender_id === auth.user.id);
        
        if (!isPartOfCurrentConversation) return;

        dispatch(addMessage(newMessage));
      });
    },

    unsubscribeFromMessages: () => {
      if (!auth.socket) return;
      auth.socket.off("newMessage");
    },

    subscribeToOnlineUsers: () => {
      if (!auth.socket) return;
      
      auth.socket.on("getOnlineUsers", (users) => {
        dispatch(setOnlineUsers(users));
      });
    },

    unsubscribeFromOnlineUsers: () => {
      if (!auth.socket) return;
      auth.socket.off("getOnlineUsers");
    },

    setSelectedUser: (user) => dispatch(setSelectedUser(user)),
    clearError: () => dispatch(clearChatError()),
    clearMessages: () => dispatch(clearMessages())
  };
}; 
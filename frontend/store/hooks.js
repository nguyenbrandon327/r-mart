'use client';

import { useSelector, useDispatch } from 'react-redux';
import { 
  signup as signupAction,
  login as loginAction,
  logout as logoutAction, 
  verifyEmail as verifyEmailAction,
  checkAuth as checkAuthAction,
  forgotPassword as forgotPasswordAction,
  resetPassword as resetPasswordAction,
  clearError,
  clearMessage 
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
    clearMessage: () => dispatch(clearMessage())
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
      const selectedUserId = chat.selectedUser?.id;
      if (!selectedUserId) {
        throw new Error("No user selected");
      }
      
      try {
        await dispatch(sendMessageAction({ messageData, selectedUserId })).unwrap();
      } catch (error) {
        throw error;
      }
    },

    subscribeToMessages: () => {
      if (!chat.selectedUser) {
        console.log('No selected user for subscription');
        return;
      }

      const socket = auth.socket;
      if (!socket || !socket.connected) {
        console.log('Socket not available or not connected for subscription');
        return;
      }

      // Always remove ALL existing listeners first to prevent duplicates
      socket.removeAllListeners("newMessage");

      console.log('Subscribing to messages for user:', chat.selectedUser.id);

      // Create a specific handler function to avoid closure issues
      const messageHandler = (newMessage) => {
        console.log('Received new message:', newMessage);
        // Get current selected user at the time of message receipt
        const currentSelectedUser = chat.selectedUser;
        if (!currentSelectedUser) {
          console.log('No selected user when message received, ignoring');
          return;
        }
        
        // Only add messages from the selected user (incoming messages)
        const isMessageFromSelectedUser = newMessage.sender_id === currentSelectedUser.id;
        if (isMessageFromSelectedUser) {
          console.log('Adding message from selected user to chat');
          dispatch(addMessage(newMessage));
        } else {
          console.log('Message not from selected user, ignoring');
        }
      };

      socket.on("newMessage", messageHandler);
    },

    unsubscribeFromMessages: () => {
      const socket = auth.socket;
      if (!socket) {
        console.log('No socket available for unsubscription');
        return;
      }
      
      console.log('Unsubscribing from messages - removing all listeners');
      socket.removeAllListeners("newMessage");
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

    setSelectedUser: (user) => dispatch(setSelectedUser(user)),
    clearError: () => dispatch(clearChatError()),
    clearMessages: () => dispatch(clearMessages())
  };
}; 
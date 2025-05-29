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
  createChat as createChatAction,
  getChats as getChatsAction,
  deleteChat as deleteChatAction,
  getMessages as getMessagesAction,
  sendMessage as sendMessageAction,
  markMessagesAsSeen as markMessagesAsSeenAction,
  setSelectedChat,
  addMessage,
  setOnlineUsers,
  setUserTyping,
  markMessagesAsSeenLocal,
  clearError as clearChatError,
  clearMessages,
  clearTypingUsers,
  updateChatLastMessage
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
    chats: chat.chats,
    selectedChat: chat.selectedChat,
    isChatsLoading: chat.isChatsLoading,
    isMessagesLoading: chat.isMessagesLoading,
    error: chat.error,
    onlineUsers: chat.onlineUsers,
    typingUsers: chat.typingUsers,

    // Actions
    createChat: async (otherUserId, productId) => {
      try {
        const result = await dispatch(createChatAction({ otherUserId, productId })).unwrap();
        return result;
      } catch (error) {
        throw error;
      }
    },

    getChats: async () => {
      try {
        await dispatch(getChatsAction()).unwrap();
      } catch (error) {
        throw error;
      }
    },

    deleteChat: async (chatId) => {
      try {
        await dispatch(deleteChatAction(chatId)).unwrap();
      } catch (error) {
        throw error;
      }
    },

    getMessages: async (chatId) => {
      try {
        await dispatch(getMessagesAction(chatId)).unwrap();
      } catch (error) {
        throw error;
      }
    },

    sendMessage: async (messageData, chatId) => {
      if (!chatId) {
        throw new Error("No chat selected");
      }
      
      try {
        await dispatch(sendMessageAction({ messageData, chatId })).unwrap();
      } catch (error) {
        throw error;
      }
    },

    markMessagesAsSeen: async (chatId) => {
      try {
        await dispatch(markMessagesAsSeenAction(chatId)).unwrap();
      } catch (error) {
        throw error;
      }
    },

    emitTyping: (chatId, isTyping) => {
      const socket = auth.socket;
      if (!socket || !socket.connected || !chatId) {
        console.log('Cannot emit typing: socket not available or not connected');
        return;
      }
      
      socket.emit("typing", { chatId, isTyping });
    },

    joinChatRoom: (chatId) => {
      const socket = auth.socket;
      if (!socket || !socket.connected || !chatId) {
        console.log('Cannot join chat room: socket not available or not connected');
        return;
      }
      
      socket.emit("joinChat", chatId);
    },

    leaveChatRoom: (chatId) => {
      const socket = auth.socket;
      if (!socket || !socket.connected || !chatId) {
        console.log('Cannot leave chat room: socket not available or not connected');
        return;
      }
      
      socket.emit("leaveChat", chatId);
    },

    subscribeToMessages: () => {
      if (!chat.selectedChat) {
        console.log('No selected chat for subscription');
        return;
      }

      const socket = auth.socket;
      if (!socket || !socket.connected) {
        console.log('Socket not available or not connected for subscription');
        return;
      }

      // Always remove ALL existing listeners first to prevent duplicates
      socket.removeAllListeners("newMessage");
      socket.removeAllListeners("userTyping");
      socket.removeAllListeners("messagesSeen");

      console.log('Subscribing to messages for chat:', chat.selectedChat.id);

      // Handle new messages
      const messageHandler = (newMessage) => {
        console.log('Received new message:', newMessage);
        const currentSelectedChat = chat.selectedChat;
        if (!currentSelectedChat) {
          console.log('No selected chat when message received, ignoring');
          return;
        }
        
        const isMessageForSelectedChat = newMessage.chat_id === currentSelectedChat.id;
        if (isMessageForSelectedChat) {
          console.log('Adding message for selected chat');
          dispatch(addMessage(newMessage));
        } else {
          console.log('Message not for selected chat, ignoring');
        }
      };

      // Handle typing indicators
      const typingHandler = ({ userId, isTyping, chatId }) => {
        const currentSelectedChat = chat.selectedChat;
        if (currentSelectedChat && chatId === currentSelectedChat.id) {
          dispatch(setUserTyping({ userId: userId.toString(), chatId, isTyping }));
        }
      };

      // Handle messages seen
      const messagesSeenHandler = ({ messageIds }) => {
        dispatch(markMessagesAsSeenLocal({ messageIds }));
      };

      socket.on("newMessage", messageHandler);
      socket.on("userTyping", typingHandler);
      socket.on("messagesSeen", messagesSeenHandler);
    },

    unsubscribeFromMessages: () => {
      const socket = auth.socket;
      if (!socket) {
        console.log('No socket available for unsubscription');
        return;
      }
      
      console.log('Unsubscribing from messages - removing all listeners');
      socket.removeAllListeners("newMessage");
      socket.removeAllListeners("userTyping");
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

    setSelectedChat: (chat) => dispatch(setSelectedChat(chat)),
    clearError: () => dispatch(clearChatError()),
    clearMessages: () => dispatch(clearMessages()),
    clearTypingUsers: () => dispatch(clearTypingUsers()),
    updateChatLastMessage: (chatId, message, timestamp) => dispatch(updateChatLastMessage({ chatId, message, timestamp }))
  };
}; 
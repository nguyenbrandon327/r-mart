'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { setSocket } from '../store/slices/authSlice';
import { addMessage, updateChatLastMessage, setOnlineUsers, setUserTyping, addChatToUnread } from '../store/slices/chatSlice';
import toast from 'react-hot-toast';

export const useSocket = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { selectedChat } = useSelector((state) => state.chat);
  const socketRef = useRef(null);
  const isConnectingRef = useRef(false);

  useEffect(() => {
    // Only connect if user is authenticated AND user object exists AND we don't already have a socket
    if (isAuthenticated && user?.id && !socketRef.current && !isConnectingRef.current) {
      isConnectingRef.current = true;
      
      console.log('Initializing socket connection for user:', user.id);
      
      const socket = io(
        process.env.NODE_ENV === "development" ? "http://localhost:3000" : "/",
        {
          query: {
            userId: user.id,
          },
          forceNew: false,
          reconnection: true,
          timeout: 5000,
        }
      );

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        isConnectingRef.current = false;
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        // Only log as error if it's an unexpected disconnect
        if (reason !== 'io client disconnect') {
          console.log('Unexpected disconnect reason:', reason);
        }
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        isConnectingRef.current = false;
      });

      // Remove any existing newMessage listeners to prevent duplicates
      socket.removeAllListeners('newMessage');
      
      // Global message listener for when not on chat pages
      socket.on('newMessage', (newMessage) => {
        console.log('🔔 GLOBAL: New message received:', newMessage);
        console.log('🔔 GLOBAL: Handler call count check - if you see this multiple times for the same message, there are duplicate handlers');
        
        // Always update chat list with new message
        dispatch(updateChatLastMessage({
          chatId: newMessage.chat_id,
          message: newMessage.text || (newMessage.image ? 'Image' : 'Message'),
          timestamp: newMessage.created_at
        }));

        // Check if user is actively viewing the specific chat this message is for
        const currentPath = window.location.pathname;
        const isInSpecificChat = currentPath === `/inbox/${newMessage.chat_id}`;
        const isInChatByState = selectedChat?.id === newMessage.chat_id;
        const isActivelyViewingThisChat = isInSpecificChat || isInChatByState;
        
        console.log('🔔 GLOBAL: Active chat check:', {
          currentPath,
          messageChatId: newMessage.chat_id,
          selectedChatId: selectedChat?.id,
          isInSpecificChat,
          isInChatByState,
          isActivelyViewingThisChat
        });
        
        // Always add message to the messages array for real-time updates
        dispatch(addMessage(newMessage));
        
        if (isActivelyViewingThisChat) {
          console.log('🔔 GLOBAL: User is actively viewing this chat - NOT adding to unread');
          return; // Don't add to unread count
        }

        // User is not actively viewing this chat, add to unread
        console.log('🔔 GLOBAL: User not viewing this chat, adding to unread');
        dispatch(addChatToUnread({ chatId: newMessage.chat_id }));
        toast.success('New message received!', {
          icon: '💬',
          duration: 3000,
        });
      });

      // Online users updates
      socket.on('getOnlineUsers', (users) => {
        dispatch(setOnlineUsers(users));
      });

      // Typing indicators
      socket.on('userTyping', ({ userId, isTyping, chatId }) => {
        dispatch(setUserTyping({ userId, chatId, isTyping }));
      });

      // Messages seen updates
      socket.on('messagesSeen', ({ chatId, seenBy, messageIds }) => {
        // Handle message seen updates
        console.log('Messages seen:', { chatId, seenBy, messageIds });
      });

      socketRef.current = socket;
      dispatch(setSocket(socket));
    }

    // Handle cleanup when user logs out
    if (!isAuthenticated && socketRef.current) {
      console.log('User logged out, cleaning up socket connection');
      socketRef.current.close();
      socketRef.current = null;
      isConnectingRef.current = false;
      dispatch(setSocket(null));
    }

    // Cleanup function
    return () => {
      // Only cleanup if component is actually unmounting, not just re-rendering
      if (!isAuthenticated && socketRef.current) {
        console.log('Cleaning up socket connection');
        socketRef.current.close();
        socketRef.current = null;
        isConnectingRef.current = false;
        dispatch(setSocket(null));
      }
    };
  }, [isAuthenticated, user?.id, dispatch]); // Only depend on user.id, not the entire user object

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log('Component unmounting, closing socket');
        socketRef.current.close();
        socketRef.current = null;
        isConnectingRef.current = false;
      }
    };
  }, []);
}; 
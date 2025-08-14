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
  const socketRef = useRef(null);
  const isConnectingRef = useRef(false);

  useEffect(() => {
    // Only connect if user is authenticated AND user object exists AND we don't already have a socket
    if (isAuthenticated && user?.id && !socketRef.current && !isConnectingRef.current) {
      isConnectingRef.current = true;
      

      
      const socket = io(
        process.env.NODE_ENV === "development" ? "http://localhost:3000" : (process.env.NEXT_PUBLIC_SOCKET_URL || "/"),
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
        isConnectingRef.current = false;
      });

      socket.on('disconnect', (reason) => {
        // Handle disconnect
      });

      socket.on('reconnect', (attemptNumber) => {
        // Handle reconnection
      });

      socket.on('connect_error', (error) => {
        isConnectingRef.current = false;
      });

      // Remove any existing listeners to prevent duplicates
      socket.removeAllListeners('newMessage');
      socket.removeAllListeners('getOnlineUsers');
      socket.removeAllListeners('userTyping');
      socket.removeAllListeners('messagesSeen');
      
      // Optimized global message listener
      socket.on('newMessage', (newMessage) => {
        const messageChatId = parseInt(newMessage.chat_id);
        const isFromCurrentUser = newMessage.sender_id == user.id;
        const currentPath = window.location.pathname;
        const isViewingThisChat = currentPath === `/inbox/${messageChatId}`;
        
        // Always update chat list with new message
        dispatch(updateChatLastMessage({
          chatId: messageChatId,
          message: newMessage.text || (newMessage.image ? 'Image' : 'Message'),
          timestamp: newMessage.created_at,
          isFromCurrentUser
        }));

        // Add message to messages array (backend now prevents duplicates)
        dispatch(addMessage(newMessage));
        
        // Handle unread count and notifications for messages from others
        if (!isFromCurrentUser && !isViewingThisChat) {
          dispatch(addChatToUnread({ chatId: messageChatId }));
        }
      });

      // Online users updates
      socket.on('getOnlineUsers', (users) => {
        dispatch(setOnlineUsers(users));
      });

      // Typing indicators
      socket.on('userTyping', ({ userId, isTyping, chatId }) => {
        dispatch(setUserTyping({ userId: userId.toString(), chatId, isTyping }));
      });

      // Messages seen updates
      socket.on('messagesSeen', ({ chatId, seenBy, messageIds }) => {
        // Handle message seen updates if needed
      });

      socketRef.current = socket;
      dispatch(setSocket(socket));
      

    }

    // Handle cleanup when user logs out
    if (!isAuthenticated && socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      isConnectingRef.current = false;
      dispatch(setSocket(null));
    }

    // Cleanup function
    return () => {
      // Only cleanup if component is actually unmounting, not just re-rendering
      if (!isAuthenticated && socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        isConnectingRef.current = false;
        dispatch(setSocket(null));
      }
    };
  }, [isAuthenticated, user?.id, dispatch]); // Only depend on essential values

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        isConnectingRef.current = false;
      }
    };
  }, []);
}; 
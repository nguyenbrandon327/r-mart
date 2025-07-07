'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { setSocket } from '../store/slices/authSlice';
import { addMessage, updateChatLastMessage, setOnlineUsers, setUserTyping, addChatToUnread } from '../store/slices/chatSlice';
import toast from 'react-hot-toast';

export const useSocket = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
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
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      socket.on('reconnect', () => {
        console.log('Socket reconnected');
      });

      // Global message listener for all new messages
      socket.on('newMessage', (newMessage) => {
        console.log('Global: New message received:', newMessage);
        
        // Update chat list with new message
        dispatch(updateChatLastMessage({
          chatId: newMessage.chat_id,
          message: newMessage.text || (newMessage.image ? 'Image' : 'Message'),
          timestamp: newMessage.created_at
        }));

        // Add to messages if user is in the specific chat
        dispatch(addMessage(newMessage));

        // Show toast notification and add chat to unread if user is not in chat
        const currentPath = window.location.pathname;
        const isInChat = currentPath.includes(`/inbox/${newMessage.chat_id}`);
        
        if (!isInChat) {
          dispatch(addChatToUnread({ chatId: newMessage.chat_id }));
          toast.success('New message received!', {
            icon: '💬',
            duration: 3000,
          });
        }
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

      dispatch(setSocket(socket));

      return () => {
        socket.close();
        dispatch(setSocket(null));
      };
    } else {
      dispatch(setSocket(null));
    }
  }, [isAuthenticated, user, dispatch]);
}; 
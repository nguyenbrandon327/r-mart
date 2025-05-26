'use client';

import { useEffect } from 'react';
import { useAuthStore, useChatStore } from './hooks';

export const useSocket = () => {
  const { user, isAuthenticated, connectSocket, disconnectSocket } = useAuthStore();
  const { 
    subscribeToMessages, 
    unsubscribeFromMessages, 
    subscribeToOnlineUsers, 
    unsubscribeFromOnlineUsers,
    selectedUser,
    getMessages
  } = useChatStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      connectSocket();
      subscribeToOnlineUsers();
      
      // If a chat is already selected, refresh messages when reconnecting
      if (selectedUser) {
        getMessages(selectedUser.id);
      }
    } else {
      disconnectSocket();
    }

    return () => {
      unsubscribeFromMessages();
      unsubscribeFromOnlineUsers();
      disconnectSocket();
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    subscribeToMessages();

    return () => {
      unsubscribeFromMessages();
    };
  }, []);

  return null;
}; 
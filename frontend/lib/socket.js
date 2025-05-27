'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { setSocket } from '../store/slices/authSlice';

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
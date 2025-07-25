'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from '../store/slices/authSlice';
import Navbar from './Navbar';
import SecondaryNavbar from './SecondaryNavbar';
import { useSocket } from '../lib/socket';
import { useChatStore } from '../store/hooks';

export default function NavigationWrapper({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');
  const isLandingPage = pathname?.startsWith('/landing');
  const isProductDetailPage = pathname?.startsWith('/product/');
  const isSavedPage = pathname?.startsWith('/saved');
  const isProfilePage = pathname?.startsWith('/profile');
  const isAddListingPage = pathname?.startsWith('/add-listing');
  const isInboxPage = pathname?.startsWith('/inbox');
  const isChatPage = pathname?.match(/^\/inbox\/\d+$/); // Matches /inbox/[chatId]
  const dispatch = useDispatch();
  const { isAuthenticated, socket } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.chat);
  const { getUnreadCount, setSelectedChat } = useChatStore();

  // Debug logging for socket connection
  useEffect(() => {
    console.log('🔌 NAVIGATION: Socket connection status:', {
      socketExists: !!socket,
      socketConnected: socket?.connected,
      isAuthenticated
    });
  }, [socket?.connected, isAuthenticated]);

  // Debug logging for unread count changes
  useEffect(() => {
    console.log('🔢 NAVIGATION: Unread count changed to:', unreadCount);
  }, [unreadCount]);

  // Initialize socket connection globally
  useSocket();

  useEffect(() => {
    // Check authentication status when the app loads
    dispatch(checkAuth());
  }, [dispatch]);

  // Fetch unread count when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔢 NAVIGATION: User authenticated, fetching unread count');
      getUnreadCount();
    }
  }, [isAuthenticated]); // Removed getUnreadCount to prevent infinite loop

  // Clear selectedChat when not on a specific chat page
  useEffect(() => {
    if (!isChatPage) {
      console.log('🔄 NAVIGATION: Not on chat page, clearing selectedChat');
      setSelectedChat(null);
    }
  }, [pathname, isChatPage, setSelectedChat]);

  return (
    <>
      {!isAuthPage && !isLandingPage && !isAddListingPage && (
        <>
          <Navbar />
          {!isProductDetailPage && !isSavedPage && !isProfilePage && !isInboxPage && <SecondaryNavbar />}
        </>
      )}
      <main className={isAuthPage || isLandingPage || isAddListingPage || isChatPage ? "" : "container mx-auto px-4 py-6"}>
        {children}
      </main>
    </>
  );
} 
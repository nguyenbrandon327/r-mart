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
  const isProductDetailPage = pathname?.startsWith('/product/');
  const isSavedPage = pathname?.startsWith('/saved');
  const isProfilePage = pathname?.startsWith('/profile');
  const isAddListingPage = pathname?.startsWith('/add-listing');
  const isInboxPage = pathname?.startsWith('/inbox');
  const isChatPage = pathname?.match(/^\/inbox\/\d+$/); // Matches /inbox/[chatId]
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { getUnreadCount } = useChatStore();

  // Initialize socket connection globally
  useSocket();

  useEffect(() => {
    // Check authentication status when the app loads
    dispatch(checkAuth());
  }, [dispatch]);

  // Fetch unread count when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      getUnreadCount();
    }
  }, [isAuthenticated, getUnreadCount]);

  return (
    <>
      {!isAuthPage && !isAddListingPage && (
        <>
          <Navbar />
          {!isProductDetailPage && !isSavedPage && !isProfilePage && !isInboxPage && <SecondaryNavbar />}
        </>
      )}
      <main className={isAuthPage || isAddListingPage || isChatPage ? "" : "container mx-auto px-4 py-6"}>
        {children}
      </main>
    </>
  );
} 
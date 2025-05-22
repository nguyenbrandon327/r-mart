'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { checkAuth } from '../store/slices/authSlice';
import Navbar from './Navbar';
import SecondaryNavbar from './SecondaryNavbar';

export default function NavigationWrapper({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');
  const isProductDetailPage = pathname?.startsWith('/product/');
  const dispatch = useDispatch();

  useEffect(() => {
    // Check authentication status when the app loads
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <>
      {!isAuthPage && (
        <>
          <Navbar />
          {!isProductDetailPage && <SecondaryNavbar />}
        </>
      )}
      <main className={isAuthPage ? "" : "container mx-auto px-4 py-6"}>
        {children}
      </main>
    </>
  );
} 
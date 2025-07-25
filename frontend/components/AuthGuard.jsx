'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';

export default function AuthGuard({ children, fallback = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isCheckingAuth } = useSelector((state) => state.auth);

  useEffect(() => {
    // Redirect to login if not authenticated (but only after auth check is complete)
    if (isAuthenticated === false && !isCheckingAuth) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isCheckingAuth, router]);

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center h-screen" data-theme="light">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated (but only after auth check is complete)
  if (isAuthenticated === false) {
    return fallback;
  }

  // User is authenticated, render children
  return children;
} 
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';

export default function OnboardingGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isCheckingAuth } = useSelector((state) => state.auth);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    // Small delay on initial load to ensure state is properly hydrated
    if (initialLoad) {
      const timer = setTimeout(() => {
        setInitialLoad(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [initialLoad]);

  useEffect(() => {
    // Don't do anything while checking auth or during initial load
    if (isCheckingAuth || initialLoad) return;

    // List of paths that don't require onboarding check
    const exemptPaths = [
      '/auth/login',
      '/auth/signup',
      '/auth/verify-email',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/onboarding',
      '/auth/onboarding/welcome'
    ];

    // Check if current path is exempt
    const isExemptPath = exemptPaths.some(path => pathname.startsWith(path));

    // If user is authenticated but not onboarded and not on an exempt path, redirect to onboarding
    if (isAuthenticated && user && !user.isOnboarded && !isExemptPath) {
      console.log('OnboardingGuard: Redirecting to onboarding', { user: user, isOnboarded: user.isOnboarded });
      router.push('/auth/onboarding');
    }
  }, [isAuthenticated, user, pathname, router, isCheckingAuth, initialLoad]);

  return children;
} 
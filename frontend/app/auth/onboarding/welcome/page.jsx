'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function WelcomePage() {
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Small delay to ensure onboarding state is properly updated
    const initialDelay = setTimeout(() => {
      setShouldRedirect(true);
    }, 500);

    return () => clearTimeout(initialDelay);
  }, []);

  useEffect(() => {
    if (!shouldRedirect) return;

    // Navigate to homepage after animation completes
    const timer = setTimeout(() => {
      router.replace('/'); // Use replace to prevent back navigation to welcome
    }, 2500); // 2.5 seconds for the animation

    return () => clearTimeout(timer);
  }, [router, shouldRedirect]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 bg-white z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 text-center">
          Welcome, Highlander
        </h1>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 2 }}
        className="absolute inset-0 bg-white"
      />
    </motion.div>
  );
} 
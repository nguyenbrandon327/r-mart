'use client';

import { Toaster } from 'react-hot-toast';
import Link from 'next/link';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute top-4 left-4 z-10">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2">
            <img 
              src="/logo-pic.png" 
              alt="R'mart Logo" 
              className="size-12 object-contain"
            />
            <span
              className="font-black font-gt-america-expanded tracking-tighter text-2xl 
                bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
            >
              r'mart
            </span>
          </div>
        </Link>
      </div>

      <main className="flex-1 flex justify-center items-center">
        {children}
      </main>
      <Toaster />
    </div>
  );
} 
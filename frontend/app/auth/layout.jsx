'use client';

import { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { ShoppingCartIcon } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute top-4 left-4 z-10">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-2">
            <ShoppingCartIcon className="size-9 text-primary" />
            <span
              className="font-semibold font-mono tracking-widest text-2xl 
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
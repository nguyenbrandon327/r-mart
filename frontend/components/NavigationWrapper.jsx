'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import SecondaryNavbar from './SecondaryNavbar';

export default function NavigationWrapper({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');

  return (
    <>
      {!isAuthPage && (
        <>
          <Navbar />
          <SecondaryNavbar />
        </>
      )}
      <main className={isAuthPage ? "" : "container mx-auto px-4 py-6"}>
        {children}
      </main>
    </>
  );
} 
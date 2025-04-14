import './globals.css';
import { Providers } from '../store/provider';
import { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import SecondaryNavbar from '../components/SecondaryNavbar';

export const metadata = {
  title: 'R-Mart',
  description: 'R-Mart Shopping Application',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <Providers>
          <Navbar />
          <SecondaryNavbar />
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
} 
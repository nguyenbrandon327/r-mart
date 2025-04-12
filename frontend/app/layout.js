import './globals.css';
import { Providers } from '../store/provider';
import { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';

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
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
} 
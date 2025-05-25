import './globals.css';
import { Providers } from '../store/provider';
import { Toaster } from 'react-hot-toast';
import NavigationWrapper from '../components/NavigationWrapper';

export const metadata = {
  title: 'R-Mart',
  description: 'R-Mart Shopping Application',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-gt-america">
        <Providers>
          <NavigationWrapper>
            {children}
          </NavigationWrapper>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
} 
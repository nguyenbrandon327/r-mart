import './globals.css';
import { Providers } from '../store/provider';
import { Toaster } from 'react-hot-toast';
import NavigationWrapper from '../components/NavigationWrapper';
import OnboardingGuard from '../components/OnboardingGuard';

export const metadata = {
  title: 'R\'Mart',
  description: 'R-Mart Shopping Application',
  icons: {
    icon: '/logo-icon.png',
    shortcut: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-gt-america min-h-screen flex flex-col">
        <Providers>
          <OnboardingGuard>
            <NavigationWrapper>
              {children}
            </NavigationWrapper>
          </OnboardingGuard>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
} 
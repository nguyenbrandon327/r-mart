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
      <body>
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
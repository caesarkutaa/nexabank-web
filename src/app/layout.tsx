import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import SiteFooter from '../components/Sitefooter';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title:       { default: 'NexaBank', template: '%s | NexaBank' },
  description: 'Professional USA Banking — Secure, Fast, Reliable',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              background:   '#111826',
              border:       '1px solid rgba(255,255,255,0.1)',
              color:        '#e2e8f0',
              borderRadius: '12px',
            },
          }} 
        />
        <SiteFooter/>
      </body>
    </html>
  );
}
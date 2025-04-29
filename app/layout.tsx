import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
      title: 'Time Tracker',
      description: 'Track your time with ease',
      generator: 'v0.dev',
};

export default function RootLayout({
      children,
}: Readonly<{
      children: React.ReactNode;
}>) {
      return (
            <html lang="en" suppressHydrationWarning>
                  <body className={inter.className} cz-shortcut-listen="true">
                        <link rel="icon" href="/favicon.ico" sizes="any" />
                        <ThemeProvider
                              attribute="class"
                              defaultTheme="dark"
                              enableSystem={false}
                              disableTransitionOnChange
                        >
                              {children}
                              <Toaster />
                        </ThemeProvider>
                  </body>
            </html>
      );
}

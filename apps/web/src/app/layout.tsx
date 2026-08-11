import type { Metadata } from 'next';
import Script from 'next/script';

import './globals.css';
import { Providers } from './providers';
import { bodyFont } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'SkillForge',
  description: 'AI-powered interactive learning platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="skillforge-theme-init" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var storageKey = 'skillforge-theme';
                var stored = window.localStorage.getItem(storageKey);
                var theme = stored === 'dark' || stored === 'light'
                  ? stored
                  : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                var root = document.documentElement;
                root.dataset.theme = theme;
                root.classList.toggle('dark', theme === 'dark');
              } catch (error) {}
            })();
          `}
        </Script>
      </head>
      <body className={bodyFont.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

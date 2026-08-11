import { Manrope, Sora } from 'next/font/google';

export const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

export const headingFont = Sora({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['600', '700', '800'],
  display: 'swap',
  fallback: ['Inter', 'system-ui', 'sans-serif'],
});

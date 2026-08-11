'use client';

import { Moon, SunMedium } from 'lucide-react';

import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { mounted, theme, toggleTheme } = useTheme();
  const nextTheme = mounted ? (theme === 'dark' ? 'light' : 'dark') : 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={mounted ? `Switch to ${nextTheme} mode` : 'Toggle theme'}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 text-[var(--site-text)] shadow-[0_12px_24px_var(--site-shadow)] transition hover:bg-[var(--site-surface-alt)]"
    >
      {mounted && theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden text-sm font-semibold sm:inline">
        {mounted ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : 'Theme'}
      </span>
    </button>
  );
}

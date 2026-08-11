'use client';

import * as React from 'react';

export type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  theme: ThemeMode;
  mounted: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = 'skillforge-theme';

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === 'dark');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ThemeMode>('light');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const stored =
      typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    const resolved = stored === 'dark' || stored === 'light' ? stored : getSystemTheme();
    setThemeState(resolved);
    applyTheme(resolved);
    setMounted(true);
  }, []);

  const setTheme = React.useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    applyTheme(nextTheme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  const value = React.useMemo(
    () => ({
      theme,
      mounted,
      setTheme,
      toggleTheme,
    }),
    [mounted, setTheme, theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

/**
 * Custom hook to manage Sift's dark/light editorial theme.
 * Why: Synchronizes theme state between React component tree, HTML root class,
 * and localStorage without flash of incorrect theme.
 */
export function useTheme(): {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
} {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('sift-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    // Default to dark theme per editorial aesthetic
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('sift-theme', theme);
  }, [theme]);

  const toggleTheme = (): void => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: Theme): void => {
    setThemeState(newTheme);
  };

  return { theme, toggleTheme, setTheme };
}

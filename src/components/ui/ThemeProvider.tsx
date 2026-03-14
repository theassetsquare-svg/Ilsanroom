'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';

type Theme = 'dark' | 'light' | 'auto';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'auto',
  resolvedTheme: 'dark',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function getAutoTheme(): 'dark' | 'light' {
  const hour = new Date().getHours();
  // 22시~06시 다크, 나머지 라이트
  return hour >= 22 || hour < 6 ? 'dark' : 'light';
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('auto');
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((resolved: 'dark' | 'light') => {
    setResolvedTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved;
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem('theme', t);
    if (t === 'auto') {
      applyTheme(getAutoTheme());
    } else {
      applyTheme(t);
    }
  }, [applyTheme]);

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem('theme') as Theme) || 'auto';
    setThemeState(saved);
    if (saved === 'auto') {
      applyTheme(getAutoTheme());
    } else {
      applyTheme(saved);
    }
  }, [applyTheme]);

  // Auto theme: check every minute
  useEffect(() => {
    if (theme !== 'auto') return;
    const interval = setInterval(() => {
      applyTheme(getAutoTheme());
    }, 60000);
    return () => clearInterval(interval);
  }, [theme, applyTheme]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

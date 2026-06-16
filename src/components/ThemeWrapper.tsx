'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';

const ThemeContext = createContext<{
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}>({
  isDarkMode: false,
  toggleDarkMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Sync React state with whatever the inline <script> already applied
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isCurrentlyDark);

    // Watch for external changes (inline script, other tabs, etc.)
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    const nextDark = !html.classList.contains('dark');
    if (nextDark) {
      html.classList.add('dark');
      localStorage.setItem('aud_theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('aud_theme', 'light');
    }
    // State update happens automatically via the MutationObserver
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

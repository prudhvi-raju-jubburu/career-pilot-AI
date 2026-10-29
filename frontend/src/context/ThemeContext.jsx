import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';

export const THEMES = [
  { id: 'light', name: 'Mavens-i Light', description: 'Clean enterprise white with royal blue & orange accents' },
  { id: 'dark', name: 'Mavens-i Deep Navy', description: 'Deep space royal navy with luminous accents' },
];

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  isDark: false,
  themes: THEMES,
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('careerpilot_theme_v2');
      if (saved) return saved === 'dark' ? 'dark' : 'light';
      // Clear legacy dark theme from previous versions
      localStorage.setItem('careerpilot_theme_v2', 'light');
      localStorage.setItem('careerpilot_theme', 'light');
      return 'light';
    } catch {
      return 'light';
    }
  });

  const isDark = theme === 'dark';

  const applyThemeToDOM = useCallback((currentTheme) => {
    const root = document.documentElement;
    root.setAttribute('data-theme', currentTheme);
    root.classList.remove('theme-cyberpunk', 'theme-dark', 'theme-emerald');
    root.classList.add(`theme-${currentTheme}`);
    try {
      localStorage.setItem('careerpilot_theme_v2', currentTheme);
      localStorage.setItem('careerpilot_theme', currentTheme);
    } catch {}
  }, []);

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme, applyThemeToDOM]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme === 'dark' ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        toggleTheme, 
        setTheme, 
        isDark,
        themes: THEMES
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;

import React, { createContext, useContext, useEffect, useCallback } from 'react';

export const THEMES = [
  { id: 'cyberpunk', name: 'Neon Hyperdrive', description: 'Ultra-vibrant violet & hot cyan' },
];

const ThemeContext = createContext({
  theme: 'cyberpunk',
  toggleTheme: () => {},
  setTheme: () => {},
  isDark: true,
  themes: THEMES,
});

export function ThemeProvider({ children }) {
  const theme = 'cyberpunk';

  const applyThemeToDOM = useCallback(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'cyberpunk');
    root.classList.remove('theme-dark', 'theme-light', 'theme-emerald');
    root.classList.add('theme-cyberpunk');
    try {
      localStorage.setItem('careerpilot_theme', 'cyberpunk');
    } catch {}
  }, []);

  useEffect(() => {
    applyThemeToDOM();
  }, [applyThemeToDOM]);

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        toggleTheme: () => {}, 
        setTheme: () => {}, 
        isDark: true,
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

import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();
const STORAGE_KEY = 'collaborate-theme';

export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    html.dataset.theme = 'light';
    html.classList.remove('dark-theme');
    html.classList.add('light-theme');
    body.classList.remove('dark-theme');
    body.classList.add('light-theme');
    window.localStorage.setItem(STORAGE_KEY, 'light');
  }, []);

  const toggleTheme = () => {};
  const setTheme = () => {};

  return (
    <ThemeContext.Provider
      value={{
        theme: 'light',
        toggleTheme,
        setTheme,
        isDark: false,
        isLight: true,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;


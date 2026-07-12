import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();
const STORAGE_KEY = 'collaborate-theme';

const getInitialTheme = () => {
  return 'light';
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    html.dataset.theme = 'light';
    html.classList.add('light-theme');
    html.classList.remove('dark-theme');
    body.classList.add('light-theme');
    body.classList.remove('dark-theme');
    window.localStorage.setItem(STORAGE_KEY, 'light');
  }, []);

  const toggleTheme = () => {
    // No-op: Dark theme is completely removed
  };

  const setSpecificTheme = (nextTheme) => {
    // No-op
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme: setSpecificTheme,
        isDark: false,
        isLight: true,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;

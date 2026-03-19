import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the Theme Context
const ThemeContext = createContext();

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to 'dark'
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('collaborate-theme');
    return storedTheme || 'dark';
  });

  // Effect to apply theme class to body and persist preference
  useEffect(() => {
    const root = document.body;
    
    // Remove existing theme classes
    root.classList.remove('light-theme', 'dark-theme');
    
    // Apply the current theme class
    if (theme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.add('dark-theme');
    }
    
    // Persist to localStorage
    localStorage.setItem('collaborate-theme', theme);
  }, [theme]);

  // Toggle function to switch between themes
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  // Set a specific theme
  const setSpecificTheme = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setTheme(newTheme);
    }
  };

  const value = {
    theme,
    toggleTheme,
    setTheme: setSpecificTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the Theme Context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

const iconVariants = {
  initial: { opacity: 0, scale: 0.7, rotate: -30 },
  animate: { opacity: 1, scale: 1, rotate: 0 },
  exit: { opacity: 0, scale: 0.7, rotate: 30 },
};

const ThemeToggle = ({ collapsed = false }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle ${collapsed ? 'collapsed' : ''} ${isDark ? 'is-dark' : 'is-light'}`}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.span
        className="theme-toggle-track"
        layout
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      >
        <motion.span
          className="theme-toggle-thumb"
          layout
          transition={{ type: 'spring', stiffness: 340, damping: 24 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isDark ? 'moon' : 'sun'}
              className="theme-toggle-thumb-icon"
              variants={iconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.18 }}
            >
              {isDark ? <FaMoon size={12} /> : <FaSun size={12} />}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </motion.span>
      {!collapsed && (
        <span className="theme-toggle-copy">
          <strong>{isDark ? 'Dark mode' : 'Light mode'}</strong>
          <span>{isDark ? 'Midnight glass' : 'Warm daylight'}</span>
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;

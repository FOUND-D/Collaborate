import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = ({ collapsed = false }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle-simple ${isDark ? 'is-dark' : 'is-light'}`}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? 'moon' : 'sun'}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.2 }}
          className="theme-toggle-icon-container"
        >
          {isDark ? <FaSun size={18} /> : <FaMoon size={18} />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
};

export default ThemeToggle;

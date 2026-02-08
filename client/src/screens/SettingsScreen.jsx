import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon, FaPalette } from 'react-icons/fa';

const SettingsScreen = () => {
    const { theme, toggleTheme, isDark } = useTheme();

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)' }}>
            <h1 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Settings</h1>

            <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-large)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <FaPalette /> Appearance
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h4 style={{ margin: 0 }}>Theme Preference</h4>
                        <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Switch between Light and Dark mode.
                        </p>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {isDark ? <FaSun /> : <FaMoon />}
                        {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsScreen;

import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
    FaPalette,
    FaUserCog,
    FaBell,
    FaShieldAlt,
    FaChevronRight,
    FaMoon,
    FaSun,
    FaToggleOn,
    FaToggleOff
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './SettingsScreen.css';

const SettingsScreen = () => {
    const { theme, toggleTheme, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState('appearance');

    // Mock State for interactivity
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [pushNotifs, setPushNotifs] = useState(false);
    const [twoFactor, setTwoFactor] = useState(false);

    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="animate-fade-in-up">
                        <h2 className="section-title">General Settings</h2>
                        <p className="section-desc">Manage your personal account details.</p>

                        <div className="setting-card mt-6">
                            <div className="setting-row">
                                <div className="setting-info">
                                    <h4>Profile Information</h4>
                                    <p>Update your photo and personal details.</p>
                                </div>
                                <Link to="/profile" className="btn-secondary">
                                    Edit Profile
                                </Link>
                            </div>

                            <div className="setting-row">
                                <div className="setting-info">
                                    <h4>Language</h4>
                                    <p>Select your interface language.</p>
                                </div>
                                <select className="form-select bg-gray-800 border-gray-700 text-white rounded p-2">
                                    <option>English (US)</option>
                                    <option>Spanish</option>
                                    <option>French</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case 'notifications':
                return (
                    <div className="animate-fade-in-up">
                        <h2 className="section-title">Notifications</h2>
                        <p className="section-desc">Choose how you want to be notified.</p>

                        <div className="setting-row">
                            <div className="setting-info">
                                <h4>Email Notifications</h4>
                                <p>Receive daily summaries and critical alerts.</p>
                            </div>
                            <div
                                className={`toggle-switch ${emailNotifs ? 'active' : ''}`}
                                onClick={() => setEmailNotifs(!emailNotifs)}
                            >
                                <div className="toggle-thumb" />
                            </div>
                        </div>

                        <div className="setting-row">
                            <div className="setting-info">
                                <h4>Push Notifications</h4>
                                <p>Get real-time updates on your desktop.</p>
                            </div>
                            <div
                                className={`toggle-switch ${pushNotifs ? 'active' : ''}`}
                                onClick={() => setPushNotifs(!pushNotifs)}
                            >
                                <div className="toggle-thumb" />
                            </div>
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="animate-fade-in-up">
                        <h2 className="section-title">Security & Privacy</h2>
                        <p className="section-desc">Keep your account secure.</p>

                        <div className="setting-row">
                            <div className="setting-info">
                                <h4>Two-Factor Authentication <span className="badge-pro">Pro</span></h4>
                                <p>Add an extra layer of security to your account.</p>
                            </div>
                            <div
                                className={`toggle-switch ${twoFactor ? 'active' : ''}`}
                                onClick={() => setTwoFactor(!twoFactor)}
                            >
                                <div className="toggle-thumb" />
                            </div>
                        </div>

                        <div className="setting-row">
                            <div className="setting-info">
                                <h4>Change Password</h4>
                                <p>Update your password regularly to stay safe.</p>
                            </div>
                            <button className="btn-secondary">Update</button>
                        </div>
                    </div>
                );

            case 'appearance':
            default:
                return (
                    <div className="animate-fade-in-up">
                        <h2 className="section-title">Appearance</h2>
                        <p className="section-desc">Customize how Collaborate looks on your device.</p>

                        <div className="setting-row">
                            <div className="setting-info">
                                <h4>Theme Preference</h4>
                                <p>Switch between Light and Dark mode.</p>
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
                );
        }
    };

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1 className="settings-title">Control Center</h1>
                <p className="settings-subtitle">Manage your account settings and preferences.</p>
            </div>

            <div className="settings-layout">
                {/* Sidebar */}
                <div className="settings-sidebar">
                    <button
                        className={`settings-nav-item ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <FaUserCog /> General
                    </button>

                    <button
                        className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('appearance')}
                    >
                        <FaPalette /> Appearance
                    </button>

                    <button
                        className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notifications')}
                    >
                        <FaBell /> Notifications
                    </button>

                    <button
                        className={`settings-nav-item ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        <FaShieldAlt /> Security
                    </button>
                </div>

                {/* Main Content */}
                <div className="settings-content">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default SettingsScreen;

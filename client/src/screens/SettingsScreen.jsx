import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import {
    FaPalette,
    FaUser,
    FaBell,
    FaLock,
    FaCamera,
    FaGlobe,
    FaCalendarAlt,
    FaExclamationTriangle,
    FaSun,
    FaMoon,
    FaSave
} from 'react-icons/fa';
import { updateUserProfile } from '../actions/userActions';
import './SettingsScreen.css';

const SettingsScreen = () => {
    const dispatch = useDispatch();
    const { toggleTheme, isDark } = useTheme();
    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const [activeTab, setActiveTab] = useState('profile');
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Form States
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [timezone, setTimezone] = useState('UTC');
    
    const [department, setDepartment] = useState('');
    const [yearOfStudy, setYearOfStudy] = useState('');
    const [university, setUniversity] = useState('');
    const [studentId, setStudentId] = useState('');

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (userInfo) {
            const names = userInfo.name ? userInfo.name.split(' ') : ['', ''];
            setFirstName(names[0] || '');
            setLastName(names.slice(1).join(' ') || '');
            setEmail(userInfo.email || '');
            setDepartment(userInfo.department || '');
            setYearOfStudy(userInfo.yearOfStudy ? String(userInfo.yearOfStudy) : '');
            setStudentId(userInfo.studentId || '');
        }
    }, [userInfo]);

    const handleProfileUpdate = (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');
        
        const updatedData = {
            id: userInfo._id,
            name: `${firstName} ${lastName}`.trim(),
            email,
            department,
            yearOfStudy: yearOfStudy ? Number(yearOfStudy) : null,
            studentId,
        };

        dispatch(updateUserProfile(updatedData))
            .then(() => {
                setSuccessMsg('Profile updated successfully');
                setTimeout(() => setSuccessMsg(''), 3000);
            })
            .catch((err) => {
                setErrorMsg(err.message || 'Update failed');
            });
    };

    const handlePasswordUpdate = (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');

        if (newPassword !== confirmPassword) {
            setErrorMsg('New passwords do not match');
            return;
        }

        // Using existing profile update endpoint as specified
        dispatch(updateUserProfile({ id: userInfo._id, password: newPassword }))
            .then(() => {
                setSuccessMsg('Password updated successfully');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => setSuccessMsg(''), 3000);
            })
            .catch((err) => {
                setErrorMsg(err.message || 'Password update failed');
            });
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <div className="tab-content animate-fade-in">
                        <div className="settings-section">
                            <h3 className="section-title">Profile Photo</h3>
                            <div className="profile-photo-upload">
                                <div className="avatar-circle">
                                    {userInfo?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="upload-controls">
                                    <button className="btn-upload"><FaCamera /> Upload Photo</button>
                                    <p className="help-text">JPG, PNG or GIF. Max size 2MB.</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleProfileUpdate}>
                            <div className="settings-section">
                                <h3 className="section-title">Personal Information</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>First Name</label>
                                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name</label>
                                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Bio</label>
                                        <textarea rows="4" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Write a short bio..."></textarea>
                                    </div>
                                    <div className="form-group">
                                        <label>Location</label>
                                        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
                                    </div>
                                    <div className="form-group">
                                        <label>Timezone</label>
                                        <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                                            <option value="UTC">UTC</option>
                                            <option value="EST">EST</option>
                                            <option value="PST">PST</option>
                                            <option value="IST">IST</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="settings-section">
                                <h3 className="section-title">Professional Details</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Department</label>
                                        <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Year of Study</label>
                                        <input type="text" value={yearOfStudy} onChange={(e) => setYearOfStudy(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Role</label>
                                        <div className="readonly-input">
                                            <input type="text" value={userInfo?.role || ''} readOnly />
                                            <FaLock className="lock-icon" />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>University</label>
                                        <input type="text" value={university} onChange={(e) => setUniversity(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Student ID</label>
                                        <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn-save"><FaSave /> Save Changes</button>
                            </div>
                        </form>
                    </div>
                );

            case 'account':
                return (
                    <div className="tab-content animate-fade-in">
                        <form onSubmit={handlePasswordUpdate}>
                            <div className="settings-section card">
                                <h3 className="section-title">Password Settings</h3>
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                </div>
                                <button type="submit" className="btn-primary mt-4">Update Password</button>
                            </div>
                        </form>

                        <div className="settings-section card danger-zone">
                            <h3 className="section-title text-danger">Danger Zone</h3>
                            <p className="text-secondary mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                            <button className="btn-danger-outline">Delete Account</button>
                            <p className="danger-help mt-2"><FaExclamationTriangle /> This action cannot be undone</p>
                        </div>
                    </div>
                );

            case 'preferences':
                return (
                    <div className="tab-content animate-fade-in">
                        <div className="settings-section card">
                            <h3 className="section-title">Appearance</h3>
                            <p className="section-desc mb-4">Customize how Collaborate looks on your device.</p>
                            <div className="setting-row">
                                <div className="setting-info">
                                    <h4>Theme Preference</h4>
                                    <p>Switch between Light and Dark mode.</p>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className="btn-theme-toggle"
                                >
                                    {isDark ? <FaSun /> : <FaMoon />}
                                    {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                </button>
                            </div>
                        </div>

                        <div className="settings-section card mt-6">
                            <h3 className="section-title">Language & Regional</h3>
                            <div className="form-grid mt-4">
                                <div className="form-group">
                                    <label><FaGlobe /> Language</label>
                                    <select>
                                        <option>English</option>
                                        <option>Spanish</option>
                                        <option>French</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label><FaCalendarAlt /> Date Format</label>
                                    <select>
                                        <option>MM/DD/YYYY</option>
                                        <option>DD/MM/YYYY</option>
                                        <option>YYYY-MM-DD</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'notifications':
                return (
                    <div className="tab-content animate-fade-in">
                        <div className="settings-section card placeholder-card">
                            <FaBell className="placeholder-icon" />
                            <h3>Notifications coming soon</h3>
                            <p>We're working on a robust notification system to keep you updated.</p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1 className="settings-title">Settings</h1>
                <p className="settings-subtitle">Manage your profile, account preferences, and notifications.</p>
            </div>

            {successMsg && <div className="toast success">{successMsg}</div>}
            {errorMsg && <div className="toast error">{errorMsg}</div>}

            <div className="settings-container">
                <div className="settings-tabs">
                    <button 
                        className={`tab-item ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <FaUser /> Profile
                    </button>
                    <button 
                        className={`tab-item ${activeTab === 'account' ? 'active' : ''}`}
                        onClick={() => setActiveTab('account')}
                    >
                        <FaLock /> Account
                    </button>
                    <button 
                        className={`tab-item ${activeTab === 'preferences' ? 'active' : ''}`}
                        onClick={() => setActiveTab('preferences')}
                    >
                        <FaPalette /> Preferences
                    </button>
                    <button 
                        className={`tab-item ${activeTab === 'notifications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notifications')}
                    >
                        <FaBell /> Notifications
                    </button>
                </div>

                <div className="settings-main">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default SettingsScreen;

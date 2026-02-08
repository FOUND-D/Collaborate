import React, { useState } from 'react';
import './Sidebar.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../actions/userActions';
import { FaBars, FaTimes, FaTachometerAlt, FaFolder, FaUsers, FaTasks, FaCog, FaSignOutAlt, FaComments, FaSun, FaMoon } from 'react-icons/fa';
import UserGuideModal from './UserGuideModal';
import { HARDCODED_BACKEND_URL } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ isSidebarOpen, toggleSidebar, toggleChat }) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const logoutHandler = () => {
    dispatch(logout());
    navigate('/login');
  };

  // The NavLink `className` prop can accept a function to conditionally apply classes.
  const getNavLinkClass = ({ isActive }) => {
    return isActive ? 'nav-item active' : 'nav-item';
  };

  return (
    <>
      <UserGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <div className={`sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <div className="header-left">
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            {isSidebarOpen && <h2 className="app-title">Collaborate</h2>}
          </div>
          {isSidebarOpen && (
            <button className="user-guide-btn-header" onClick={() => setIsGuideOpen(true)} title="User Guide">
              <img src="/user-guide-book-blue.png" alt="User Guide" className="user-guide-icon-img" />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={getNavLinkClass}>
            <FaTachometerAlt />
            <span className="nav-text">Dashboard</span>
            {!isSidebarOpen && <span className="tooltip">Dashboard</span>}
          </NavLink>
          <NavLink to="/projects/ongoing" className={getNavLinkClass}>
            <FaFolder />
            <span className="nav-text">Projects</span>
            {!isSidebarOpen && <span className="tooltip">Projects</span>}
          </NavLink>
          <NavLink to="/teams" className={getNavLinkClass}>
            <FaUsers />
            <span className="nav-text">Teams</span>
            {!isSidebarOpen && <span className="tooltip">Teams</span>}
          </NavLink>
          <NavLink to="/tasks" className={getNavLinkClass}>
            <FaTasks />
            <span className="nav-text">Tasks</span>
            {!isSidebarOpen && <span className="tooltip">Tasks</span>}
          </NavLink>
          <button className="nav-item" onClick={toggleChat}>
            <FaComments />
            <span className="nav-text">Chat</span>
            {!isSidebarOpen && <span className="tooltip">Chat</span>}
          </button>
          <NavLink to="/settings" className={getNavLinkClass}>
            <FaCog />
            <span className="nav-text">Settings</span>
            {!isSidebarOpen && <span className="tooltip">Settings</span>}
          </NavLink>
        </nav>

        {userInfo && (
          <div className="sidebar-footer">
            <NavLink to="/profile" className="user-profile-link" title="Profile">
              <div className="user-avatar">
                {userInfo.profileImage ? (
                  <img
                    src={
                      userInfo.profileImage.startsWith('data:image')
                        ? userInfo.profileImage
                        : `${HARDCODED_BACKEND_URL}${userInfo.profileImage}`
                    }
                    alt={userInfo.name}
                  />
                ) : (
                  userInfo.name.charAt(0).toUpperCase()
                )}
              </div>
              {isSidebarOpen && <span className="user-name">{userInfo.name}</span>}
            </NavLink>
            <button className="logout-button" onClick={logoutHandler} title="Logout">
              <FaSignOutAlt />
              {isSidebarOpen && <span className="logout-text">Logout</span>}
            </button>
            <button
              className="theme-toggle-button"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <FaSun className="theme-icon sun" /> : <FaMoon className="theme-icon moon" />}
              {isSidebarOpen && <span className="theme-text">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
              {!isSidebarOpen && <span className="tooltip">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;

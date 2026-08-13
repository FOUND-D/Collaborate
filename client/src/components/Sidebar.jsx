import React, { useState } from 'react';
import './Sidebar.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../actions/userActions';
import {
  FaTachometerAlt,
  FaFolder,
  FaUsers,
  FaTasks,
  FaCog,
  FaSignOutAlt,
  FaBook,
  FaBuilding,
  FaExchangeAlt,
  FaVideo,
  FaFolderOpen,
  FaMedal,
  FaShieldAlt,
  FaBrain,
  FaStar,
  FaFlag,
  FaPlus,
} from 'react-icons/fa';
import UserGuideModal from './UserGuideModal';
import OrgSwitcher from './OrgSwitcher';
import { BACKEND_URL } from '../config/runtime';

const Sidebar = ({ isCollapsed, toggleSidebar, toggleChat, isMobile }) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const collapsed = isCollapsed && !isMobile;
  const firstName = userInfo?.name?.split(' ')[0] || 'there';

  const logoutHandler = () => {
    dispatch(logout());
    navigate('/', { replace: true });
  };

  const getNavLinkClass = ({ isActive }) => (isActive ? 'nav-item active' : 'nav-item');

  const sidebarStyle = {
    width: isMobile ? '280px' : (isCollapsed ? '64px' : '280px'),
    transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: isMobile ? 50 : 100,
    transform: (isMobile && isCollapsed) ? 'translateX(-100%)' : 'translateX(0)',
  };

  const labelStyle = {
    opacity: collapsed ? 0 : 1,
    width: collapsed ? 0 : 'auto',
    overflow: 'hidden',
    transition: 'opacity 200ms ease, width 200ms ease',
    whiteSpace: 'nowrap',
    display: 'inline-block',
  };

  const navItemStyle = {
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: collapsed ? '0px' : '12px',
  };

  const avatarSrc = userInfo?.profileImage
    ? (userInfo.profileImage.startsWith('data:image') ? userInfo.profileImage : `${BACKEND_URL}${userInfo.profileImage}`)
    : null;

  return (
    <>
      <UserGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <div className={`sidebar ${!isCollapsed ? 'sidebar-open' : 'sidebar-closed'}`} style={sidebarStyle}>
        <div
          className="sidebar-header"
          style={{
            padding: collapsed ? '0' : '0 16px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <div className="sidebar-brand-block">
            <div className="sidebar-logo-row" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <div className="sidebar-logo-icon">
                <span className="sidebar-logo-mark">C</span>
              </div>
              <span className="sidebar-logo-text" style={labelStyle}>Collaborate</span>
            </div>
          </div>
        </div>

        {userInfo && (
          <div
            className={`sidebar-welcome ${collapsed ? 'collapsed' : ''}`}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            <div className="sidebar-welcome-avatar">
              {avatarSrc ? (
                <img src={avatarSrc} alt={userInfo.name} />
              ) : (
                userInfo.name.charAt(0).toUpperCase()
              )}
            </div>
            {!collapsed && (
              <span className="sidebar-welcome-text" style={labelStyle}>
                Welcome, {firstName}
              </span>
            )}
          </div>
        )}

        <OrgSwitcher collapsed={collapsed} />

        <div className="sidebar-section-label" style={labelStyle}>Workspace</div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" end className={getNavLinkClass} style={navItemStyle}>
            <FaTachometerAlt className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Dashboard</span>
          </NavLink>
          <NavLink to="/projects" className={getNavLinkClass} style={navItemStyle}>
            <FaFolder className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Projects</span>
          </NavLink>
          <NavLink to="/teams" className={getNavLinkClass} style={navItemStyle}>
            <FaUsers className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Teams</span>
          </NavLink>
          <NavLink to="/tasks" className={getNavLinkClass} style={navItemStyle}>
            <FaTasks className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Tasks</span>
          </NavLink>
          <NavLink to="/sessions" className={getNavLinkClass} style={navItemStyle}>
            <FaVideo className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Sessions</span>
          </NavLink>
          <NavLink to="/resources" className={getNavLinkClass} style={navItemStyle}>
            <FaFolderOpen className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Resources</span>
          </NavLink>
          <NavLink to="/exchange" className={getNavLinkClass} style={navItemStyle}>
            <FaExchangeAlt className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Exchange Board</span>
          </NavLink>
          <NavLink to="/my-ratings" className={getNavLinkClass} style={navItemStyle}>
            <FaStar className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>My Ratings</span>
          </NavLink>
          <NavLink to="/skill-sharing" className={getNavLinkClass} style={navItemStyle}>
            <FaBrain className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Skill Sharing</span>
          </NavLink>
          <NavLink to="/leaderboard" className={getNavLinkClass} style={navItemStyle}>
            <FaMedal className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Leaderboard</span>
          </NavLink>
          <button
            type="button"
            className="nav-item sidebar-guide-btn"
            onClick={() => setIsGuideOpen(true)}
            style={navItemStyle}
          >
            <FaBook className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>User Guide</span>
          </button>
        </nav>

        <div className="sidebar-section-label" style={labelStyle}>Account</div>
        <div className="sidebar-account-nav">
          <NavLink to="/organisations" className={getNavLinkClass} style={navItemStyle}>
            <FaBuilding className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Organisations</span>
          </NavLink>
          <NavLink to="/settings" className={getNavLinkClass} style={navItemStyle}>
            <FaCog className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Settings</span>
          </NavLink>
          {userInfo?.role === 'admin' && (
            <>
              <NavLink to="/admin" className={getNavLinkClass} style={navItemStyle}>
                <FaShieldAlt className="nav-item-icon" />
                <span className="nav-item-label" style={labelStyle}>Admin</span>
              </NavLink>
              <NavLink to="/admin/complaints" className={getNavLinkClass} style={navItemStyle}>
                <FaFlag className="nav-item-icon" />
                <span className="nav-item-label" style={labelStyle}>Complaints</span>
              </NavLink>
            </>
          )}
        </div>

        <div className="sidebar-bottom">
          {userInfo && (
            <NavLink
              to="/profile"
              className="sidebar-profile-card"
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <div className="sidebar-user-avatar">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={userInfo.name} />
                ) : (
                  userInfo.name.charAt(0).toUpperCase()
                )}
              </div>
              {!collapsed && (
                <div className="sidebar-user-copy">
                  <span className="sidebar-user-name">{userInfo.name}</span>
                  <span className="sidebar-user-role">{userInfo.role || 'Student'}</span>
                </div>
              )}
            </NavLink>
          )}
          <button
            className="sidebar-logout-btn"
            onClick={logoutHandler}
            type="button"
            style={{
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '10px 0' : '10px 16px',
            }}
          >
            <FaSignOutAlt className="nav-item-icon" />
            <span className="sidebar-logout-label" style={labelStyle}>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

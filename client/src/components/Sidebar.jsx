import React, { useState } from 'react';
import './Sidebar.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../actions/userActions';
import { FaBars, FaTimes, FaTachometerAlt, FaFolder, FaUsers, FaTasks, FaCog, FaSignOutAlt, FaComments, FaBook, FaBuilding, FaExchangeAlt, FaVideo, FaFolderOpen, FaCoins, FaMedal, FaShieldAlt, FaBrain, FaStar } from 'react-icons/fa';
import UserGuideModal from './UserGuideModal';
import OrgSwitcher from './OrgSwitcher';
import ThemeToggle from './ThemeToggle';
import { BACKEND_URL } from '../config/runtime';

const Sidebar = ({ isCollapsed, toggleSidebar, toggleChat, isMobile }) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

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
    transform: (isMobile && isCollapsed) ? 'translateX(-100%)' : 'translateX(0)'
  };

  const labelStyle = {
    opacity: isCollapsed && !isMobile ? 0 : 1,
    width: isCollapsed && !isMobile ? 0 : 'auto',
    overflow: 'hidden',
    transition: 'opacity 200ms ease, width 200ms ease',
    whiteSpace: 'nowrap',
    display: 'inline-block'
  };

  const navItemStyle = {
    justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start',
    gap: isCollapsed && !isMobile ? '0px' : '12px'
  };

  return (
    <>
      <UserGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <div className={`sidebar ${!isCollapsed ? 'sidebar-open' : 'sidebar-closed'}`} style={sidebarStyle}>
        <div className="sidebar-header" style={{ padding: isCollapsed && !isMobile ? '0' : '0 16px', justifyContent: isCollapsed && !isMobile ? 'center' : 'space-between' }}>
          <div className="sidebar-brand-block">
            <div className="sidebar-logo-row" style={{ justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start' }}>
              <div className="sidebar-logo-icon"><FaBuilding color="#fff" size={12} /></div>
              <span className="sidebar-logo-text" style={labelStyle}>Collaborate</span>
            </div>
            <div className="sidebar-logo-meta" style={labelStyle}>Workspace</div>
          </div>
        </div>

        <OrgSwitcher collapsed={isCollapsed && !isMobile} />

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
          <NavLink to="/exchange" className={getNavLinkClass} style={navItemStyle}>
            <FaExchangeAlt className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Exchange Board</span>
          </NavLink>
          <NavLink to="/sessions" className={getNavLinkClass} style={navItemStyle}>
            <FaVideo className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>My Sessions</span>
          </NavLink>
          <NavLink to="/skills" className={getNavLinkClass} style={navItemStyle}>
            <FaBrain className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Skill Profile</span>
          </NavLink>
          <NavLink to="/resources" className={getNavLinkClass} style={navItemStyle}>
            <FaFolderOpen className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Resources</span>
          </NavLink>
          <NavLink to="/leaderboard" className={getNavLinkClass} style={navItemStyle}>
            <FaMedal className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Leaderboard</span>
          </NavLink>
          <button className="nav-item" onClick={toggleChat} style={navItemStyle}>
            <FaComments className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Chat</span>
          </button>
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
        <NavLink to="/organisations" className={getNavLinkClass} style={navItemStyle}>
          <FaBuilding className="nav-item-icon" />
          <span className="nav-item-label" style={labelStyle}>Organisations</span>
        </NavLink>
        <NavLink to="/settings" className={getNavLinkClass} style={navItemStyle}>
          <FaCog className="nav-item-icon" />
          <span className="nav-item-label" style={labelStyle}>Settings</span>
        </NavLink>
        {userInfo?.role === 'admin' && (
          <NavLink to="/admin" className={getNavLinkClass} style={navItemStyle}>
            <FaShieldAlt className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Admin</span>
          </NavLink>
        )}

        <div className="sidebar-bottom">
          <div className="sidebar-footer-links" style={{ justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start' }}>
            <ThemeToggle collapsed={isCollapsed && !isMobile} />
          </div>
          {userInfo && (
            <NavLink to="/profile" className="sidebar-user-row" style={{ justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start', padding: isCollapsed && !isMobile ? '6px 0' : '6px 10px' }}>
              <div className="sidebar-user-avatar">
                {userInfo.profileImage ? (
                  <img
                    src={userInfo.profileImage.startsWith('data:image') ? userInfo.profileImage : `${BACKEND_URL}${userInfo.profileImage}`}
                    alt={userInfo.name}
                  />
                ) : (
                  userInfo.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="sidebar-user-copy" style={labelStyle}>
                <span className="sidebar-user-name">{userInfo.name}</span>
                <span className="sidebar-user-role">{userInfo.role || 'member'}</span>
                <div className="sidebar-user-rating">
                  {userInfo.avg_rating ? (
                    <>
                      <div className="sidebar-stars">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <FaStar key={i} className={i <= Math.round(userInfo.avg_rating) ? 'star-filled' : 'star-empty'} />
                        ))}
                      </div>
                      <span className="rating-value">{userInfo.avg_rating.toFixed(1)} ★</span>
                    </>
                  ) : (
                    <span className="no-rating">No ratings yet</span>
                  )}
                </div>
              </div>
            </NavLink>
          )}
          <button className="sidebar-logout-btn" onClick={logoutHandler} type="button" style={{ justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start', padding: isCollapsed && !isMobile ? '10px 0' : '10px 16px' }}>
            <FaSignOutAlt className="nav-item-icon" />
            <span className="sidebar-logout-label" style={labelStyle}>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

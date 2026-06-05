import React, { useState } from 'react';
import './Sidebar.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../actions/userActions';
import { 
  FiGrid, 
  FiFolder, 
  FiUsers, 
  FiCheckSquare, 
  FiRepeat, 
  FiVideo, 
  FiAward, 
  FiBookOpen, 
  FiTrendingUp, 
  FiMessageSquare, 
  FiHelpCircle, 
  FiLayers, 
  FiSettings, 
  FiShield, 
  FiLogOut, 
  FiChevronLeft, 
  FiChevronRight 
} from 'react-icons/fi';
import UserGuideModal from './UserGuideModal';
import OrgSwitcher from './OrgSwitcher';
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
    width: isMobile ? '220px' : (isCollapsed ? '56px' : '220px'),
    transform: (isMobile && isCollapsed) ? 'translateX(-100%)' : 'translateX(0)'
  };

  const labelStyle = {
    opacity: isCollapsed && !isMobile ? 0 : 1,
    width: isCollapsed && !isMobile ? 0 : 'auto',
    overflow: 'hidden',
    transition: 'opacity 150ms ease, width 150ms ease',
    whiteSpace: 'nowrap',
    display: 'inline-block'
  };

  return (
    <>
      <UserGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <div className={`sidebar ${!isCollapsed ? 'sidebar-open' : 'sidebar-closed'}`} style={sidebarStyle}>
        
        {/* Logo area */}
        <div className="sidebar-header">
          <div className="sidebar-brand-block">
            <div className="sidebar-logo-row">
              {/* Refined Monogram SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {!isCollapsed && <span className="sidebar-logo-text">Collaborate</span>}
            </div>
            {!isCollapsed && <div className="sidebar-logo-meta">Workspace</div>}
          </div>
        </div>

        {/* Scrollable Nav list */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label" style={labelStyle}>Workspace</div>
          
          <NavLink to="/dashboard" end className={getNavLinkClass}>
            <FiGrid className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Dashboard</span>
          </NavLink>
          <NavLink to="/projects" className={getNavLinkClass}>
            <FiFolder className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Projects</span>
          </NavLink>
          <NavLink to="/teams" className={getNavLinkClass}>
            <FiUsers className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Teams</span>
          </NavLink>
          <NavLink to="/tasks" className={getNavLinkClass}>
            <FiCheckSquare className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Tasks</span>
          </NavLink>
          <NavLink to="/exchange" className={getNavLinkClass}>
            <FiRepeat className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Exchange Board</span>
          </NavLink>
          <NavLink to="/sessions" className={getNavLinkClass}>
            <FiVideo className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>My Sessions</span>
          </NavLink>
          <NavLink to="/skills" className={getNavLinkClass}>
            <FiAward className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Skill Profile</span>
          </NavLink>

          <div className="sidebar-section-divider" />
          <div className="sidebar-section-label" style={labelStyle}>Resources</div>

          <NavLink to="/resources" className={getNavLinkClass}>
            <FiBookOpen className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Resources</span>
          </NavLink>
          <NavLink to="/leaderboard" className={getNavLinkClass}>
            <FiTrendingUp className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Leaderboard</span>
          </NavLink>
          <button className="nav-item" onClick={toggleChat}>
            <FiMessageSquare className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Chat</span>
          </button>
          <button type="button" className="nav-item" onClick={() => setIsGuideOpen(true)}>
            <FiHelpCircle className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>User Guide</span>
          </button>
        </nav>

        {/* Bottom actions, org switcher, collapse toggle */}
        <div className="sidebar-bottom">
          
          {/* Org Switcher at bottom */}
          <OrgSwitcher collapsed={isCollapsed && !isMobile} />

          {/* User profile row */}
          {userInfo && (
            <NavLink to="/profile" className="sidebar-user-row">
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
              </div>
            </NavLink>
          )}

          {/* Settings & Account */}
          <NavLink to="/settings" className={getNavLinkClass}>
            <FiSettings className="nav-item-icon" />
            <span className="nav-item-label" style={labelStyle}>Settings</span>
          </NavLink>

          {userInfo?.role === 'admin' && (
            <NavLink to="/admin" className={getNavLinkClass}>
              <FiShield className="nav-item-icon" />
              <span className="nav-item-label" style={labelStyle}>Admin</span>
            </NavLink>
          )}

          {/* Logout */}
          <button className="sidebar-logout-btn" onClick={logoutHandler} type="button">
            <FiLogOut className="nav-item-icon" />
            <span className="sidebar-logout-label" style={labelStyle}>Logout</span>
          </button>

          {/* Collapse toggle (aligned bottom-right corner of sidebar) */}
          {!isMobile && (
            <button 
              className="sidebar-collapse-toggle" 
              onClick={toggleSidebar}
              aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
            </button>
          )}
        </div>

      </div>
    </>
  );
};

export default Sidebar;

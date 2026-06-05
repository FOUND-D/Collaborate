import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation, Link } from 'react-router-dom';
import { 
  FiSearch, 
  FiBell, 
  FiChevronLeft, 
  FiChevronRight, 
  FiMessageSquare 
} from 'react-icons/fi';
import ThemeToggle from './ThemeToggle';
import { BACKEND_URL } from '../config/runtime';
import './TopHeader.css';

const TopHeader = ({ isSidebarOpen, toggleSidebar, toggleChat }) => {
  const location = useLocation();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const getPageName = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/projects') || path.startsWith('/project/')) return 'Projects';
    if (path.startsWith('/teams') || path.startsWith('/team/')) return 'Teams';
    if (path === '/tasks') return 'Tasks';
    if (path.startsWith('/exchange')) return 'Skill Exchange';
    if (path === '/sessions') return 'My Sessions';
    if (path === '/skills') return 'Skill Profile';
    if (path === '/resources') return 'Resources';
    if (path === '/leaderboard') return 'Leaderboard';
    if (path === '/settings') return 'Settings';
    if (path === '/profile') return 'Profile';
    if (path === '/organisations') return 'Organisations';
    if (path.startsWith('/chat')) return 'Chat';
    return 'Collaborate';
  };

  const getPageSubtitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Overview of your workspace';
    if (path.startsWith('/projects') || path.startsWith('/project/')) return 'Collaborate on active projects';
    if (path.startsWith('/teams') || path.startsWith('/team/')) return 'Organise and coordinate with members';
    if (path === '/tasks') return 'Keep track of your to-dos';
    if (path.startsWith('/exchange')) return 'Learn skills and book sessions';
    if (path === '/sessions') return 'Review your video calls and meetings';
    if (path === '/skills') return 'Manage your skill profile and ratings';
    if (path === '/settings') return 'Configure your application preferences';
    if (path === '/organisations') return 'Manage your workspaces and compliance';
    if (path.startsWith('/chat')) return 'Direct message your colleagues';
    return 'Productivity & Skill-Exchange';
  };

  return (
    <header className="top-header">
      <div className="header-left">
        {/* Toggle Button for mobile / desktop */}
        <button 
          className="header-icon-btn sidebar-toggle" 
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isSidebarOpen ? <FiChevronLeft size={18} /> : <FiChevronRight size={18} />}
        </button>
        <div className="header-divider" />
        
        {/* Breadcrumb breadcrumb-current */}
        <div className="header-breadcrumb">
          <span className="breadcrumb-title">{getPageName()}</span>
          <span className="breadcrumb-subtitle">{getPageSubtitle()}</span>
        </div>
      </div>

      <div className="header-right">
        {/* Search Icon */}
        <button className="header-icon-btn search-btn" aria-label="Search">
          <FiSearch size={18} />
        </button>

        {/* Chat Toggle Button */}
        <button 
          className="header-icon-btn message-btn" 
          onClick={toggleChat}
          aria-label="Messages"
          title="Toggle Messages"
        >
          <FiMessageSquare size={17} />
        </button>

        {/* Notification Bell with Badge Dot */}
        <button className="header-icon-btn notification-btn" aria-label="Notifications">
          <FiBell size={18} />
          <div className="notification-dot" />
        </button>

        {/* Theme Switcher Toggle */}
        <ThemeToggle />

        {/* User Avatar with subtle ring */}
        {userInfo && (
          <Link to="/profile" className="header-user-avatar" title="View Profile">
            {userInfo.profileImage ? (
              <img
                src={userInfo.profileImage.startsWith('data:image') ? userInfo.profileImage : `${BACKEND_URL}${userInfo.profileImage}`}
                alt={userInfo.name}
              />
            ) : (
              userInfo.name.charAt(0).toUpperCase()
            )}
          </Link>
        )}
      </div>
    </header>
  );
};

export default TopHeader;

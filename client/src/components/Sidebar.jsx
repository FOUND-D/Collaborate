import React, { useState } from 'react';
import './Sidebar.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../actions/userActions';
import { FaBars, FaTimes, FaTachometerAlt, FaFolder, FaUsers, FaTasks, FaCog, FaSignOutAlt, FaComments, FaBook, FaBuilding } from 'react-icons/fa';
import UserGuideModal from './UserGuideModal';
import OrgSwitcher from './OrgSwitcher';
import { BACKEND_URL } from '../config/runtime';

const Sidebar = ({ isSidebarOpen, toggleSidebar, toggleChat }) => {
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
  const collapsed = !isSidebarOpen;

  return (
    <>
      <UserGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <div className={`sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'} ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-row">
            <div className="sidebar-logo-icon"><FaBuilding color="#fff" size={12} /></div>
            <span className="sidebar-logo-text">Collaborate</span>
          </div>
          <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <OrgSwitcher collapsed={collapsed} />

        <div className="sidebar-section-label">Workspace</div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" end className={getNavLinkClass}>
            <FaTachometerAlt className="nav-item-icon" />
            <span className="nav-item-label">Dashboard</span>
          </NavLink>
          <NavLink to="/projects" className={getNavLinkClass}>
            <FaFolder className="nav-item-icon" />
            <span className="nav-item-label">Projects</span>
          </NavLink>
          <NavLink to="/teams" className={getNavLinkClass}>
            <FaUsers className="nav-item-icon" />
            <span className="nav-item-label">Teams</span>
          </NavLink>
          <NavLink to="/tasks" className={getNavLinkClass}>
            <FaTasks className="nav-item-icon" />
            <span className="nav-item-label">Tasks</span>
          </NavLink>
          <button className="nav-item" onClick={toggleChat}>
            <FaComments className="nav-item-icon" />
            <span className="nav-item-label">Chat</span>
          </button>
          <button
            type="button"
            className="nav-item sidebar-guide-btn"
            onClick={() => setIsGuideOpen(true)}
          >
            <FaBook className="nav-item-icon" />
            <span className="nav-item-label">User Guide</span>
          </button>
        </nav>

        <div style={{ flex: 1 }} />

        <div className="sidebar-section-label">Account</div>
        <NavLink to="/organisations" className={getNavLinkClass}>
          <FaBuilding className="nav-item-icon" />
          <span className="nav-item-label">Organisations</span>
        </NavLink>
        <NavLink to="/settings" className={getNavLinkClass}>
          <FaCog className="nav-item-icon" />
          <span className="nav-item-label">Settings</span>
        </NavLink>

        <div className="sidebar-bottom">
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
              <span className="sidebar-user-name">{userInfo.name}</span>
            </NavLink>
          )}
          <button className="sidebar-logout-btn" onClick={logoutHandler}>
            <FaSignOutAlt className="nav-item-icon" />
            <span className="sidebar-logout-label">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

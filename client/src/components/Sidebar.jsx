import React from 'react';
import './Sidebar.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../actions/userActions';
import { FaBars, FaTimes, FaTachometerAlt, FaFolder, FaUsers, FaTasks, FaCog, FaSignOutAlt, FaUser } from 'react-icons/fa';

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
    <div className={`sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="sidebar-header">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        {isSidebarOpen && <h2 className="app-title">Collaborate</h2>}
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
        <NavLink to="/profile" className={getNavLinkClass}>
          <FaUser />
          <span className="nav-text">Profile</span>
          {!isSidebarOpen && <span className="tooltip">Profile</span>}
        </NavLink>
        <NavLink to="/settings" className={getNavLinkClass}>
          <FaCog />
          <span className="nav-text">Settings</span>
          {!isSidebarOpen && <span className="tooltip">Settings</span>}
        </NavLink>
      </nav>

      {userInfo && (
        <div className="sidebar-footer">
          {isSidebarOpen && (
            <div className="user-profile">
              <div className="user-avatar">
                {userInfo.name.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{userInfo.name}</span>
            </div>
          )}
          <button className="logout-button" onClick={logoutHandler}>
            <FaSignOutAlt />
            {isSidebarOpen && <span className="logout-text">Logout</span>}
            {!isSidebarOpen && <span className="tooltip">Logout</span>}
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

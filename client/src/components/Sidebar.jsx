import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../actions/userActions';
import { FaBars, FaTimes, FaTachometerAlt, FaFolder, FaUsers, FaTasks, FaCog, FaSignOutAlt } from 'react-icons/fa';

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const logoutHandler = () => {
    dispatch(logout());
    navigate('/login');
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
        <Link to="/" className="nav-item">
          <FaTachometerAlt />
          {isSidebarOpen && <span className="nav-text">Dashboard</span>}
        </Link>
        <Link to="/projects/ongoing" className="nav-item">
          <FaFolder />
          {isSidebarOpen && <span className="nav-text">Projects</span>}
        </Link>
        <Link to="/teams" className="nav-item">
          <FaUsers />
          {isSidebarOpen && <span className="nav-text">Teams</span>}
        </Link>
        <Link to="/tasks" className="nav-item">
          <FaTasks />
          {isSidebarOpen && <span className="nav-text">Tasks</span>}
        </Link>
        <Link to="/settings" className="nav-item">
          <FaCog />
          {isSidebarOpen && <span className="nav-text">Settings</span>}
        </Link>
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
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

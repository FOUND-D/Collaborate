import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './components/Sidebar';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import TeamScreen from './screens/TeamScreen';
import TaskScreen from './screens/TaskScreen';
import TaskEditScreen from './screens/TaskEditScreen';
import HomeScreen from './screens/HomeScreen';
import ProjectCreateScreen from './screens/ProjectCreateScreen';
import ProjectScreen from './screens/ProjectScreen';
import OngoingProjectsScreen from './screens/OngoingProjectsScreen';
import TeamDetailsScreen from './screens/TeamDetailsScreen';
import ProfileScreen from './screens/ProfileScreen';
import { SERVER_STATUS_OFFLINE } from './constants/serverConstants';
import { FaBars } from 'react-icons/fa';

const App = () => {
  const serverStatus = useSelector((state) => state.serverStatus);
  const { status } = serverStatus;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // On desktop, we want the sidebar open by default, on mobile we want it closed.
      if (!mobile && !isSidebarOpen) {
        setIsSidebarOpen(true);
      } else if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    // Call handler right away so state is correct on initial render
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures this effect runs only once on mount and unmount

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // On desktop, content shifts when sidebar is closed.
  // On mobile, content shifts when sidebar is open (as an overlay).
  const getShiftClass = () => {
    if (isMobile) {
      return isSidebarOpen ? 'main-content-shifted' : '';
    } else {
      return isSidebarOpen ? '' : 'main-content-shifted';
    }
  };

  const mainContentClass = `main-content ${getShiftClass()}`;

  return (
    <Router>
      <div className="app-layout">
        {/* Mobile-only toggle button (visible when sidebar is closed on mobile) */}
        {isMobile && !isSidebarOpen && (
          <button className="mobile-sidebar-toggle" onClick={toggleSidebar}>
            <FaBars />
          </button>
        )}
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={mainContentClass}>
          {status === SERVER_STATUS_OFFLINE && (
            <div className="server-status-message">
              Server is currently offline. It usually takes about a minute to start up. Please wait...
            </div>
          )}
          <Routes>
            <Route path="/" element={<HomeScreen />} exact />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="/teams" element={<TeamScreen />} />
            <Route path="/team/:id" element={<TeamDetailsScreen />} />
            <Route path="/tasks" element={<TaskScreen />} />
            <Route path="/task/create" element={<TaskEditScreen />} />
            <Route path="/task/:id/edit" element={<TaskEditScreen />} />
            <Route path="/project/create" element={<ProjectCreateScreen />} />
            <Route path="/project/:id" element={<ProjectScreen />} />
            <Route path="/projects/ongoing" element={<OngoingProjectsScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            {/* Add other routes here */}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;

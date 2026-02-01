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
import MeetingScreen from './screens/MeetingScreen';
import ChatScreen from './screens/ChatScreen';
import ChatDocked from './components/ChatDocked';
import { SERVER_STATUS_OFFLINE } from './constants/serverConstants';
import { FaBars } from 'react-icons/fa';

const App = () => {
  const serverStatus = useSelector((state) => state.serverStatus);
  const { status } = serverStatus;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile && !isSidebarOpen) {
        setIsSidebarOpen(true);
      } else if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getShiftClass = () => {
    if (isMobile) {
      return isSidebarOpen ? 'main-content-shifted' : '';
    } else {
      return isSidebarOpen ? '' : 'main-content-shifted';
    }
  };

  const mainContentClass = `main-content ${getShiftClass()} ${isChatOpen ? 'chat-open' : ''}`;

  return (
    <Router>
      <div className="app-layout">
        {/* Mobile-only toggle button (visible when sidebar is closed on mobile) */}
        {isMobile && !isSidebarOpen && (
          <button className="mobile-sidebar-toggle" onClick={toggleSidebar}>
            <FaBars />
          </button>
        )}
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} toggleChat={toggleChat} />
        <div className="app-body">
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
              <Route path="/team/:id/meeting" element={<MeetingScreen />} />
              <Route path="/tasks" element={<TaskScreen />} />
              <Route path="/task/create" element={<TaskEditScreen />} />
              <Route path="/task/:id/edit" element={<TaskEditScreen />} />
              <Route path="/project/create" element={<ProjectCreateScreen />} />
              <Route path="/project/:id" element={<ProjectScreen />} />
              <Route path="/projects/ongoing" element={<OngoingProjectsScreen />} />
              <Route path="/profile" element={<ProfileScreen />} />
              <Route path="/chat" element={<ChatScreen />} />
              <Route path="/chat/:id" element={<ChatScreen />} />
            </Routes>
          </div>
          {isChatOpen && <ChatDocked onClose={toggleChat} />}
        </div>
      </div>
    </Router>
  );
};

export default App;

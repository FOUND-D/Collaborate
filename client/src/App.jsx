import React, { useState } from 'react';
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
import { SERVER_STATUS_OFFLINE } from './constants/serverConstants';

const App = () => {
  const serverStatus = useSelector((state) => state.serverStatus);
  const { status } = serverStatus;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Manage sidebar state in App.jsx

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const mainContentClass = `main-content ${isSidebarOpen ? 'main-content-shifted' : ''}`;


  return (
    <Router>
      <div className="app-layout">
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
            {/* Add other routes here */}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;

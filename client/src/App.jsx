import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'; // Add useDispatch
import Sidebar from './components/Sidebar';
import LandingPage from './screens/LandingPage';
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
import SettingsScreen from './screens/SettingsScreen';
import OrganisationsScreen from './screens/OrganisationsScreen';
import CreateOrganisationScreen from './screens/CreateOrganisationScreen';
import OrganisationDetailScreen from './screens/OrganisationDetailScreen';
import { MembersPage, RolesPage, CompliancePage, CustomFieldsPage, AuditLogPage, CompleteProfilePage } from './screens/OrgManagementPages';
import AcceptInviteScreen from './screens/AcceptInviteScreen';
import ChatDocked from './components/ChatDocked';
import { SERVER_STATUS_OFFLINE } from './constants/serverConstants';
import { FaBars } from 'react-icons/fa';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { fetchMembershipStatus, logout } from './actions/userActions'; // Import logout
import { USER_LOGIN_SUCCESS } from './constants/userConstants'; // Import constant

const ProtectedRoute = ({ children }) => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  const location = useLocation();

  if (!userInfo) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

// Inner App component that uses theme context
const AppContent = () => {
  const dispatch = useDispatch(); // Initialize dispatch
  useTheme();
  const serverStatus = useSelector((state) => state.serverStatus);
  const { status } = serverStatus;
  const userInfo = useSelector((state) => state.userLogin.userInfo);
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isPublicRoute = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register';

  // Cross-tab Login Synchronization
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'userInfo') {
        if (e.newValue) {
          dispatch({ type: USER_LOGIN_SUCCESS, payload: JSON.parse(e.newValue) });
        } else {
          dispatch(logout()); // Use action creator if possible, or simple dispatch
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [dispatch]);

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

  useEffect(() => {
    if (userInfo?.token) {
      dispatch(fetchMembershipStatus());
    }
  }, [dispatch, userInfo?.token]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getShiftClass = () => {
    if (isPublicRoute) {
      return 'public-route';
    }
    if (isMobile) {
      return isSidebarOpen ? 'main-content-shifted' : '';
    } else {
      return isSidebarOpen ? '' : 'main-content-shifted';
    }
  };

  const mainContentClass = `main-content app-main ${getShiftClass()} ${isChatOpen ? 'chat-open' : ''}`;

  return (
    <div className="app-layout">
        {/* Mobile-only toggle button (visible when sidebar is closed on mobile) */}
        {!isPublicRoute && isMobile && !isSidebarOpen && (
          <button className="mobile-sidebar-toggle" onClick={toggleSidebar}>
            <FaBars />
          </button>
        )}
        {!isPublicRoute && <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} toggleChat={toggleChat} />}
        <div className="app-body">
          <div className={mainContentClass}>
            {status === SERVER_STATUS_OFFLINE && (
              <div className="server-status-message">
                Server is currently offline. It usually takes about a minute to start up. Please wait...
              </div>
            )}
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><OngoingProjectsScreen /></ProtectedRoute>} />
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
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/chat" element={<ChatScreen />} />
              <Route path="/chat/:id" element={<ChatScreen />} />
              <Route path="/organisations" element={<ProtectedRoute><OrganisationsScreen /></ProtectedRoute>} />
              <Route path="/organisations/create" element={<ProtectedRoute><CreateOrganisationScreen /></ProtectedRoute>} />
              <Route path="/organisations/new" element={<ProtectedRoute><CreateOrganisationScreen /></ProtectedRoute>} />
              <Route path="/organisations/:id" element={<ProtectedRoute><OrganisationDetailScreen /></ProtectedRoute>} />
              <Route path="/organisations/:id/settings/members" element={<ProtectedRoute><MembersPage /></ProtectedRoute>} />
              <Route path="/organisations/:id/settings/roles" element={<ProtectedRoute><RolesPage /></ProtectedRoute>} />
              <Route path="/organisations/:id/settings/compliance" element={<ProtectedRoute><CompliancePage /></ProtectedRoute>} />
              <Route path="/organisations/:id/settings/custom-fields" element={<ProtectedRoute><CustomFieldsPage /></ProtectedRoute>} />
              <Route path="/organisations/:id/settings/audit-log" element={<ProtectedRoute><AuditLogPage /></ProtectedRoute>} />
              <Route path="/organisations/:id/complete-profile" element={<ProtectedRoute><CompleteProfilePage /></ProtectedRoute>} />
              <Route path="/invite/accept" element={<AcceptInviteScreen />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          {isChatOpen && <ChatDocked onClose={toggleChat} />}
        </div>
    </div>
  );
};

// Main App component that wraps everything with ThemeProvider
const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
};

export default App;

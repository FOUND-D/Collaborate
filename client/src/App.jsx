import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'; // Add useDispatch
import { motion } from 'framer-motion';
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
import PhaseOnePlaceholderScreen from './screens/PhaseOnePlaceholderScreen';
import ResourcesScreen from './screens/ResourcesScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import ChatDocked from './components/ChatDocked';
import TopHeader from './components/TopHeader';
import { SERVER_STATUS_OFFLINE } from './constants/serverConstants';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { fetchMembershipStatus, logout } from './actions/userActions'; // Import logout
import { USER_LOGIN_SUCCESS } from './constants/userConstants'; // Import constant

const SkillProfileScreen = lazy(() => import('./screens/SkillProfileScreen'));
const ExchangeBoardScreen = lazy(() => import('./screens/ExchangeBoardScreen'));
const ListingDetailScreen = lazy(() => import('./screens/ListingDetailScreen'));
const SessionsScreen = lazy(() => import('./screens/SessionsScreen'));
const SessionDetailScreen = lazy(() => import('./screens/SessionDetailScreen'));

const RouteFallback = () => (
  <div
    style={{
      minHeight: '55vh',
      display: 'grid',
      placeItems: 'center',
      background: 'var(--surface-panel-gradient)',
    }}
  >
    <div style={{ display: 'grid', gap: '14px', justifyItems: 'center' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '18px',
          border: '1px solid var(--glass-border)',
          background: 'var(--glass-bg)',
          boxShadow: 'var(--glass-shadow)',
          position: 'relative',
          backdropFilter: 'var(--glass-backdrop)',
          WebkitBackdropFilter: 'var(--glass-backdrop)',
        }}
      >
        <motion.div
          animate={{ opacity: [0.45, 1, 0.45], scale: [0.92, 1.05, 0.92] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: '10px',
            borderRadius: '14px',
            background: 'var(--accent-gradient-vivid)',
          }}
        />
      </motion.div>
      <div style={{ color: 'var(--surface-text-muted)', fontSize: '0.92rem' }}>Loading workspace...</div>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  const location = useLocation();

  if (!userInfo) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const userInfo = useSelector((state) => state.userLogin.userInfo);
  const location = useLocation();

  if (!userInfo) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (userInfo.role !== 'admin') {
    return <Navigate to="/" replace />;
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
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const isPublicRoute = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register';

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  // Keyboard Shortcut: Ctrl/Cmd + B
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
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

  const mainContentClass = `app-main ${isChatOpen ? 'chat-open' : ''}`;
  const contentMargin = isPublicRoute || isMobile ? '0px' : (sidebarCollapsed ? '64px' : '280px');
  const layoutClass = `app-layout ${isPublicRoute ? 'public-layout' : ''}`;

  return (
    <div className={layoutClass}>
        {!isPublicRoute && isMobile && !sidebarCollapsed && (
          <div 
            style={{ 
              position: 'fixed', 
              inset: 0, 
              background: 'rgba(0,0,0,0.5)', 
              zIndex: 40,
              transition: 'opacity 300ms ease'
            }} 
            onClick={toggleSidebar}
          />
        )}
        {!isPublicRoute && (
          <Sidebar 
            isCollapsed={sidebarCollapsed} 
            toggleSidebar={toggleSidebar} 
            toggleChat={toggleChat}
            isMobile={isMobile}
          />
        )}
        <div className="app-body">
          <div 
            className={mainContentClass}
            style={{ 
              marginLeft: contentMargin, 
              transition: 'margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              width: isMobile ? '100vw' : `calc(100vw - ${contentMargin})`
            }}
          >
            {!isPublicRoute && (
              <TopHeader 
                isSidebarOpen={!sidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
                toggleChat={toggleChat} 
              />
            )}
            {status === SERVER_STATUS_OFFLINE && (
              <div className="server-status-message">
                Server is currently offline. It usually takes about a minute to start up. Please wait...
              </div>
            )}
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
                <Route path="/projects" element={<ProtectedRoute><OngoingProjectsScreen /></ProtectedRoute>} />
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/register" element={<RegisterScreen />} />
                <Route path="/teams" element={<TeamScreen />} />
                <Route path="/team/:id" element={<TeamDetailsScreen />} />
                <Route path="/team/:id/meeting" element={<MeetingScreen />} />
                <Route path="/team/:id/session" element={<MeetingScreen />} />
                <Route path="/tasks" element={<TaskScreen />} />
                <Route path="/exchange" element={<ProtectedRoute><ExchangeBoardScreen /></ProtectedRoute>} />
                <Route path="/exchange/:id" element={<ProtectedRoute><ListingDetailScreen /></ProtectedRoute>} />
                <Route path="/exchange-board" element={<Navigate to="/exchange" replace />} />
                <Route path="/sessions" element={<ProtectedRoute><SessionsScreen /></ProtectedRoute>} />
                <Route path="/sessions/:id" element={<ProtectedRoute><SessionDetailScreen /></ProtectedRoute>} />
                <Route path="/skills" element={<ProtectedRoute><SkillProfileScreen /></ProtectedRoute>} />
                <Route path="/resources" element={<ProtectedRoute><ResourcesScreen /></ProtectedRoute>} />
                <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardScreen /></ProtectedRoute>} />
                <Route path="/admin" element={<AdminRoute><PhaseOnePlaceholderScreen title="Admin" description="Coming in Phase 2." /></AdminRoute>} />
                <Route path="/portfolio/:slug" element={<ProtectedRoute><PhaseOnePlaceholderScreen title="Portfolio" description="Coming in Phase 2." /></ProtectedRoute>} />
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
            </Suspense>
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

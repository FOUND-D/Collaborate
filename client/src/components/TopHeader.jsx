import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { 
    FaBars, 
    FaChevronRight, 
    FaCoins, 
    FaBell, 
    FaComments,
    FaThLarge
} from 'react-icons/fa';
import './TopHeader.css';

const TopHeader = ({ isSidebarOpen, toggleSidebar, toggleChat }) => {
    const location = useLocation();
    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const getPageName = () => {
        const path = location.pathname;
        if (path === '/dashboard') return 'Dashboard';
        if (path.startsWith('/projects')) return 'Projects';
        if (path.startsWith('/project/')) return 'Project Details';
        if (path === '/teams') return 'Teams';
        if (path.startsWith('/team/')) return 'Team Details';
        if (path === '/tasks') return 'Tasks';
        if (path.startsWith('/exchange')) return 'Exchange Board';
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

    const credits = userInfo?.credits;

    return (
        <header className="top-header">
            <div className="header-left">
                <button 
                    className="header-icon-btn ghost sidebar-toggle" 
                    onClick={toggleSidebar}
                    aria-label="Toggle Sidebar"
                >
                    <FaBars />
                </button>
                <div className="header-divider" />
                <div className="header-breadcrumb">
                    <div className="breadcrumb-main">
                        <FaThLarge className="breadcrumb-icon" />
                        <span>Collaborate</span>
                    </div>
                    <FaChevronRight className="breadcrumb-chevron" />
                    <span className="breadcrumb-current">{getPageName()}</span>
                </div>
            </div>

            <div className="header-right">
                <div className="credits-badge">
                    <FaCoins className="credits-icon" />
                    <span>{credits !== undefined && credits !== null ? `${credits} Credits` : '-- Credits'}</span>
                </div>

                <button className="header-icon-btn ghost notification-btn" aria-label="Notifications">
                    <FaBell />
                    <div className="notification-dot" />
                </button>

                <button 
                    className="header-icon-btn ghost message-btn" 
                    onClick={toggleChat}
                    aria-label="Messages"
                >
                    <FaComments />
                </button>
            </div>
        </header>
    );
};

export default TopHeader;

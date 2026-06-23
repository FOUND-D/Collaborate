import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, Link } from 'react-router-dom';
import { 
    FaChevronRight, 
    FaChevronLeft,
    FaCoins, 
    FaBell, 
    FaComments,
    FaThLarge,
    FaSearch,
    FaUser,
    FaFolderOpen,
    FaTasks,
    FaBook,
    FaUsers,
    FaTimes,
    FaSpinner,
    FaBullhorn
} from 'react-icons/fa';
import api from '../utils/api';
import NoticeBoardWidget from './NoticeBoardWidget';
import './TopHeader.css';

const TopHeader = ({ isSidebarOpen, toggleSidebar, toggleChat }) => {
    const location = useLocation();
    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    // Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState({ users: [], projects: [], tasks: [], resources: [], teams: [] });
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeRole, setActiveRole] = useState('all');
    const searchRef = useRef(null);

    // Notice states
    const [showNoticeDropdown, setShowNoticeDropdown] = useState(false);
    const noticeDropdownRef = useRef(null);
    const noticeButtonRef = useRef(null);

    // Handle click outside to close notice dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                noticeDropdownRef.current && 
                !noticeDropdownRef.current.contains(event.target) &&
                noticeButtonRef.current &&
                !noticeButtonRef.current.contains(event.target)
            ) {
                setShowNoticeDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        if (path === '/resources') return 'Resources';
        if (path === '/leaderboard') return 'Leaderboard';
        if (path === '/settings') return 'Settings';
        if (path === '/profile') return 'Profile';
        if (path === '/organisations') return 'Organisations';
        if (path.startsWith('/chat')) return 'Chat';
        return 'Collaborate';
    };

    const credits = userInfo?.credits;

    // Debounced search query fetching
    useEffect(() => {
        if (!searchQuery.trim()) {
            setResults({ users: [], projects: [], tasks: [], resources: [], teams: [] });
            return;
        }

        setLoading(true);
        const delayDebounceFn = setTimeout(async () => {
            try {
                const { data } = await api.get(`/api/search?q=${encodeURIComponent(searchQuery)}`);
                setResults(data);
            } catch (err) {
                console.error('Search request failed:', err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // Handle click outside to close search dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle Escape key to close search dropdown
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setShowDropdown(false);
                if (searchRef.current) {
                    const input = searchRef.current.querySelector('input');
                    if (input) input.blur();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleClearSearch = () => {
        setSearchQuery('');
        setResults({ users: [], projects: [], tasks: [], resources: [], teams: [] });
        setShowDropdown(false);
    };

    const handleCategoryChange = (category) => {
        setActiveCategory(category);
    };

    // Filter users list by role locally
    const getFilteredUsers = () => {
        const list = results.users || [];
        if (activeRole === 'student') {
            return list.filter(u => u.role === 'undergrad' || u.role === 'postgrad');
        }
        if (activeRole === 'faculty') {
            return list.filter(u => u.role === 'faculty');
        }
        if (activeRole === 'admin') {
            return list.filter(u => u.role === 'admin');
        }
        return list;
    };

    const renderCategoryResults = () => {
        const filteredUsers = getFilteredUsers();
        const hasUsers = filteredUsers.length > 0;
        const hasProjects = (results.projects || []).length > 0;
        const hasTasks = (results.tasks || []).length > 0;
        const hasResources = (results.resources || []).length > 0;
        const hasTeams = (results.teams || []).length > 0;

        const showUsers = activeCategory === 'all' || activeCategory === 'users';
        const showProjects = activeCategory === 'all' || activeCategory === 'projects';
        const showTasks = activeCategory === 'all' || activeCategory === 'tasks';
        const showResources = activeCategory === 'all' || activeCategory === 'resources';
        const showTeams = activeCategory === 'all' || activeCategory === 'teams';

        const isAnyRendered = 
            (showUsers && hasUsers) || 
            (showProjects && hasProjects) || 
            (showTasks && hasTasks) || 
            (showResources && hasResources) || 
            (showTeams && hasTeams);

        if (!isAnyRendered) {
            return (
                <div className="search-no-results">
                    No matches found for "{searchQuery}"
                </div>
            );
        }

        return (
            <>
                {/* 1. People Section */}
                {showUsers && hasUsers && (
                    <div className="search-results-section">
                        <div className="search-section-header">
                            <FaUser /> People
                        </div>
                        {filteredUsers.map(user => (
                            <Link 
                                key={user._id} 
                                to={`/profile/${user._id}`} 
                                className="search-item-link"
                                onClick={handleClearSearch}
                            >
                                {user.profileImage ? (
                                    <img src={user.profileImage} alt={user.name} className="search-item-avatar" />
                                ) : (
                                    <div className="search-item-avatar-placeholder">{user.name.charAt(0)}</div>
                                )}
                                <div className="search-item-info">
                                    <div className="search-item-title">{user.name}</div>
                                    <div className="search-item-subtitle">
                                        <span>{user.department || 'General'}</span>
                                        {user.studentId && <span>• Roll No: {user.studentId}</span>}
                                        <span className="search-role-badge">{user.role}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* 2. Projects Section */}
                {showProjects && hasProjects && (
                    <div className="search-results-section">
                        <div className="search-section-header">
                            <FaFolderOpen /> Projects
                        </div>
                        {results.projects.map(project => (
                            <Link 
                                key={project._id} 
                                to={`/project/${project._id}`} 
                                className="search-item-link"
                                onClick={handleClearSearch}
                            >
                                <div className="search-item-icon-wrapper">
                                    <FaFolderOpen />
                                </div>
                                <div className="search-item-info">
                                    <div className="search-item-title">{project.name}</div>
                                    {project.goal && <div className="search-item-subtitle">{project.goal}</div>}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* 3. Tasks Section */}
                {showTasks && hasTasks && (
                    <div className="search-results-section">
                        <div className="search-section-header">
                            <FaTasks /> Tasks
                        </div>
                        {results.tasks.map(task => (
                            <Link 
                                key={task._id} 
                                to={`/project/${task.projectId}`} 
                                className="search-item-link"
                                onClick={handleClearSearch}
                            >
                                <div className="search-item-icon-wrapper">
                                    <FaTasks />
                                </div>
                                <div className="search-item-info">
                                    <div className="search-item-title">{task.name}</div>
                                    <div className="search-item-subtitle">
                                        <span className={`search-status-pill search-status-${task.status}`}>
                                            {task.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* 4. Resources Section */}
                {showResources && hasResources && (
                    <div className="search-results-section">
                        <div className="search-section-header">
                            <FaBook /> Resources
                        </div>
                        {results.resources.map(resource => (
                            <Link 
                                key={resource._id} 
                                to="/resources" 
                                className="search-item-link"
                                onClick={handleClearSearch}
                            >
                                <div className="search-item-icon-wrapper">
                                    <FaBook />
                                </div>
                                <div className="search-item-info">
                                    <div className="search-item-title">{resource.title}</div>
                                    {resource.description && <div className="search-item-subtitle">{resource.description}</div>}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* 5. Teams Section */}
                {showTeams && hasTeams && (
                    <div className="search-results-section">
                        <div className="search-section-header">
                            <FaUsers /> Teams
                        </div>
                        {results.teams.map(team => (
                            <Link 
                                key={team._id} 
                                to={`/team/${team._id}`} 
                                className="search-item-link"
                                onClick={handleClearSearch}
                            >
                                <div className="search-item-icon-wrapper">
                                    <FaUsers />
                                </div>
                                <div className="search-item-info">
                                    <div className="search-item-title">{team.name}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </>
        );
    };

    return (
        <header className="top-header">
            <div className="header-left">
                <button 
                    className="header-icon-btn ghost sidebar-toggle" 
                    onClick={toggleSidebar}
                    aria-label={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
                >
                    {isSidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
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

            {/* Center Global Search Bar */}
            <div className="header-search-container" ref={searchRef}>
                <div className="header-search-input-wrapper">
                    <FaSearch className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search users, roll no, projects..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowDropdown(true)}
                    />
                    {loading && <FaSpinner className="search-spinner spinner" />}
                    {searchQuery && !loading && (
                        <button className="search-clear-btn" onClick={handleClearSearch} aria-label="Clear Search">
                            <FaTimes />
                        </button>
                    )}
                </div>
                
                {showDropdown && searchQuery.trim() && (
                    <div className="search-dropdown-overlay">
                        {/* Filters Row */}
                        <div className="search-filters-row">
                            <button 
                                className={`filter-chip ${activeCategory === 'all' ? 'active' : ''}`}
                                onClick={() => handleCategoryChange('all')}
                            >
                                All
                            </button>
                            <button 
                                className={`filter-chip ${activeCategory === 'users' ? 'active' : ''}`}
                                onClick={() => handleCategoryChange('users')}
                            >
                                People
                            </button>
                            <button 
                                className={`filter-chip ${activeCategory === 'projects' ? 'active' : ''}`}
                                onClick={() => handleCategoryChange('projects')}
                            >
                                Projects
                            </button>
                            <button 
                                className={`filter-chip ${activeCategory === 'tasks' ? 'active' : ''}`}
                                onClick={() => handleCategoryChange('tasks')}
                            >
                                Tasks
                            </button>
                            <button 
                                className={`filter-chip ${activeCategory === 'resources' ? 'active' : ''}`}
                                onClick={() => handleCategoryChange('resources')}
                            >
                                Resources
                            </button>
                            <button 
                                className={`filter-chip ${activeCategory === 'teams' ? 'active' : ''}`}
                                onClick={() => handleCategoryChange('teams')}
                            >
                                Teams
                            </button>
                        </div>

                        {/* User role sub-filters */}
                        {(activeCategory === 'all' || activeCategory === 'users') && (
                            <div className="search-sub-filters-row">
                                <span className="sub-filters-label">Roles:</span>
                                <button 
                                    className={`sub-filter-chip ${activeRole === 'all' ? 'active' : ''}`}
                                    onClick={() => setActiveRole('all')}
                                >
                                    All Roles
                                </button>
                                <button 
                                    className={`sub-filter-chip ${activeRole === 'student' ? 'active' : ''}`}
                                    onClick={() => setActiveRole('student')}
                                >
                                    Students
                                </button>
                                <button 
                                    className={`sub-filter-chip ${activeRole === 'faculty' ? 'active' : ''}`}
                                    onClick={() => setActiveRole('faculty')}
                                >
                                    Faculty
                                </button>
                                <button 
                                    className={`sub-filter-chip ${activeRole === 'admin' ? 'active' : ''}`}
                                    onClick={() => setActiveRole('admin')}
                                >
                                    Admins
                                </button>
                            </div>
                        )}

                        {/* Search Results List */}
                        <div className="search-results-list">
                            {renderCategoryResults()}
                        </div>
                    </div>
                )}
            </div>

            <div className="header-right">
                <div className="credits-badge">
                    <FaCoins className="credits-icon" />
                    <span>{credits !== undefined && credits !== null ? `${credits} Credits` : '-- Credits'}</span>
                </div>

                <button 
                    ref={noticeButtonRef}
                    className={`header-icon-btn ghost notice-btn ${showNoticeDropdown ? 'active' : ''}`}
                    onClick={() => setShowNoticeDropdown(!showNoticeDropdown)}
                    aria-label="Notice Board"
                >
                    <FaBullhorn />
                </button>

                {showNoticeDropdown && (
                    <div className="header-notice-dropdown-overlay" ref={noticeDropdownRef}>
                        <NoticeBoardWidget />
                    </div>
                )}

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

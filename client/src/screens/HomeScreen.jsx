import React, { useEffect, useMemo, useState, useRef } from 'react';
import './HomeScreen.css';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaProjectDiagram, FaUsers, FaMagic, FaArrowRight, FaClipboardList, FaCheckCircle, FaClock, FaStar, FaRegStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { listProjects } from '../actions/projectActions';
import { listTasks } from '../actions/taskActions';
import { listMyOrganisations } from '../actions/organisationActions';
import { listSkillMatches } from '../actions/skillActions';
import { FaBuilding, FaPlus, FaSearch } from 'react-icons/fa';
import api from '../utils/api';
import { selectHasTeam } from '../selectors/membershipSelectors';
import AchievementTags from '../components/AchievementTags';

const HomeScreen = () => {
  const dispatch = useDispatch();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  const hasTeam = useSelector(selectHasTeam);

  const carouselRef = useRef(null);

  const scrollPrev = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollNext = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const projectList = useSelector((state) => state.projectList);
  const { projects } = projectList;

  const taskList = useSelector((state) => state.taskList);
  const { tasks } = taskList;

  const { matches = [] } = useSelector((state) => state.skillMatchList);

  const orgCurrent = useSelector((state) => state.orgCurrent);
  const orgList = useSelector((state) => state.orgList);
  const currentOrg = orgCurrent.organisation || orgList.organisations?.[0];
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (userInfo) {
      dispatch(listProjects());
      dispatch(listTasks());
      dispatch(listMyOrganisations());
      dispatch(listSkillMatches());
      api.get('/api/users/profile').then(({ data }) => setProfile(data)).catch(() => setProfile(null));
      
      setLoadingStats(true);
      api.get('/api/users/me/stats')
        .then(({ data }) => setStats(data))
        .catch(() => setStats(null))
        .finally(() => setLoadingStats(false));
    }
  }, [dispatch, userInfo]);

  const dashboardStats = useMemo(() => {
    const projectCount = Array.isArray(projects) ? projects.length : 0;
    const taskItems = Array.isArray(tasks) ? tasks : [];
    const completedTasks = taskItems.filter((task) => task.status === 'Completed').length;
    const completionRate = taskItems.length > 0 ? Math.round((completedTasks / taskItems.length) * 100) : 0;

    return {
      projectCount,
      taskCount: taskItems.filter((task) => task.status !== 'Completed').length,
      completionRate,
    };
  }, [projects, tasks]);


  return (
    <div className="dashboard-page">
      {!currentOrg && (
        <div className="onboarding-banner">
          <div className="onboarding-banner-left">
            <div className="onboarding-banner-icon"><FaBuilding /></div>
            <div className="onboarding-banner-text">
              <h3 className="onboarding-banner-title">You're not part of any organisation yet</h3>
              <p className="onboarding-banner-sub">Create or join one to unlock team collaboration, projects, and more.</p>
            </div>
          </div>
          <Link to="/organisations/create" className="onboarding-banner-btn"><FaPlus /> Create Organisation</Link>
        </div>
      )}
      {profile?.pendingInvites?.length > 0 && (
        <div className="onboarding-banner">
          <div className="onboarding-banner-left">
            <div className="onboarding-banner-icon"><FaBuilding /></div>
            <div className="onboarding-banner-text">
              <h3 className="onboarding-banner-title">You have organisation invites</h3>
              <p className="onboarding-banner-sub">Open an invite to join the organisation and start collaborating.</p>
            </div>
          </div>
          <div className="onboarding-banner-list">
            {profile.pendingInvites.slice(0, 3).map((invite) => (
              <Link
                key={invite._id}
                to={`/invite/accept?token=${invite.token}&org=${invite.organisation?._id || ''}`}
                className="onboarding-banner-btn"
              >
                <FaPlus /> {invite.organisation?.name || invite.email}
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="dashboard-greeting">
        <div className="dashboard-greeting-top">
          <div className="greeting-text">
            <h1 className="dashboard-title">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},
              <span className="name-accent"> {userInfo ? userInfo.name.split(' ')[0] : 'Guest'}</span>
            </h1>
            <p className="dashboard-subtitle">
              Here's what's happening in your workspace today.
            </p>
          </div>
          
          <div className="dashboard-summary-cards">
             <div className="dashboard-summary-card credits-gradient">
                <div className="summary-label">Credits</div>
                <div className="summary-value">{userInfo?.credits ?? 0}</div>
                <div className="summary-sublabel">Available</div>
             </div>
             
             <div className="dashboard-summary-card rating-gradient">
                <div className="summary-label">Rating</div>
                <div className="summary-value">{userInfo?.avg_rating ? userInfo.avg_rating.toFixed(1) : "—"}</div>
                <div className="summary-stars">
                    {[1, 2, 3, 4, 5].map((index) => {
                        const rating = userInfo?.avg_rating || 0;
                        const roundedRating = Math.round(rating);
                        if (index <= roundedRating) {
                            return <FaStar key={index} className="star-icon filled" />;
                        } else {
                            return <FaRegStar key={index} className="star-icon" />;
                        }
                    })}
                </div>
             </div>
          </div>
        </div>
      </div>
      <div className="dashboard-divider" />

      {/* New Progress Section Re-integrated */}
      <div className="home-progress-section" style={{ marginBottom: '16px' }}>
        <div className="section-header-row" style={{ marginBottom: '16px' }}>
            <div className="section-header-bar" />
            <div className="section-header-title">Your Progress</div>
        </div>
        <div className="stats-grid">
          <div className="stat-mini-card teal">
            <div className="mini-card-icon">🚀</div>
            <div className="mini-card-info">
              <span className="mini-card-val">{stats?.sessionsTaught ?? '—'}</span>
              <span className="mini-card-lbl">Sessions Taught</span>
              <span className="mini-card-sub">{stats?.sessionsThisMonth ?? 0} this month</span>
            </div>
          </div>
          <div className="stat-mini-card blue">
            <div className="mini-card-icon">📽️</div>
            <div className="mini-card-info">
              <span className="mini-card-val">{stats?.sessionsAttended ?? '—'}</span>
              <span className="mini-card-lbl">Sessions Attended</span>
            </div>
          </div>
          <div className="stat-mini-card green">
            <div className="mini-card-icon">🏆</div>
            <div className="mini-card-info">
              <span className="mini-card-val">{stats?.skillCount ?? '—'}</span>
              <span className="mini-card-lbl">Skills Mastered</span>
            </div>
          </div>
          <div className="stat-mini-card yellow">
            <div className="mini-card-icon">⭐</div>
            <div className="mini-card-info">
              <span className="mini-card-val">{stats?.avgRating ? stats.avgRating.toFixed(1) : '—'}</span>
              <span className="mini-card-lbl">Average Rating</span>
            </div>
          </div>
        </div>
      </div>

      <div className="stat-cards-row">
        <div className="stat-card">
          <div className="stat-icon-box blue">
            <FaProjectDiagram />
          </div>
          <div>
            <div className="stat-value">{dashboardStats.projectCount}</div>
            <div className="stat-label">Active Projects</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box purple">
            <FaClipboardList />
          </div>
          <div>
            <div className="stat-value">{dashboardStats.taskCount}</div>
            <div className="stat-label">Pending Tasks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box green">
            <FaCheckCircle />
          </div>
          <div className="stat-content">
            <div className="stat-value">{dashboardStats.completionRate}%</div>
            <div className="stat-label">Completion Rate</div>
            <div className="stat-card-progress-wrapper">
              <div className="stat-progress-track">
                <div 
                  className="stat-progress-fill green" 
                  style={{ width: `${dashboardStats.completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

      </div>
      <div className="dashboard-divider" />

      <div className="section-header-row">
        <div className="section-header-bar" />
        <div className="section-header-title">Quick Actions</div>
      </div>

      <div className="quick-actions-grid">
        <Link to="/projects/ongoing" className="quick-card">
          <div className="quick-card-icon-wrap blue"><FaProjectDiagram /></div>
          <h3 className="quick-card-title">View Ongoing Projects</h3>
          <p className="quick-card-desc">Jump back into your projects and see what's new.</p>
          <span className="quick-card-link blue">Go to Projects <FaArrowRight /></span>
        </Link>
        <Link to="/teams" className="quick-card">
          <div className="quick-card-icon-wrap purple"><FaUsers /></div>
          <h3 className="quick-card-title">Manage Your Teams</h3>
          <p className="quick-card-desc">Collaborate with your team members and manage roles.</p>
          <span className="quick-card-link purple">Go to Teams <FaArrowRight /></span>
        </Link>
        {userInfo && (hasTeam ? (
          <Link to="/project/create" className="quick-card">
            <div className="quick-card-icon-wrap blue"><FaMagic /></div>
            <h3 className="quick-card-title">Create Project with AI</h3>
            <p className="quick-card-desc">Let our AI assistant build a project plan for you.</p>
            <span className="quick-card-link blue">Start Now <FaArrowRight /></span>
          </Link>
        ) : (
          <Link to="/teams" className="quick-card">
            <div className="quick-card-icon-wrap blue"><FaMagic /></div>
            <h3 className="quick-card-title">Create Project with AI</h3>
            <p className="quick-card-desc">Let our AI assistant build a project plan for you.</p>
            <span className="quick-card-link muted">Join or create a team first to unlock projects</span>
          </Link>
        ))}
      </div>
      <div className="dashboard-divider" />

      <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div className="section-header-bar" />
          <div className="section-header-title">Matched for you</div>
        </div>
        {matches.length > 0 && (
          <div className="carousel-nav-buttons" style={{ display: 'flex', gap: '8px' }}>
            <button className="carousel-nav-btn" onClick={scrollPrev} aria-label="Previous Matches">
              <FaChevronLeft />
            </button>
            <button className="carousel-nav-btn" onClick={scrollNext} aria-label="Next Matches">
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>

      <div className="matches-carousel-container">
        {matches.length === 0 ? (
          <div className="quick-card" style={{ width: '100%', textAlign: 'center' }}>
            <p className="quick-card-desc">Add skills to your profile to see peer recommendations</p>
            <Link to="/profile" className="quick-card-link blue" style={{ justifyContent: 'center' }}>
              Update Profile <FaArrowRight />
            </Link>
          </div>
        ) : (
          <div className="matches-carousel-deck" ref={carouselRef}>
            {matches.slice(0, 10).map((match) => (
              <div key={match.user?._id} className="premium-carousel-card">
                <div className="carousel-card-header">
                  <div className="carousel-card-avatar">
                    {match.user?.name?.charAt(0)?.toUpperCase() || 'P'}
                  </div>
                  <div className="carousel-card-meta">
                    <h3 className="carousel-card-name">{match.user?.name}</h3>
                    <p className="carousel-card-dept">{match.user?.department || 'Open department'}</p>
                    <AchievementTags badges={match.user?.badges} size="sm" limit={1} />
                  </div>
                  <div className="carousel-card-score-badge">
                    <span className="score-val">{Math.round(match.matchScore)}%</span>
                    <span className="score-lbl">Match</span>
                  </div>
                </div>

                {match.matchedSkills?.length > 0 && (
                  <div className="carousel-card-skills">
                    <span className="skills-lbl">Tears / Teaches:</span>
                    <div className="skills-pills-row">
                      {match.matchedSkills.slice(0, 2).map((ms) => (
                        <span key={ms.skillId} className="premium-skill-pill">
                          {ms.skillName}
                        </span>
                      ))}
                      {match.matchedSkills.length > 2 && (
                        <span className="premium-skill-pill more">+{match.matchedSkills.length - 2}</span>
                      )}
                    </div>
                  </div>
                )}

                <Link to={`/profile/${match.user?._id}`} className="premium-card-action">
                  View Profile <FaArrowRight />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;

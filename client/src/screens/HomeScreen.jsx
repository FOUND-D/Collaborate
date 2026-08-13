import React, { useEffect, useMemo, useState, useRef } from 'react';
import './HomeScreen.css';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaProjectDiagram,
  FaUsers,
  FaMagic,
  FaArrowRight,
  FaClipboardList,
  FaStar,
  FaRegStar,
  FaChevronLeft,
  FaChevronRight,
  FaChalkboardTeacher,
  FaVideo,
  FaLayerGroup,
  FaBuilding,
  FaPlus,
} from 'react-icons/fa';
import { listProjects } from '../actions/projectActions';
import { listTasks } from '../actions/taskActions';
import { listMyOrganisations } from '../actions/organisationActions';
import { listSkillMatches } from '../actions/skillActions';
import api from '../utils/api';
import { selectHasTeam } from '../selectors/membershipSelectors';
import AchievementTags from '../components/AchievementTags';

const CircularProgress = ({ value, size = 64 }) => {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="circular-progress-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="circular-progress-svg">
        <circle
          className="circular-progress-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
        />
        <circle
          className="circular-progress-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="circular-progress-label">{value}%</span>
    </div>
  );
};

const DevScoreSparkline = () => (
  <svg className="dev-score-sparkline" viewBox="0 0 80 32" aria-hidden="true">
    <polyline
      points="2,28 18,22 32,24 48,14 62,10 78,4"
      fill="none"
      stroke="rgba(255,255,255,0.55)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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

  useEffect(() => {
    if (userInfo) {
      dispatch(listProjects());
      dispatch(listTasks());
      dispatch(listMyOrganisations());
      dispatch(listSkillMatches());
      api.get('/api/users/profile').then(({ data }) => setProfile(data)).catch(() => setProfile(null));

      api.get('/api/users/me/stats')
        .then(({ data }) => setStats(data))
        .catch(() => setStats(null));
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

  const greetingPeriod = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening';
  const firstName = userInfo ? userInfo.name.split(' ')[0] : 'Guest';
  const devScoreDisplay = userInfo?.devScore != null
    ? Number(userInfo.devScore).toFixed(2)
    : '—';
  const ratingDisplay = userInfo?.avg_rating ? userInfo.avg_rating.toFixed(1) : '—';
  const roundedRating = Math.round(userInfo?.avg_rating || 0);

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
              Good {greetingPeriod},
              <span className="name-accent"> {firstName}</span>
            </h1>
            <p className="dashboard-subtitle">
              Here's what's happening in your workspace today.
            </p>
          </div>

          <div className="dashboard-summary-cards">
            <div className="dashboard-summary-card dev-score-card">
              <div className="summary-card-top">
                <div>
                  <div className="summary-label">Dev Score</div>
                  <div className="summary-value">{devScoreDisplay}</div>
                  <div className="summary-sublabel">Calculated</div>
                </div>
                <DevScoreSparkline />
              </div>
            </div>

            <div className="dashboard-summary-card rating-card">
              <div className="summary-label">Rating</div>
              <div className="summary-value">{ratingDisplay}</div>
              <div className="summary-stars">
                {[1, 2, 3, 4, 5].map((index) => (
                  index <= roundedRating
                    ? <FaStar key={index} className="star-icon filled" />
                    : <FaRegStar key={index} className="star-icon" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-divider" />

      <div className="home-progress-section">
        <div className="section-header-row">
          <div className="section-header-bar" />
          <div className="section-header-title">Your Progress</div>
        </div>

        <div className="progress-mini-grid">
          <div className="stat-mini-card">
            <div className="mini-card-icon mint"><FaChalkboardTeacher /></div>
            <div className="mini-card-info">
              <span className="mini-card-val">{stats?.sessionsTaught ?? '—'}</span>
              <span className="mini-card-lbl">Sessions Taught</span>
              <span className="mini-card-sub">{stats?.sessionsThisMonth ?? 0} this month</span>
            </div>
          </div>
          <div className="stat-mini-card">
            <div className="mini-card-icon mint"><FaVideo /></div>
            <div className="mini-card-info">
              <span className="mini-card-val">{stats?.sessionsAttended ?? '—'}</span>
              <span className="mini-card-lbl">Sessions Attended</span>
              <span className="mini-card-sub">{stats?.sessionsThisMonth ?? 0} this month</span>
            </div>
          </div>
          <div className="stat-mini-card">
            <div className="mini-card-icon mint"><FaLayerGroup /></div>
            <div className="mini-card-info">
              <span className="mini-card-val">{stats?.skillCount ?? '—'}</span>
              <span className="mini-card-lbl">Skills Mastered</span>
              <span className="mini-card-sub">Keep learning!</span>
            </div>
          </div>
          <div className="stat-mini-card">
            <div className="mini-card-icon mint"><FaStar /></div>
            <div className="mini-card-info">
              <span className="mini-card-val">{stats?.avgRating ? stats.avgRating.toFixed(1) : '—'}</span>
              <span className="mini-card-lbl">Average Rating</span>
              <span className="mini-card-sub">
                {stats?.avgRating ? 'Based on peer reviews' : 'Be the first to rate'}
              </span>
            </div>
          </div>
        </div>

        <div className="progress-stat-grid">
          <div className="stat-card">
            <div className="stat-icon-box forest">
              <FaProjectDiagram />
            </div>
            <div className="stat-content">
              <div className="stat-value">{dashboardStats.projectCount}</div>
              <div className="stat-label">Active Projects</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-box mint">
              <FaClipboardList />
            </div>
            <div className="stat-content">
              <div className="stat-value">{dashboardStats.taskCount}</div>
              <div className="stat-label">Pending Tasks</div>
            </div>
          </div>
          <div className="stat-card stat-card-ring">
            <CircularProgress value={dashboardStats.completionRate} />
            <div className="stat-content">
              <div className="stat-label stat-label-ring">Completion Rate</div>
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
        <Link to="/projects/ongoing" className="quick-card horizontal">
          <div className="quick-card-icon-wrap forest"><FaProjectDiagram /></div>
          <div className="quick-card-body">
            <h3 className="quick-card-title">View Ongoing Projects</h3>
            <p className="quick-card-desc">Jump back into your projects and see what's new.</p>
            <span className="quick-card-link">Go to Projects <FaArrowRight /></span>
          </div>
        </Link>
        <Link to="/teams" className="quick-card horizontal">
          <div className="quick-card-icon-wrap mint"><FaUsers /></div>
          <div className="quick-card-body">
            <h3 className="quick-card-title">Manage Your Teams</h3>
            <p className="quick-card-desc">Collaborate with your team members and manage roles.</p>
            <span className="quick-card-link">Go to Teams <FaArrowRight /></span>
          </div>
        </Link>
        {userInfo && (hasTeam ? (
          <Link to="/project/create" className="quick-card horizontal">
            <div className="quick-card-icon-wrap forest"><FaMagic /></div>
            <div className="quick-card-body">
              <h3 className="quick-card-title">Create Project with AI</h3>
              <p className="quick-card-desc">Let our AI assistant build a project plan for you.</p>
              <span className="quick-card-link">Start Now <FaArrowRight /></span>
            </div>
          </Link>
        ) : (
          <Link to="/teams" className="quick-card horizontal">
            <div className="quick-card-icon-wrap forest"><FaMagic /></div>
            <div className="quick-card-body">
              <h3 className="quick-card-title">Create Project with AI</h3>
              <p className="quick-card-desc">Let our AI assistant build a project plan for you.</p>
              <span className="quick-card-link muted">Join or create a team first to unlock projects</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="dashboard-divider" />

      <div className="section-header-row matches-header-row">
        <div className="matches-header-left">
          <div className="section-header-bar" />
          <div className="section-header-title">Matched for you</div>
        </div>
        {matches.length > 0 && (
          <div className="carousel-nav-buttons">
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
          <div className="matches-empty-card">
            <p className="quick-card-desc">Add skills to your profile to see peer recommendations</p>
            <Link to="/profile" className="quick-card-link">
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
                    <span className="skills-lbl">Teaches / Shares:</span>
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

import React, { useEffect, useMemo, useState } from 'react';
import './HomeScreen.css';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaProjectDiagram, FaUsers, FaMagic, FaArrowRight, FaClipboardList, FaCheckCircle, FaClock } from 'react-icons/fa';
import { listProjects } from '../actions/projectActions';
import { listTasks } from '../actions/taskActions';
import { listMyOrganisations } from '../actions/organisationActions';
import { FaBuilding, FaPlus } from 'react-icons/fa';
import api from '../utils/api';
import { selectHasTeam } from '../selectors/membershipSelectors';

const HomeScreen = () => {
  const dispatch = useDispatch();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  const hasTeam = useSelector(selectHasTeam);

  const projectList = useSelector((state) => state.projectList);
  const { projects } = projectList;

  const taskList = useSelector((state) => state.taskList);
  const { tasks } = taskList;
  const orgCurrent = useSelector((state) => state.orgCurrent);
  const orgList = useSelector((state) => state.orgList);
  const currentOrg = orgCurrent.organisation || orgList.organisations?.[0];
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (userInfo) {
      dispatch(listProjects());
      dispatch(listTasks());
      dispatch(listMyOrganisations());
      api.get('/api/users/profile').then(({ data }) => setProfile(data)).catch(() => setProfile(null));
    }
  }, [dispatch, userInfo]);

  const stats = useMemo(() => {
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
          <div>
            <h1 className="dashboard-title">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},
              <span className="name-accent"> {userInfo ? userInfo.name.split(' ')[0] : 'Guest'}</span>
            </h1>
            <p className="dashboard-subtitle">
              Here's what's happening in your workspace today.
            </p>
          </div>
          <div className="dashboard-date-badge">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>
      <div className="dashboard-divider" />

      <div className="stat-cards-row">
        <div className="stat-card">
          <div className="stat-icon-box blue">
            <FaProjectDiagram />
          </div>
          <div>
            <div className="stat-value">{stats.projectCount}</div>
            <div className="stat-label">Active Projects</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box purple">
            <FaClipboardList />
          </div>
          <div>
            <div className="stat-value">{stats.taskCount}</div>
            <div className="stat-label">Pending Tasks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box green">
            <FaCheckCircle />
          </div>
          <div>
            <div className="stat-value">{stats.completionRate}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default HomeScreen;

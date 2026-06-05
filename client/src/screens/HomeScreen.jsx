import React, { useEffect, useMemo, useState } from 'react';
import './HomeScreen.css';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FiFolder, 
  FiCheckSquare, 
  FiUsers, 
  FiVideo, 
  FiChevronRight, 
  FiActivity, 
  FiPlus 
} from 'react-icons/fi';
import { listProjects } from '../actions/projectActions';
import { listTasks } from '../actions/taskActions';
import { listTeams } from '../actions/teamActions';
import { listSessions } from '../actions/sessionActions';
import { listMyOrganisations } from '../actions/organisationActions';
import { listSkillMatches } from '../actions/skillActions';
import api from '../utils/api';
import { selectHasTeam } from '../selectors/membershipSelectors';

const HomeScreen = () => {
  const dispatch = useDispatch();
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  const hasTeam = useSelector(selectHasTeam);

  const projectList = useSelector((state) => state.projectList);
  const { projects = [] } = projectList;

  const taskList = useSelector((state) => state.taskList);
  const { tasks = [] } = taskList;

  const teamList = useSelector((state) => state.teamList);
  const { teams = [] } = teamList;

  const sessionList = useSelector((state) => state.sessionList);
  const { sessions = { upcoming: [], past: [] } } = sessionList;

  const orgCurrent = useSelector((state) => state.orgCurrent);
  const orgList = useSelector((state) => state.orgList);
  const currentOrg = orgCurrent.organisation || orgList.organisations?.[0];
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (userInfo) {
      dispatch(listProjects());
      dispatch(listTasks());
      dispatch(listTeams());
      dispatch(listSessions());
      dispatch(listMyOrganisations());
      dispatch(listSkillMatches());
      api.get('/api/users/profile')
        .then(({ data }) => setProfile(data))
        .catch(() => setProfile(null));
    }
  }, [dispatch, userInfo]);

  const metricStats = useMemo(() => {
    return {
      projectsCount: Array.isArray(projects) ? projects.length : 0,
      tasksCount: Array.isArray(tasks) ? tasks.filter(t => t.status !== 'Completed').length : 0,
      teamsCount: Array.isArray(teams) ? teams.length : 0,
      sessionsCount: (Array.isArray(sessions?.upcoming) ? sessions.upcoming.length : 0) + 
                     (Array.isArray(sessions?.past) ? sessions.past.length : 0),
    };
  }, [projects, tasks, teams, sessions]);

  // Construct dynamic activity feed using task data
  const activities = useMemo(() => {
    const taskItems = Array.isArray(tasks) ? tasks : [];
    if (taskItems.length === 0) {
      return [
        { id: '1', user: 'System', text: 'Welcome to your new workspace!', time: 'Recently', initial: 'S' },
        { id: '2', user: 'AI Assistant', text: 'Add skills to matching profile to connect with peers.', time: 'Recently', initial: 'AI' }
      ];
    }
    return taskItems.slice(0, 4).map(task => {
      let action = 'updated';
      if (task.status === 'Completed') action = 'completed';
      else if (task.status === 'In Progress') action = 'started working on';
      else if (task.status === 'Blocked') action = 'flagged as blocked';
      else action = 'created';

      const date = task.updatedAt ? new Date(task.updatedAt) : new Date();
      const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      return {
        id: task._id,
        user: task.assignee?.name || 'A team member',
        text: `${action} task "${task.title}"`,
        time: timeString,
        initial: (task.assignee?.name || 'Member').charAt(0).toUpperCase()
      };
    });
  }, [tasks]);

  return (
    <div className="dashboard-page">
      
      {/* Onboarding Banner if no current org */}
      {!currentOrg && (
        <div className="onboarding-banner">
          <div className="onboarding-banner-left">
            <div className="onboarding-banner-icon"><FiPlus /></div>
            <div className="onboarding-banner-text">
              <h3 className="onboarding-banner-title">You're not part of any organisation yet</h3>
              <p className="onboarding-banner-sub">Create or join one to unlock team collaboration, projects, and more.</p>
            </div>
          </div>
          <Link to="/organisations/create" className="btn-primary" style={{ textDecoration: 'none', height: '32px', display: 'flex', alignItems: 'center' }}>
            <FiPlus /> Create Organisation
          </Link>
        </div>
      )}

      {/* Invites Banner */}
      {profile?.pendingInvites?.length > 0 && (
        <div className="onboarding-banner">
          <div className="onboarding-banner-left">
            <div className="onboarding-banner-icon"><FiPlus /></div>
            <div className="onboarding-banner-text">
              <h3 className="onboarding-banner-title">You have pending invites</h3>
              <p className="onboarding-banner-sub">Accept an invite to join the organisation and start collaborating.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {profile.pendingInvites.slice(0, 2).map((invite) => (
              <Link
                key={invite._id}
                to={`/invite/accept?token=${invite.token}&org=${invite.organisation?._id || ''}`}
                className="btn-primary"
                style={{ textDecoration: 'none', height: '32px', display: 'flex', alignItems: 'center' }}
              >
                Accept {invite.organisation?.name || 'Invite'}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Title block */}
      <div className="dashboard-greeting">
        <div className="dashboard-greeting-top">
          <div className="greeting-text">
            <h1 className="dashboard-title">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},
              <span className="name-accent"> {userInfo ? userInfo.name.split(' ')[0] : 'Guest'}</span>
            </h1>
            <p className="dashboard-subtitle">
              Here's an overview of your workspace today.
            </p>
          </div>
        </div>
      </div>

      {/* 4-card metric row */}
      <div className="stat-cards-row">
        <div className="stat-card">
          <div className="stat-value">{metricStats.projectsCount}</div>
          <span className="stat-label">Active Projects</span>
          <FiFolder className="stat-icon" />
        </div>
        <div className="stat-card">
          <div className="stat-value">{metricStats.tasksCount}</div>
          <span className="stat-label">Pending Tasks</span>
          <FiCheckSquare className="stat-icon" />
        </div>
        <div className="stat-card">
          <div className="stat-value">{metricStats.teamsCount}</div>
          <span className="stat-label">Total Teams</span>
          <FiUsers className="stat-icon" />
        </div>
        <div className="stat-card">
          <div className="stat-value">{metricStats.sessionsCount}</div>
          <span className="stat-label">Booked Sessions</span>
          <FiVideo className="stat-icon" />
        </div>
      </div>

      {/* 2-column details block */}
      <div className="dashboard-grid-layout">
        
        {/* Left Column: Recent Projects */}
        <div className="dashboard-column">
          <h2 className="column-title">Recent Projects</h2>
          <div className="list-container">
            {projects && projects.length > 0 ? (
              projects.slice(0, 3).map(project => (
                <Link key={project._id} to={`/project/${project._id}`} className="list-item">
                  <div className="list-item-left">
                    <span className="list-item-title">{project.name}</span>
                    <span className="list-item-meta">
                      {project.status || 'Active'} • {project.tasks?.length || 0} tasks
                    </span>
                  </div>
                  <div className="list-item-right">
                    <FiChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                </Link>
              ))
            ) : (
              <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No active projects found.
                {hasTeam && (
                  <Link to="/project/create" className="btn-primary" style={{ margin: '12px auto 0 auto', textDecoration: 'none' }}>
                    Create Project
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Upcoming Sessions */}
        <div className="dashboard-column">
          <h2 className="column-title">Upcoming Sessions</h2>
          <div className="list-container">
            {sessions?.upcoming && sessions.upcoming.length > 0 ? (
              sessions.upcoming.slice(0, 3).map(session => (
                <Link key={session._id} to={`/sessions/${session._id}`} className="list-item">
                  <div className="list-item-left">
                    <span className="list-item-title">{session.listing?.title || 'Skill Exchange Session'}</span>
                    <span className="list-item-meta">
                      {new Date(session.date).toLocaleDateString()} at {session.timeSlot}
                    </span>
                  </div>
                  <div className="list-item-right">
                    <span className="badge badge-pending">Upcoming</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No upcoming sessions booked.
                <Link to="/exchange" className="btn-secondary" style={{ margin: '12px auto 0 auto', textDecoration: 'none' }}>
                  Explore Exchange Board
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Activity Feed Section at Bottom */}
      <div className="activity-feed-section">
        <h2 className="column-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiActivity size={18} style={{ color: 'var(--accent-primary)' }} />
          Recent Activity
        </h2>
        <div className="activity-feed-list">
          {activities.map((act) => (
            <div key={act.id} className="activity-item">
              <div className="activity-avatar-dot">
                {act.initial}
              </div>
              <div className="activity-item-content">
                <strong>{act.user}</strong> {act.text}
              </div>
              <div className="activity-timestamp">
                {act.time}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HomeScreen;

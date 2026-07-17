import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaRegCopy, FaCheck, FaCodeBranch, FaUsers } from 'react-icons/fa';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { getTeamDetails } from '../actions/teamActions';
import GitActivity from '../components/GitActivity';
import './TeamDetailsScreen.css';
import api from '../utils/api';
import io from 'socket.io-client';
import { BACKEND_URL, SOCKET_URL } from '../config/runtime';

// Helper to calculate progress for project cards
const calculateProgress = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  return Math.round((completedTasks / tasks.length) * 100);
};

// Consistent pastel color from a string
const getPastelColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 60%, 78%)`;
};

// Resolve member avatar src — real photo → DiceBear initials fallback
const getMemberAvatar = (member) => {
  if (member.profileImage) {
    return member.profileImage.startsWith('data:image')
      ? member.profileImage
      : `${BACKEND_URL}${member.profileImage}`;
  }
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=solid&fontSize=40&fontWeight=700`;
};

// ── Clickable Member Card ──────────────────────────────────────
const MemberCard = ({ member }) => (
  <Link to={`/profile/${member._id}`} className="member-card" title={`View ${member.name}'s profile`}>
    <img
      className="member-card-avatar"
      src={getMemberAvatar(member)}
      alt={member.name}
      style={{ backgroundColor: getPastelColor(member._id) }}
    />
    <span className="member-card-name">{member.name}</span>
  </Link>
);

const TeamDetailsScreen = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [session, setSession] = useState(null);
  const [sessionError, setSessionError] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [orgMembers, setOrgMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [memberActionError, setMemberActionError] = useState(null);
  const [memberActionSuccess, setMemberActionSuccess] = useState(null);
  const [canManageMembers, setCanManageMembers] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const socketRef = useRef(null);

  const teamDetails = useSelector((state) => state.teamDetails);
  const { loading, error, team } = teamDetails;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  const token = userInfo?.token;

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return undefined;
    }

    dispatch(getTeamDetails(id));

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    const fetchSession = async () => {
      try {
        const { data } = await api.get(`/api/teams/${id}/sessions`);
        setSession(data);
      } catch {
        // No active session found
      }
    };

    const fetchUpcomingSessions = async () => {
      try {
        const { data } = await api.get(`/api/booking-sessions?team_id=${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const now = new Date();
        const upcoming = data.filter(s => {
          const scheduled = new Date(s.scheduled_at);
          return (s.status === 'pending' || s.status === 'confirmed') && scheduled > now;
        });
        setUpcomingSessions(upcoming);
      } catch (err) {
        console.error('Failed to fetch upcoming booked sessions', err);
      }
    };

    fetchSession();
    fetchUpcomingSessions();

    return () => {
      socketRef.current = null;
      socket.disconnect();
    };
  }, [dispatch, id, navigate, token]);

  useEffect(() => {
    const socket = socketRef.current;
    if (socket && id) {
      socket.emit('joinTeamRoom', id);

      socket.on('sessionStarted', (newSession) => {
        setSession(newSession);
      });

      socket.on('sessionEnded', () => {
        setSession(null);
      });

      return () => {
        socket.off('sessionStarted');
        socket.off('sessionEnded');
      };
    }
  }, [id]);

  useEffect(() => {
    const fetchOrgContext = async () => {
      if (!team?.organisation) {
        setOrgMembers([]);
        setCanManageMembers(Boolean(team?.permissions?.canManageMembers));
        return;
      }

      try {
        const [{ data: org }, { data: membersRes }] = await Promise.all([
          api.get(`/api/organisations/${team.organisation}`),
          api.get(`/api/organisations/${team.organisation}/members`),
        ]);

        const teamMemberIds = new Set((team.members || []).map((member) => member._id));
        const availableMembers = (membersRes.members || []).filter((member) => {
          const memberId = member.user?._id || member.userId || member.user;
          return memberId && !teamMemberIds.has(memberId);
        });

        setOrgMembers(availableMembers);
        setSelectedMemberId((currentValue) => currentValue || (availableMembers[0]?.user?._id || availableMembers[0]?.userId || ''));
        setCanManageMembers(Boolean(team?.permissions?.canManageMembers || org.permissions?.canManageTeams));
      } catch {
        setCanManageMembers(Boolean(team?.permissions?.canManageMembers));
      }
    };

    fetchOrgContext();
  }, [team]);

  const handleCopy = (val) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startSessionHandler = async () => {
    try {
      const { data } = await api.post(`/api/teams/${id}/sessions`, {});
      socketRef.current?.emit('startSession', data);
      setSession(data);
      navigate(`/team/${id}/session`);
    } catch (error) {
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      setSessionError(message);
    }
  };

  const endSessionHandler = async () => {
    try {
      await api.put(`/api/teams/${id}/sessions/${session._id}`, {});
      socketRef.current?.emit('endSession', session);
      setSession(null);
    } catch (error) {
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      setSessionError(message);
    }
  };

  const addMemberHandler = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    setMemberActionLoading(true);
    setMemberActionError(null);
    setMemberActionSuccess(null);

    try {
      await api.put(`/api/teams/${id}/members`, { userId: selectedMemberId });
      setMemberActionSuccess('Organisation member added to the team');
      setSelectedMemberId('');
      dispatch(getTeamDetails(id));
    } catch (error) {
      setMemberActionError(error.response?.data?.message || 'Failed to add member to the team');
    } finally {
      setMemberActionLoading(false);
    }
  };

  return (
    <div className="team-detail-container">
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : team && (
        <>
          <Link to="/teams" className="team-detail-nav">
            <FaChevronLeft />
            <span>Teams</span>
          </Link>

          {/* ── Page Header ── */}
          <div className="team-detail-header">
            <div className="team-detail-header-left">
              <h1 className="team-detail-title">{team.name}</h1>
              <div className="team-detail-badges">
                <span className="task-status-pill pending" style={{ textTransform: 'capitalize' }}>
                  {(team.type || 'study_group').replace('_', ' ')}
                </span>
                {team.subjectCode && (
                  <span className="task-status-pill inprogress">{team.subjectCode}</span>
                )}
              </div>
            </div>

            {/* Compact Team Info utility bar inline with header */}
            <div className="team-info-utility-bar">
              {/* ID copy row */}
              <div className="team-id-row">
                <span className="team-id-label">Team ID</span>
                <div className="team-id-field">
                  <span className="team-id-text">{team._id}</span>
                  <button
                    className="copy-id-btn"
                    onClick={() => handleCopy(team._id)}
                    title={copied ? 'Copied!' : 'Copy ID'}
                  >
                    {copied ? <FaCheck style={{ color: 'var(--success-color, #30d158)' }} /> : <FaRegCopy />}
                  </button>
                </div>
              </div>

              {/* Session actions */}
              {sessionError && <Message variant="danger">{sessionError}</Message>}
              <div className="team-session-actions">
                {session ? (
                  <>
                    <Link to={`/team/${id}/session`} className="btn btn-primary session-btn">
                      Join Session
                    </Link>
                    {session.startedBy === userInfo._id && (
                      <button className="btn btn-danger session-btn" onClick={endSessionHandler}>
                        End Session
                      </button>
                    )}
                  </>
                ) : (
                  <button className="btn btn-primary session-btn" onClick={startSessionHandler}>
                    Start Session
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming booked sessions (compact strip) */}
          {upcomingSessions.length > 0 && (
            <div className="upcoming-sessions-strip">
              <span className="upcoming-sessions-label">Upcoming</span>
              <div className="upcoming-sessions-list">
                {upcomingSessions.map(sess => {
                  const scheduledDate = new Date(sess.scheduled_at);
                  const diffMins = (scheduledDate - new Date()) / 1000 / 60;
                  const canJoin = diffMins <= 15 || scheduledDate <= new Date();
                  return (
                    <div key={sess.id} className="upcoming-session-chip">
                      <strong>{sess.skill?.name || 'Skill session'}</strong>
                      <span>{scheduledDate.toLocaleString()} · {sess.teacher?.name}</span>
                      {canJoin && (
                        <span className="task-status-pill inprogress" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="pulse-dot" /> Join Now
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Tab Bar ── */}
          <div className="team-tab-bar">
            <button
              className={`team-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`team-tab-btn ${activeTab === 'git' ? 'active' : ''}`}
              onClick={() => setActiveTab('git')}
            >
              <FaCodeBranch style={{ marginRight: 6, fontSize: '0.78rem' }} />
              Git Activity
            </button>
          </div>

          {/* ── Overview Tab ── */}
          {activeTab === 'overview' && (
            <>
              {/* Members — primary card */}
              <div className="detail-section-group detail-section-primary">
                <div className="detail-section-header">
                  <h2 className="detail-section-title">
                    Members
                    <span className="member-count-badge">{team.members ? team.members.length : 0}</span>
                  </h2>
                </div>

                {/* Add from org */}
                {team.organisation && canManageMembers && (
                  <div className="team-member-management">
                    <div className="team-member-management-copy">
                      Add members from the organisation — they'll inherit access to all linked projects.
                    </div>
                    {memberActionError && <Message variant="danger">{memberActionError}</Message>}
                    {memberActionSuccess && <Message variant="success">{memberActionSuccess}</Message>}
                    {orgMembers.length === 0 ? (
                      <div className="team-member-management-empty">All organisation members are already in this team.</div>
                    ) : (
                      <form className="team-member-management-form" onSubmit={addMemberHandler}>
                        <select
                          className="team-member-select"
                          value={selectedMemberId}
                          onChange={(e) => setSelectedMemberId(e.target.value)}
                        >
                          <option value="">Select organisation member</option>
                          {orgMembers.map((member) => {
                            const memberId = member.user?._id || member.userId || member.user;
                            return (
                              <option key={memberId} value={memberId}>
                                {member.user?.name || 'Unknown'} ({member.user?.email || 'No email'})
                              </option>
                            );
                          })}
                        </select>
                        <button className="btn btn-primary" type="submit" disabled={memberActionLoading || !selectedMemberId}>
                          {memberActionLoading ? 'Adding…' : 'Add Member'}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Member card grid */}
                {team.members && team.members.length > 0 ? (
                  <div className="member-card-grid">
                    {team.members.map((member) => (
                      <MemberCard key={member._id} member={member} />
                    ))}
                  </div>
                ) : (
                  <div className="members-empty-state">
                    <FaUsers className="members-empty-icon" />
                    <p>No members yet.</p>
                    <span>Invite teammates to start collaborating.</span>
                  </div>
                )}
              </div>

              {/* Ongoing Projects */}
              <div className="detail-section-group">
                <h2 className="detail-section-title">Ongoing Projects</h2>
                {team.projects && team.projects.length > 0 ? (
                  team.projects.map((project) => {
                    const progress = calculateProgress(project.tasks);
                    return (
                      <Link to={`/project/${project._id || project.id}`} key={project._id || project.id} className="project-link-card">
                        <div className="project-card-info">
                          <div className="project-card-name">{project.name}</div>
                          <div className="project-card-progress">
                            <div className="progress-bar-container">
                              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="progress-bar-label">{progress}%</span>
                          </div>
                        </div>
                        {project.dueDate && (
                          <div className="project-card-due-date">
                            Due: {new Date(project.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </Link>
                    );
                  })
                ) : (
                  <Message variant="info">No ongoing projects for this team.</Message>
                )}
              </div>
            </>
          )}

          {/* ── Git Activity Tab ── */}
          {activeTab === 'git' && (
            <div className="detail-section-group">
              <GitActivity team={team} userInfo={userInfo} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeamDetailsScreen;

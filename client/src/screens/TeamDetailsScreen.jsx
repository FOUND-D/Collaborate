import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaRegCopy, FaCheck } from 'react-icons/fa';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { getTeamDetails } from '../actions/teamActions';
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

// Helper to get a consistent pastel color from a string (e.g., user ID)
const getPastelColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 50%, 40%)`; // darker pastel for Refined theme
};

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
  
  // Tab State
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = ['Overview', 'Members', 'Projects', 'Sessions'];

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
    if (!socket) return;

    socket.emit('joinTeamRoom', id);

    socket.on('sessionStarted', (data) => {
      setSession(data);
    });

    socket.on('sessionEnded', () => {
      setSession(null);
    });

    return () => {
      socket.off('sessionStarted');
      socket.off('sessionEnded');
    };
  }, [id, team]);

  // Check if current user is owner or admin in organization to manage members
  useEffect(() => {
    if (team && userInfo) {
      const isTeamOwner = team.owner?._id === userInfo._id || team.owner === userInfo._id || team.owner === userInfo.id;
      setCanManageMembers(isTeamOwner);

      if (isTeamOwner && team.organisation) {
        const fetchOrgMembers = async () => {
          try {
            const { data } = await api.get(`/api/organisations/${team.organisation}/members`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            // Filter out members who are already in the team
            const teamMemberIds = new Set(team.members.map(m => m._id));
            const availableMembers = data.filter(m => {
              const mId = m.user?._id || m.userId || m.user;
              return mId && !teamMemberIds.has(mId);
            });
            setOrgMembers(availableMembers);
          } catch (err) {
            console.error('Failed to fetch org members', err);
          }
        };
        fetchOrgMembers();
      }
    }
  }, [team, userInfo, token]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startSessionHandler = async () => {
    try {
      setSessionError(null);
      const { data } = await api.post(`/api/teams/${id}/sessions`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSession(data);
      if (socketRef.current) {
        socketRef.current.emit('startSession', { teamId: id, session: data });
      }
      navigate(`/team/${id}/session`);
    } catch (err) {
      setSessionError(err.response?.data?.message || 'Failed to start session');
    }
  };

  const endSessionHandler = async () => {
    try {
      setSessionError(null);
      await api.delete(`/api/teams/${id}/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSession(null);
      if (socketRef.current) {
        socketRef.current.emit('endSession', { teamId: id });
      }
    } catch (err) {
      setSessionError(err.response?.data?.message || 'Failed to end session');
    }
  };

  const addMemberHandler = async (e) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    try {
      setMemberActionLoading(true);
      setMemberActionError(null);
      setMemberActionSuccess(null);

      await api.post(`/api/teams/${id}/members`, { userId: selectedMemberId }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMemberActionSuccess('Member added successfully!');
      setSelectedMemberId('');
      // Reload team details
      dispatch(getTeamDetails(id));
    } catch (err) {
      setMemberActionError(err.response?.data?.message || 'Failed to add member');
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <h1 className="team-detail-title" style={{ marginBottom: 0 }}>{team.name}</h1>
            <span className="badge badge-pending" style={{ textTransform: 'capitalize' }}>
              {(team.type || 'study_group').replace('_', ' ')}
            </span>
            {team.subjectCode && (
              <span className="badge badge-active">{team.subjectCode}</span>
            )}
          </div>

          {/* Tab buttons bar */}
          <div className="team-details-tabs">
            {tabs.map(tab => (
              <button
                key={tab}
                className={`team-details-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab contents */}
          {activeTab === 'Overview' && (
            <div className="detail-section-group">
              <h2 className="detail-section-title">Team Info</h2>
              <div className="copy-id-capsule">
                <span className="team-id-text">{team._id}</span>
                <button className="copy-id-btn" onClick={() => handleCopy(team._id)} title="Copy Team ID">
                  {copied ? <FaCheck style={{ color: 'var(--accent-success)' }} /> : <FaRegCopy />}
                </button>
              </div>
              {sessionError && <Message variant="danger">{sessionError}</Message>}
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                {session ? (
                  <>
                    <Link to={`/team/${id}/session`} className="btn btn-primary">
                      Join Active Session
                    </Link>
                    {session.startedBy === userInfo._id && (
                      <button className="btn btn-danger" onClick={endSessionHandler}>
                        End Session
                      </button>
                    )}
                  </>
                ) : (
                  <button className="btn btn-primary" onClick={startSessionHandler}>
                    Start Live Session
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Members' && (
            <div className="detail-section-group">
              <h2 className="detail-section-title">Members ({team.members ? team.members.length : 0})</h2>
              
              {team.organisation && canManageMembers && (
                <div className="team-member-management">
                  <div className="team-member-management-copy">
                    Add members from the organisation directly into this team. Projects linked to this team will inherit those members.
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
                        {memberActionLoading ? 'Adding...' : 'Add Member'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              <div className="member-chip-group">
                {team.members && team.members.map((member) => (
                  <div key={member._id} className="member-chip" title={member.name}>
                    <div 
                      className="member-avatar-circle" 
                      style={{ backgroundColor: getPastelColor(member._id) }}
                    >
                      {member.profileImage ? (
                        <img
                          src={
                            member.profileImage.startsWith('data:image')
                              ? member.profileImage
                              : `${BACKEND_URL}${member.profileImage}`
                          }
                          alt={member.name}
                        />
                      ) : (
                        member.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span>{member.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Projects' && (
            <div className="detail-section-group">
              <h2 className="detail-section-title">Ongoing Projects</h2>
              {team.projects && team.projects.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {team.projects.map((project) => {
                    const progress = calculateProgress(project.tasks);
                    return (
                      <Link to={`/project/${project._id || project.id}`} key={project._id || project.id} className="project-link-card">
                        <div className="project-card-info">
                          <div className="project-card-name">{project.name}</div>
                          <div className="project-card-progress">
                            <div className="progress-bar-container">
                              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{progress}%</span>
                          </div>
                        </div>
                        {project.dueDate && (
                          <div className="project-card-due-date">
                            Due: {new Date(project.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <Message variant="info">No ongoing projects for this team.</Message>
              )}
            </div>
          )}

          {activeTab === 'Sessions' && (
            <div className="detail-section-group">
              <h2 className="detail-section-title">Upcoming Booked Sessions</h2>
              {upcomingSessions.length > 0 ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {upcomingSessions.map(sess => {
                    const scheduledDate = new Date(sess.scheduled_at);
                    const now = new Date();
                    const diffMins = (scheduledDate - now) / 1000 / 60;
                    const canJoin = diffMins <= 15 || scheduledDate <= now;

                    return (
                      <div key={sess.id} className="phase2-glass">
                        <div>
                          <strong>{sess.skill?.name || 'Skill session'}</strong>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            {scheduledDate.toLocaleString()} • Booked by {sess.teacher?.name}
                          </div>
                        </div>
                        {canJoin && (
                          <span className="badge badge-active" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="pulse-dot"></span> Active Session
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Message variant="info">No upcoming booked sessions for this team.</Message>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeamDetailsScreen;

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
  return `hsl(${h}, 70%, 85%)`;
};


const TeamDetailsScreen = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [meeting, setMeeting] = useState(null);
  const [meetingError, setMeetingError] = useState(null);
  const [orgMembers, setOrgMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [memberActionError, setMemberActionError] = useState(null);
  const [memberActionSuccess, setMemberActionSuccess] = useState(null);
  const [canManageMembers, setCanManageMembers] = useState(false);
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

    const fetchMeeting = async () => {
      try {
        const { data } = await api.get(`/api/teams/${id}/meetings`);
        setMeeting(data);
      } catch {
        // No active meeting found
      }
    };
    fetchMeeting();

    return () => {
      socketRef.current = null;
      socket.disconnect();
    };
  }, [dispatch, id, navigate, token]);

  useEffect(() => {
    const socket = socketRef.current;
    if (socket && id) {
      socket.emit('joinTeamRoom', id);

      socket.on('meetingStarted', (newMeeting) => {
        setMeeting(newMeeting);
      });

      socket.on('meetingEnded', () => {
        setMeeting(null);
      });

      return () => {
        socket.off('meetingStarted');
        socket.off('meetingEnded');
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

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  const startMeetingHandler = async () => {
    try {
      const { data } = await api.post(`/api/teams/${id}/meetings`, {});
      socketRef.current?.emit('startMeeting', data);
      setMeeting(data);
      navigate(`/team/${id}/meeting`);
    } catch (error) {
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      setMeetingError(message);
    }
  };

  const endMeetingHandler = async () => {
    try {
      await api.put(`/api/teams/${id}/meetings/${meeting._id}`, {});
      socketRef.current?.emit('endMeeting', meeting);
      setMeeting(null);
    } catch (error) {
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      setMeetingError(message);
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

          <h1 className="team-detail-title">{team.name}</h1>

          <div className="detail-section-group">
            <h2 className="detail-section-title">Team Info</h2>
            <div className="copy-id-capsule">
              <span className="team-id-text">{team._id}</span>
              <button className="copy-id-btn" onClick={() => handleCopy(team._id)}>
                {copied ? <FaCheck style={{ color: 'green' }} /> : <FaRegCopy />}
              </button>
            </div>
            {meetingError && <Message variant="danger">{meetingError}</Message>}
            {meeting ? (
              <>
                <Link to={`/team/${id}/meeting`} className="btn btn-primary">
                  Join Meeting
                </Link>
                {meeting.startedBy === userInfo._id && (
                  <button className="btn btn-danger" onClick={endMeetingHandler}>
                    End Meeting
                  </button>
                )}
              </>
            ) : (
              <button className="btn btn-primary" onClick={startMeetingHandler}>
                Start Meeting
              </button>
            )}
          </div>

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

          <div className="detail-section-group">
            <h2 className="detail-section-title">Ongoing Projects</h2>
            {team.projects && team.projects.length > 0 ? (
                team.projects.map((project) => {
                    const progress = calculateProgress(project.tasks);
                    return (
                        <Link to={`/project/${project._id}`} key={project._id} className="project-link-card">
                            <div className="project-card-info">
                                <div className="project-card-name">{project.name}</div>
                                <div className="project-card-progress">
                                    <div className="progress-bar-container">
                                        <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            {project.dueDate && (
                                <div className="project-card-due-date">
                                    Due: {new Date(project.dueDate).toLocaleDateString()}
                                </div>
                            )}
                        </Link>
                    )
                })
            ) : (
                <Message variant="info">No ongoing projects for this team.</Message>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TeamDetailsScreen;

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaRegCopy, FaCheck } from 'react-icons/fa';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { getTeamDetails } from '../actions/teamActions';
import axios from 'axios';
import io from 'socket.io-client';

let socket; // Declare socket once globally

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

  const teamDetails = useSelector((state) => state.teamDetails);
  const { loading, error, team } = teamDetails;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  useEffect(() => {
    dispatch(getTeamDetails(id));

    socket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3002');

    const fetchMeeting = async () => {
      try {
        const { data } = await axios.get(`/api/teams/${id}/meetings`, {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        });
        setMeeting(data);
      } catch (error) {
        // No active meeting found
      }
    };
    fetchMeeting();

    return () => {
      socket.disconnect();
    };
  }, [dispatch, id, userInfo.token]);

  useEffect(() => {
    if (socket && id) {
      socket.emit('joinTeamRoom', id);

      socket.on('meetingStarted', (newMeeting) => {
        setMeeting(newMeeting);
      });

      socket.on('meetingEnded', () => {
        setMeeting(null);
      });
    }
  }, [socket, id]);

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  const startMeetingHandler = async () => {
    try {
      const { data } = await axios.post(`/api/teams/${id}/meetings`, {}, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      });
      socket.emit('startMeeting', data);
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
      await axios.put(`/api/teams/${id}/meetings/${meeting._id}`, {}, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      });
      socket.emit('endMeeting', meeting);
      setMeeting(null);
    } catch (error) {
      const message =
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message;
      setMeetingError(message);
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
            <div className="member-chip-group">
              {team.members && team.members.map((member) => (
                <div key={member._id} className="member-chip" title={member.name}>
                  <div 
                    className="member-avatar-circle" 
                    style={{ backgroundColor: getPastelColor(member._id) }}
                  >
                    {member.name.charAt(0).toUpperCase()}
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

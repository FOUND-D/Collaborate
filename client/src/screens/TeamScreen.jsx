import React, { useState, useEffect } from 'react';
import './TeamScreen.css';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { FaPlus, FaUsers, FaEdit, FaTrash, FaCheck, FaTimes, FaUser, FaArrowRight } from 'react-icons/fa';

import Message from '../components/Message';
import Loader from '../components/Loader';
import { listTeams, createTeam, joinTeam, deleteTeam, updateTeamJoinRequest } from '../actions/teamActions';
import { TEAM_CREATE_RESET, TEAM_JOIN_RESET, TEAM_DELETE_SUCCESS } from '../constants/teamConstants';


const getInitials = (name) => {
  if (!name) return '';
  const words = name.split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

const TeamScreen = () => {

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [createTeamName, setCreateTeamName] = useState('');
  const [joinTeamId, setJoinTeamId] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const teamList = useSelector((state) => state.teamList);
  const { loading, error, teams } = teamList;

  const teamCreate = useSelector((state) => state.teamCreate);
  const {
    loading: loadingCreate,
    error: errorCreate,
    success: successCreate,
  } = teamCreate;

  const teamJoin = useSelector((state) => state.teamJoin);
  const {
    loading: loadingJoin,
    error: errorJoin,
    success: successJoin,
    message: joinTeamMessage,
  } = teamJoin;

  const teamDelete = useSelector((state) => state.teamDelete);
  const {
    loading: loadingDelete,
    error: errorDelete,
    success: successDelete,
  } = teamDelete;

  const teamUpdateJoinRequest = useSelector((state) => state.teamUpdateJoinRequest);
  const {
    loading: loadingUpdateJoinRequest,
    error: errorUpdateJoinRequest,
    success: successUpdateJoinRequest,
    message: updateJoinRequestMessage,
  } = teamUpdateJoinRequest;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  useEffect(() => {
    dispatch({ type: TEAM_CREATE_RESET });
    dispatch({ type: TEAM_JOIN_RESET });

    if (!userInfo || !userInfo.token || userInfo.token.trim() === '') {
      navigate('/login');
    } else {
      dispatch(listTeams());
    }

    if (successCreate) {
      setShowCreate(false);
      setCreateTeamName('');
      dispatch(listTeams());
    }

    if (successJoin) {
        setShowJoin(false);
        setJoinTeamId('');
        dispatch(listTeams());
    }

    if (successDelete) {
      dispatch({ type: TEAM_DELETE_SUCCESS });
      dispatch(listTeams());
    }

    if (successUpdateJoinRequest) {
      dispatch(listTeams());
    }

  }, [dispatch, navigate, userInfo, successCreate, successJoin, successDelete, successUpdateJoinRequest]);

  const handleCloseCreate = () => setShowCreate(false);
  const handleShowCreate = () => setShowCreate(true);

  const handleCloseJoin = () => setShowJoin(false);
  const handleShowJoin = () => setShowJoin(true);

  const submitCreateTeamHandler = (e) => {
    e.preventDefault();
    dispatch(createTeam(createTeamName));
  };

  const submitJoinTeamHandler = (e) => {
    e.preventDefault();
    dispatch(joinTeam(joinTeamId));
  };

  const handleJoinRequest = (teamId, userId, action) => {
    dispatch(updateTeamJoinRequest(teamId, userId, action));
  };

  const deleteHandler = (id) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      dispatch(deleteTeam(id));
    }
  };

  const teamsWithPendingRequests = teams && teams.filter(team =>
    userInfo && team.owner && team.owner._id === userInfo._id && team.pendingJoinRequests && team.pendingJoinRequests.length > 0
  );

  return (
    <div className="teams-dashboard-page">
      <div className="project-hero-header">
        <h1 className="project-detail-title">Your Teams</h1>
        <p className="project-detail-goal">
            Manage your teams, create new ones, or join existing collaborations.
        </p>
      </div>

      <div className="action-cards-grid">
        <div className="action-card" onClick={handleShowCreate}>
          <FaPlus className="action-card-icon" />
          <h3 className="action-card-title">Create New Team</h3>
          <p className="action-card-description">Start a new collaboration hub.</p>
          <span className="action-card-link">
            Create Team <FaArrowRight />
          </span>
        </div>
        <div className="action-card" onClick={handleShowJoin}>
          <FaUsers className="action-card-icon" />
          <h3 className="action-card-title">Join Existing Team</h3>
          <p className="action-card-description">Connect with an existing team.</p>
          <span className="action-card-link">
            Join Team <FaArrowRight />
          </span>
        </div>
      </div>

      {teamsWithPendingRequests.length > 0 && (
        <div className="pending-requests-section">
          <h2 className="section-title">Pending Join Requests</h2>
          <div className="requests-list">
            {teamsWithPendingRequests.map(team => (
              <div key={team._id} className="request-item">
                <p><strong>{team.name}</strong> has requests from:</p>
                <ul>
                  {team.pendingJoinRequests.map(requestingUser => (
                    <li key={requestingUser._id}>
                      <span>{requestingUser.name}</span>
                      <button className="btn btn-icon btn-success btn-small" onClick={() => handleJoinRequest(team._id, requestingUser._id, 'approve')}>
                        <FaCheck />
                      </button>
                      <button className="btn btn-icon btn-danger btn-small" onClick={() => handleJoinRequest(team._id, requestingUser._id, 'reject')}>
                        <FaTimes />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {loadingDelete && <Loader />}
      {errorDelete && <Message variant='danger'>{errorDelete}</Message>}
      {loadingUpdateJoinRequest && <Loader />}
      {errorUpdateJoinRequest && <Message variant='danger'>{errorUpdateJoinRequest}</Message>}
      {successUpdateJoinRequest && <Message variant='success'>{updateJoinRequestMessage}</Message>}

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <div className="modern-team-list">
          {teams.length === 0 ? (
            <div className="empty-state-container">
                <Message variant='info'>No teams found. Create or join one!</Message>
            </div>
          ) : (
            teams.map((team) => (
              <div
                key={team._id}
                className="team-card"
                onClick={() => navigate(`/team/${team._id}`)}
              >
                <div className="team-card-content">
                  <div className="team-card-header-wrapper">
                    <div className="team-avatar" style={{ backgroundColor: team.color || '#a78bfa' }}>
                      {getInitials(team.name)}
                    </div>
                    <h3 className="team-card-name">{team.name}</h3>
                  </div>
                  <div className="team-card-meta">
                    {team.owner && (
                      <div className="team-card-meta-item">
                        <FaUser />
                        <span>{team.owner.name} (Owner)</span>
                      </div>
                    )}
                    <div className="team-card-meta-item">
                      <FaUsers />
                      <span>{team.members.length} Members</span>
                    </div>
                  </div>
                </div>

                {userInfo && team.owner && team.owner._id === userInfo._id && (
                  <FaTrash
                    className="team-card-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteHandler(team._id);
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create Team</h3>
              <button className="modal-close-btn" onClick={handleCloseCreate}>&times;</button>
            </div>
            <div className="modal-body">
              {loadingCreate && <Loader />}
              {errorCreate && <Message variant='danger'>{errorCreate}</Message>}
              <form onSubmit={submitCreateTeamHandler}>
                <div className="form-group floating-label">
                  <input
                    type="text"
                    id="createTeamName"
                    className="form-input"
                    placeholder=" "
                    value={createTeamName}
                    onChange={(e) => setCreateTeamName(e.target.value)}
                  />
                  <label htmlFor="createTeamName">Team Name</label>
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseCreate}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Create</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Join Team Modal */}
      {showJoin && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Join Team</h3>
              <button className="modal-close-btn" onClick={handleCloseJoin}>&times;</button>
            </div>
            <div className="modal-body">
              {loadingJoin && <Loader />}
              {errorJoin && <Message variant='danger'>{errorJoin}</Message>}
              {successJoin && <Message variant='success'>{joinTeamMessage}</Message>}
              <form onSubmit={submitJoinTeamHandler}>
                <div className="form-group floating-label">
                  <input
                    type="text"
                    id="joinTeamId"
                    className="form-input"
                    placeholder=" "
                    value={joinTeamId}
                    onChange={(e) => setJoinTeamId(e.target.value)}
                  />
                  <label htmlFor="joinTeamId">Team ID</label>
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseJoin}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Join</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamScreen;

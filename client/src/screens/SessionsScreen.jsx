import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaCalendar, FaClock, FaVideo, FaGraduationCap, FaUser } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { RATING_CREATE_RESET } from '../constants/ratingConstants';
import { SESSION_STATUS_RESET } from '../constants/sessionConstants';
import { listSessions } from '../actions/sessionActions';
import { listTeams } from '../actions/teamActions';
import RatingPromptModal from '../components/RatingPromptModal';
import BookSessionModal from '../components/BookSessionModal';
import api from '../utils/api';
import './SkillExchange.css';

const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:3002' : '/';

const SessionsScreen = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.userLogin || {});
  const { sessions = {}, loading } = useSelector((state) => state.sessionList || {});
  const sessionStatus = useSelector((state) => state.sessionStatus || {});
  const { success: ratingCreateSuccess } = useSelector((state) => state.ratingCreate || {});
  const [tab, setTab] = useState('upcoming');
  const [ratingSession, setRatingSession] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    dispatch(listSessions());
    dispatch(listTeams());
  }, [dispatch]);

  useEffect(() => {
    if (!userInfo?._id) return;
    const socket = io(SOCKET_URL);
    socket.emit('userJoined', { teamId: 'global', user: userInfo });
    
    socket.on('sessionCreated', () => {
      dispatch(listSessions());
    });

    return () => socket.disconnect();
  }, [dispatch, userInfo]);

  useEffect(() => {
    if (sessionStatus?.session?.status === 'completed') {
      setRatingSession(sessionStatus.session);
      setTab('past');
      dispatch({ type: SESSION_STATUS_RESET });
    }
  }, [dispatch, sessionStatus]);

  useEffect(() => {
    if (!ratingCreateSuccess) return;

    setRatingSession(null);
    dispatch(listSessions());
    dispatch({ type: RATING_CREATE_RESET });
  }, [dispatch, ratingCreateSuccess]);

  const activeSessions = useMemo(
    () => (tab === 'upcoming' ? sessions.upcoming || [] : sessions.past || []),
    [sessions, tab]
  );

  return (
    <div className="phase2-page">
      <div className="phase2-shell">
        <div className="phase2-hero">
          <div>
            <span className="phase2-badge"><FaVideo /> Session pipeline</span>
            <h1>My sessions</h1>
            <p>Track booked exchanges, manage confirmations, and close out completed sessions with ratings.</p>
          </div>
          <div style={{ alignSelf: 'flex-start' }}>
            <button className="phase2-button phase2-button-primary" onClick={() => setIsBookingModalOpen(true)}>
              + Book Session
            </button>
          </div>
        </div>

        <div className="phase2-tabs phase2-glass">
          <button className={tab === 'upcoming' ? 'active' : ''} onClick={() => setTab('upcoming')}>Upcoming</button>
          <button className={tab === 'past' ? 'active' : ''} onClick={() => setTab('past')}>Past</button>
        </div>

        <motion.div layout className="phase2-session-list">
          {loading ? (
            <div className="phase2-empty phase2-glass">Loading sessions...</div>
          ) : activeSessions.length === 0 ? (
            <div className="phase2-empty phase2-glass">No {tab} sessions found.</div>
          ) : (
            activeSessions.map((session) => {
              const isLive = session.sessionType === 'live';
              const statusClass = session.status === 'active' ? 'status-inprogress' : 
                                session.status === 'pending' ? 'status-pending' :
                                session.status === 'confirmed' ? 'status-todo' :
                                session.status === 'completed' ? 'status-completed' : 'status-blocked';
              
              return (
                <motion.div key={session._id} layout className="phase2-session-card phase2-glass">
                  <div style={{ flex: 1 }}>
                    <div className="phase2-card-topline">
                      <span className={`phase2-badge ${isLive ? 'phase2-badge-ai' : 'subtle'}`} style={{ textTransform: 'none', padding: '4px 10px', fontSize: '0.7rem' }}>
                        {isLive ? 'Live Session' : 'Booked Session'}
                      </span>
                      <span className={`phase2-pill ${statusClass}`}>
                        {session.status === 'active' && <span className="pulse-dot" />}
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                    </div>
                    
                    <h3>
                      {isLive ? (
                        <><FaVideo style={{ fontSize: '0.9rem', marginRight: '6px' }} /> {session.teamName}</>
                      ) : (
                        <><FaGraduationCap style={{ fontSize: '0.9rem', marginRight: '6px' }} /> {session.listing?.skill?.name || 'Skill session'}</>
                      )}
                    </h3>
                    
                    <div className="phase2-card-meta">
                      {isLive ? (
                        <>
                          <span><FaUser /> Started by {session.starterName}</span>
                          <span><FaCalendar /> {new Date(session.createdAt).toLocaleDateString()}</span>
                        </>
                      ) : (
                        <>
                          <span><FaUser /> {session.listing?.user?.name || session.teacher?.name || 'Partner'}</span>
                          <span><FaCalendar /> {new Date(session.scheduledAt).toLocaleDateString()}</span>
                          <span><FaClock /> {session.durationMin} min</span>
                        </>
                      )}
                    </div>
                  </div>

                  {isLive ? (
                    session.status === 'active' ? (
                      <Link to={`/team/${session.team}/session`} className="phase2-button phase2-button-primary">
                        Join Session
                      </Link>
                    ) : (
                      <span className="phase2-empty" style={{ padding: 0 }}>Session ended</span>
                    )
                  ) : (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {session.status === 'completed' && !session.rated && (
                        <button className="phase2-button phase2-button-primary" onClick={() => setRatingSession(session)}>
                          Rate Session
                        </button>
                      )}
                      {(session.status === 'pending' || session.status === 'confirmed') && (
                        <button 
                          className="phase2-button phase2-button-secondary phase2-button-danger" 
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to cancel this session?')) {
                              try {
                                await api.patch(`/api/booking-sessions/${session.id || session._id}/cancel`, {}, {
                                  headers: { Authorization: `Bearer ${userInfo.token}` }
                                });
                                dispatch(listSessions());
                              } catch (err) {
                                console.error('Failed to cancel session:', err);
                                alert(err.response?.data?.message || 'Failed to cancel session. Please try again later.');
                              }
                            }
                          }}
                        >
                          Cancel
                        </button>
                      )}
                      <Link to={`/sessions/${session._id}`} className="phase2-button phase2-button-secondary">
                        View Details
                      </Link>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </motion.div>

        <RatingPromptModal session={ratingSession} isOpen={Boolean(ratingSession)} onClose={() => setRatingSession(null)} />
        <BookSessionModal 
          isOpen={isBookingModalOpen} 
          onClose={() => setIsBookingModalOpen(false)} 
          onBooked={() => dispatch(listSessions())}
        />
      </div>
    </div>
  );
};

export default SessionsScreen;

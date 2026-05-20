import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaCalendar, FaClock, FaVideo } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { listSessions } from '../actions/sessionActions';
import RatingPromptModal from '../components/RatingPromptModal';
import './SkillExchange.css';

const SessionsScreen = () => {
  const dispatch = useDispatch();
  const { sessions = { upcoming: [], past: [] }, loading } = useSelector((state) => state.sessionList);
  const sessionStatus = useSelector((state) => state.sessionStatus);
  const [tab, setTab] = useState('upcoming');
  const [ratingSession, setRatingSession] = useState(null);

  useEffect(() => {
    dispatch(listSessions());
  }, [dispatch]);

  useEffect(() => {
    if (sessionStatus?.session?.status === 'completed') {
      setRatingSession(sessionStatus.session);
      setTab('past');
    }
  }, [sessionStatus]);

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
            activeSessions.map((session) => (
              <motion.div key={session._id} layout className="phase2-session-card phase2-glass">
                <div>
                  <div className="phase2-card-topline">
                    <span className="phase2-pill subtle">{session.status}</span>
                    <span className="phase2-pill">{session.listing?.skill?.name || 'Skill session'}</span>
                  </div>
                  <h3>{session.listing?.user?.name || session.teacher?.name || 'Session partner'}</h3>
                  <div className="phase2-card-meta">
                    <span><FaCalendar /> {new Date(session.scheduledAt).toLocaleDateString()}</span>
                    <span><FaClock /> {session.durationMin} min</span>
                  </div>
                </div>
                <Link to={`/sessions/${session._id}`} className="phase2-button phase2-button-secondary">
                  View session
                </Link>
              </motion.div>
            ))
          )}
        </motion.div>

        <RatingPromptModal session={ratingSession} isOpen={Boolean(ratingSession)} onClose={() => setRatingSession(null)} />
      </div>
    </div>
  );
};

export default SessionsScreen;

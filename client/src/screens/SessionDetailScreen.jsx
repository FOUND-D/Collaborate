import React, { useEffect, useMemo, useState } from 'react';
import { FaCalendarAlt, FaCheckCircle, FaCoins, FaDoorOpen, FaTimesCircle, FaVideo } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { RATING_CREATE_RESET } from '../constants/ratingConstants';
import { SESSION_STATUS_RESET } from '../constants/sessionConstants';
import { cancelSession, completeSession, confirmSession, listSessions } from '../actions/sessionActions';
import RatingPromptModal from '../components/RatingPromptModal';
import './SkillExchange.css';

const SessionDetailScreen = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { sessions = { upcoming: [], past: [] }, loading } = useSelector((state) => state.sessionList);
  const sessionStatus = useSelector((state) => state.sessionStatus);
  const { success: ratingCreateSuccess } = useSelector((state) => state.ratingCreate);
  const [showRating, setShowRating] = useState(false);

  useEffect(() => {
    dispatch(listSessions());
  }, [dispatch]);

  useEffect(() => {
    if (sessionStatus?.session?._id === id && sessionStatus?.session?.status === 'completed') {
      setShowRating(true);
      dispatch({ type: SESSION_STATUS_RESET });
    }
  }, [dispatch, sessionStatus, id]);

  useEffect(() => {
    if (!ratingCreateSuccess) return;

    setShowRating(false);
    dispatch(listSessions());
    dispatch({ type: RATING_CREATE_RESET });
  }, [dispatch, ratingCreateSuccess]);

  const session = useMemo(
    () => [...(sessions.upcoming || []), ...(sessions.past || [])].find((entry) => entry._id === id),
    [sessions, id]
  );

  if (loading || !session) {
    return (
      <div className="phase2-page">
        <div className="phase2-shell">
          <div className="phase2-empty phase2-glass">Loading session details...</div>
        </div>
      </div>
    );
  }

  const meetingHref = session.meeting?.team ? `/team/${session.meeting.team}/meeting` : null;

  return (
    <div className="phase2-page">
      <div className="phase2-shell">
        <div className="phase2-detail-grid">
          <section className="phase2-detail-main phase2-glass">
            <div className="phase2-card-topline">
              <span className="phase2-pill subtle">{session.status}</span>
              <span className="phase2-pill">{session.listing?.skill?.name || 'Skill session'}</span>
            </div>
            <h1>Session detail</h1>
            <p className="phase2-detail-copy">{session.agenda || 'No agenda has been added yet for this session.'}</p>

            <div className="phase2-detail-metrics">
              <div><FaCalendarAlt /> {new Date(session.scheduledAt).toLocaleString()}</div>
              <div><FaCoins /> {session.creditsTransacted ?? session.listing?.creditRate ?? 0} credits</div>
              <div><FaVideo /> {session.meetingId ? 'Meeting linked' : 'Meeting not linked yet'}</div>
            </div>

            <div className="phase2-detail-actions">
              <button type="button" className="phase2-button phase2-button-primary" onClick={() => dispatch(confirmSession(session._id))}>
                {(typeof FaCheckCircle !== 'undefined') ? <FaCheckCircle /> : <svg width="16" height="16" viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }} xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm-1 14.5l-5-5 1.41-1.41L11 13.67l6.59-6.59L19 8.5l-8 8z"/></svg>} Confirm
              </button>
              <button type="button" className="phase2-button phase2-button-secondary" onClick={() => dispatch(cancelSession(session._id))}>
                <FaTimesCircle /> Cancel
              </button>
              <button type="button" className="phase2-button phase2-button-secondary" onClick={() => dispatch(completeSession(session._id))}>
                <FaDoorOpen /> Complete
              </button>
              {meetingHref ? (
                <Link className="phase2-button phase2-button-primary" to={meetingHref}>
                  <FaVideo /> Join video room
                </Link>
              ) : (
                <button type="button" className="phase2-button phase2-button-secondary" disabled>
                  Join video room
                </button>
              )}
            </div>
          </section>

          <aside className="phase2-detail-side phase2-glass">
            <span className="phase2-badge">Participants</span>
            <div className="phase2-session-side-list">
              <div className="phase2-session-side-person">
                <div className="phase2-avatar">{session.teacher?.name?.charAt(0)?.toUpperCase() || 'T'}</div>
                <div>
                  <strong>{session.teacher?.name || 'Teacher'}</strong>
                  <p>Teacher</p>
                </div>
              </div>
              <div className="phase2-session-side-person">
                <div className="phase2-avatar">{session.learner?.name?.charAt(0)?.toUpperCase() || 'L'}</div>
                <div>
                  <strong>{session.learner?.name || 'Learner'}</strong>
                  <p>Learner</p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <RatingPromptModal session={sessionStatus?.session?._id === id ? sessionStatus.session : session} isOpen={showRating} onClose={() => setShowRating(false)} />
      </div>
    </div>
  );
};

export default SessionDetailScreen;

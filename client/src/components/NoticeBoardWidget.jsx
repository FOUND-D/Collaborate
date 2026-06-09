import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaBullhorn, FaCalendarAlt, FaPlus, FaCheck, FaTrash, FaUser } from 'react-icons/fa';
import { 
  listAnnouncements, 
  createAnnouncement, 
  rsvpAnnouncement, 
  deleteAnnouncement 
} from '../actions/announcementActions';
import { ANNOUNCEMENT_CREATE_RESET } from '../constants/announcementConstants';
import Loader from './Loader';
import './NoticeBoardWidget.css';

const NoticeBoardWidget = () => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [teamId, setTeamId] = useState('');

  const dispatch = useDispatch();

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const announcementList = useSelector((state) => state.announcementList);
  const { loading, error, announcements = [] } = announcementList;

  const announcementCreate = useSelector((state) => state.announcementCreate);
  const { loading: loadingCreate, success: successCreate, error: errorCreate } = announcementCreate;

  const teamList = useSelector((state) => state.teamList);
  const { teams } = teamList;

  useEffect(() => {
    dispatch(listAnnouncements());
  }, [dispatch]);

  useEffect(() => {
    if (successCreate) {
      setShowModal(false);
      setTitle('');
      setBody('');
      setEventDate('');
      setTeamId('');
      dispatch({ type: ANNOUNCEMENT_CREATE_RESET });
      dispatch(listAnnouncements());
    }
  }, [successCreate, dispatch]);

  const handleRsvp = (id) => {
    dispatch(rsvpAnnouncement(id));
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this announcement?')) {
      dispatch(deleteAnnouncement(id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createAnnouncement({
      title,
      body,
      event_date: eventDate || null,
      team_id: teamId || null
    }));
  };

  return (
    <div className="notice-board-widget">
      <div className="widget-header">
        <div className="title-group">
          <FaBullhorn className="header-icon" />
          <h2>Notice Board</h2>
        </div>
        {(userInfo.role === 'faculty' || userInfo.role === 'admin') && (
          <button className="post-announcement-btn" onClick={() => setShowModal(true)}>
            <FaPlus /> Post
          </button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : announcements.length === 0 ? (
        <div className="empty-announcements">
          <p>No announcements yet.</p>
        </div>
      ) : (
        <div className="announcements-list">
          {announcements.slice(0, 5).map(announcement => (
            <div key={announcement.id} className="announcement-card">
              <div className="card-top">
                <h3 className="announcement-title">{announcement.title}</h3>
                {(announcement.authorId === userInfo._id || userInfo.role === 'admin') && (
                  <button className="delete-btn" onClick={() => handleDelete(announcement.id)}>
                    <FaTrash />
                  </button>
                )}
              </div>
              <p className="announcement-body">{announcement.body}</p>
              
              <div className="announcement-meta">
                <div className="meta-left">
                  <span className="author">
                    <FaUser /> {announcement.authorName}
                  </span>
                  {announcement.eventDate && (
                    <span className="event-date">
                      <FaCalendarAlt /> Event: {new Date(announcement.eventDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <button 
                  className={`rsvp-btn ${announcement.hasRsvped ? 'active' : ''}`}
                  onClick={() => handleRsvp(announcement.id)}
                >
                  {announcement.hasRsvped ? <FaCheck /> : 'Going?'} ({announcement.rsvpCount})
                </button>
              </div>
            </div>
          ))}
          {announcements.length > 5 && (
            <button className="view-all-link">View all announcements</button>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content announcement-modal">
            <div className="modal-header">
              <h2>Post Announcement</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                  placeholder="e.g. Guest Lecture: AI in Healthcare"
                />
              </div>
              <div className="form-group">
                <label>Message *</label>
                <textarea 
                  value={body} 
                  onChange={(e) => setBody(e.target.value)} 
                  required
                  placeholder="Details about the announcement..."
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Event Date (Optional)</label>
                  <input 
                    type="datetime-local" 
                    value={eventDate} 
                    onChange={(e) => setEventDate(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Visible to Team (Optional)</label>
                  <select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                    <option value="">Department-wide</option>
                    {teams?.map(team => (
                      <option key={team._id} value={team._id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {errorCreate && <div className="error-message">{errorCreate}</div>}
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={loadingCreate}>
                  {loadingCreate ? 'Posting...' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeBoardWidget;

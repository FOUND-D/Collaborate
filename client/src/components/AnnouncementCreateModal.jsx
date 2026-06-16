import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus } from 'react-icons/fa';
import api from '../utils/api';

const AnnouncementCreateModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    event_date: '',
    team_id: ''
  });
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchTeams();
    }
  }, [isOpen]);

  const fetchTeams = async () => {
    try {
      const { data } = await api.get('/api/teams');
      setTeams(data || []);
    } catch (err) {
      console.error('Failed to fetch teams');
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/api/announcements', formData);
      onSuccess();
      onClose();
      setFormData({ title: '', body: '', event_date: '', team_id: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal">
        <div className="modal-header">
          <h3>Post New Announcement</h3>
          <button onClick={onClose}><FaTimes /></button>
        </div>
        <form onSubmit={submitHandler} className="admin-form">
          {error && <div className="field-error-msg">{error}</div>}
          
          <div className="field-group">
            <label>Title</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              required 
              placeholder="Announcement headline"
            />
          </div>

          <div className="field-group">
            <label>Body Content</label>
            <textarea 
              value={formData.body} 
              onChange={e => setFormData({...formData, body: e.target.value})}
              required 
              placeholder="Detailed information..."
              rows={4}
            />
          </div>

          <div className="field-group">
            <label>Event Date (Optional)</label>
            <input 
              type="date" 
              value={formData.event_date} 
              onChange={e => setFormData({...formData, event_date: e.target.value})}
            />
          </div>

          <div className="field-group">
            <label>Restrict to Team (Optional)</label>
            <select 
              value={formData.team_id} 
              onChange={e => setFormData({...formData, team_id: e.target.value})}
              className="admin-select"
            >
              <option value="">University-Wide (Public)</option>
              {teams.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Posting...' : 'Post Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementCreateModal;

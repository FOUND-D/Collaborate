import React, { useState } from 'react';
import { FaFlag, FaTimes, FaSpinner } from 'react-icons/fa';
import api from '../utils/api';

const FlagRatingModal = ({ rating, isOpen, onClose }) => {
  const [reason, setReason] = useState('Inappropriate Language');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/api/complaints', {
        ratingId: rating.id || rating._id,
        reason,
        description
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setDescription('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !rating) return null;

  return (
    <div className="modal-overlay" onClick={!loading ? onClose : undefined}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Report Rating</h2>
          <button type="button" className="close-modal" onClick={onClose} disabled={loading}>
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-body">
          {success ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <FaFlag style={{ color: '#ef4444', fontSize: '2rem', marginBottom: '16px' }} />
              <h3 style={{ marginBottom: '8px' }}>Report Submitted</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Your report has been securely sent to our moderation team.</p>
            </div>
          ) : (
            <>
              <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
                Help us keep the platform safe by reporting fraudulent or inappropriate reviews.
              </p>

              {error && <div className="field-error-msg" style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Reason for reporting</label>
                  <select 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  >
                    <option value="Inappropriate Language">Inappropriate Language</option>
                    <option value="Spam">Spam / Bot Activity</option>
                    <option value="Fake/Fraudulent">Fake or Fraudulent Rating</option>
                    <option value="Harassment">Harassment / Bullying</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Additional Details (Optional)</label>
                  <textarea
                    rows="4"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please provide any additional context to help our moderators..."
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical' }}
                  />
                </div>

                <div className="modal-footer" style={{ marginTop: '24px', padding: '0' }}>
                  <button type="button" className="btn btn-light" onClick={onClose} disabled={loading} style={{ marginRight: '10px', padding: '10px 16px', background: '#e0e0e0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer' }} disabled={loading}>
                    {loading ? <FaSpinner className="fa-spin" /> : 'Submit Report'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlagRatingModal;

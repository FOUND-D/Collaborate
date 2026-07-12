import React, { useEffect, useState } from 'react';
import { FaFlag, FaTrash, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import api from '../utils/api';
import Message from '../components/Message';

const AdminComplaintsScreen = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const { data } = await api.get('/api/complaints');
      setComplaints(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id, action) => {
    setActionLoading(id);
    try {
      if (action === 'delete') {
        // Deletes the complaint AND the rating
        await api.delete(`/api/complaints/${id}/resolve`);
      } else {
        // Just dismisses the complaint
        await api.delete(`/api/complaints/${id}`);
      }
      setComplaints(complaints.filter(c => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2><FaFlag style={{ marginRight: '8px', color: '#ef4444' }} /> Reports & Complaints</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Review reported ratings from users. You can dismiss false reports or delete the rating entirely.
      </p>

      {loading ? (
        <FaSpinner className="fa-spin" style={{ fontSize: '2rem' }} />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : complaints.length === 0 ? (
        <Message>No active complaints. Everything looks good!</Message>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {complaints.map((complaint) => (
            <div key={complaint._id} style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>{complaint.reason}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Reported by {complaint.reporterName} on {new Date(complaint.createdAt).toLocaleDateString()}</span>
                </div>
                {complaint.description && (
                  <p style={{ fontStyle: 'italic', margin: '0 0 12px 0', fontSize: '0.9rem' }}>"{complaint.description}"</p>
                )}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Rating ID: {complaint.ratingId}</div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-light"
                  style={{ background: '#e0e0e0', color: '#000', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => handleResolve(complaint._id, 'dismiss')}
                  disabled={actionLoading === complaint._id}
                >
                  {actionLoading === complaint._id ? <FaSpinner className="fa-spin" /> : <><FaCheckCircle /> Dismiss</>}
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => handleResolve(complaint._id, 'delete')}
                  disabled={actionLoading === complaint._id}
                >
                  {actionLoading === complaint._id ? <FaSpinner className="fa-spin" /> : <><FaTrash /> Delete Rating</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminComplaintsScreen;

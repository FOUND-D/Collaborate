import React, { useState, useEffect } from 'react';
import { FaTrophy, FaMedal, FaGithub, FaCode, FaChartLine } from 'react-icons/fa';
import api from '../utils/api';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { Link } from 'react-router-dom';
import { BACKEND_URL } from '../config/runtime';

const LeaderboardScreen = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [department, setDepartment] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = department ? `?department=${encodeURIComponent(department)}` : '';
        const { data } = await api.get(`/api/leaderboard${query}`);
        setLeaderboard(data.users || data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [department]);

  return (
    <div className="phase2-page">
      <div className="phase2-shell">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2><FaTrophy style={{ marginRight: '8px', color: 'var(--accent-primary)' }} /> Developer Leaderboard</h2>
          <select 
            value={department} 
            onChange={(e) => setDepartment(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
          </select>
        </div>

        {loading ? <Loader /> : error ? <Message variant="danger">{error}</Message> : (
          leaderboard.length === 0 ? (
             <div className="phase2-empty">No users found on the leaderboard.</div>
          ) : (
            <div className="leaderboard-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {leaderboard.map((user, index) => {
                let rankIcon = null;
                if (index === 0) rankIcon = <FaTrophy style={{ color: '#FFD700', fontSize: '1.5rem' }} />;
                else if (index === 1) rankIcon = <FaMedal style={{ color: '#C0C0C0', fontSize: '1.5rem' }} />;
                else if (index === 2) rankIcon = <FaMedal style={{ color: '#CD7F32', fontSize: '1.5rem' }} />;
                else rankIcon = <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-secondary)', width: '24px', textAlign: 'center' }}>#{index + 1}</span>;

                return (
                  <div key={user._id} className="phase2-glass phase2-panel" style={{ display: 'flex', alignItems: 'center', padding: '16px', borderRadius: '12px', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px' }}>
                      {rankIcon}
                    </div>
                    
                    <Link to={`/profile/${user._id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: '12px', flex: 1 }}>
                      <div className="avatar-wrapper" style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-card)' }}>
                        {user.profileImage ? (
                          <img src={user.profileImage.startsWith('data:image') || user.profileImage.startsWith('http') ? user.profileImage : `${BACKEND_URL}${user.profileImage}`} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{user.name}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user.department || 'General'}</span>
                      </div>
                    </Link>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><FaGithub /> {user.githubScore || 0}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}><FaCode /> {user.leetcodeScore || 0}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', background: 'var(--bg-overlay)', padding: '8px 12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dev Score</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FaChartLine /> {user.devScore || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default LeaderboardScreen;

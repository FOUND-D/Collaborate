import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { FaUsers, FaChartBar, FaCogs, FaSearch, FaTrash, FaUserShield } from 'react-icons/fa';
import api from '../utils/api';
import Loader from '../components/Loader';
import './AdminDashboardScreen.css';

const AdminDashboardScreen = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  useEffect(() => {
    if (userInfo?.role === 'admin') {
      if (activeTab === 'overview') fetchStats();
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'skills') fetchSkills();
    }
  }, [activeTab, userInfo]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/skills');
      // For skills, we might need usage count, but listSkills doesn't have it.
      // Let's just list them for now.
      setSkills(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('Failed to update role');
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (window.confirm('Delete this skill? This will remove it from all users.')) {
      try {
        await api.delete(`/api/skills/${skillId}`);
        setSkills(skills.filter(s => s.id !== skillId));
      } catch (err) {
        alert('Failed to delete skill');
      }
    }
  };

  if (userInfo?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Control Panel</h1>
        <div className="admin-tabs">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            <FaChartBar /> Overview
          </button>
          <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
            <FaUsers /> Users
          </button>
          <button className={activeTab === 'skills' ? 'active' : ''} onClick={() => setActiveTab('skills')}>
            <FaCogs /> Skills
          </button>
        </div>
      </header>

      <main className="admin-content">
        {loading ? <Loader /> : (
          <>
            {activeTab === 'overview' && stats && (
              <div className="overview-tab">
                <div className="stats-grid">
                  <div className="admin-stat-card">
                    <FaUsers className="stat-icon" />
                    <div className="stat-info">
                      <h3>Total Users</h3>
                      <p>{stats.total_users}</p>
                    </div>
                  </div>
                  <div className="admin-stat-card">
                    <FaCogs className="stat-icon" />
                    <div className="stat-info">
                      <h3>Active Listings</h3>
                      <p>{stats.active_listings}</p>
                    </div>
                  </div>
                  <div className="admin-stat-card">
                    <FaChartBar className="stat-icon" />
                    <div className="stat-info">
                      <h3>Sessions (Week)</h3>
                      <p>{stats.sessions_this_week}</p>
                    </div>
                  </div>
                  <div className="admin-stat-card">
                    <FaUserShield className="stat-icon" />
                    <div className="stat-info">
                      <h3>Total Resources</h3>
                      <p>{stats.total_resources}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="users-tab">
                <div className="table-controls">
                  <div className="search-box">
                    <FaSearch />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Credits</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user._id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <select 
                              value={user.role} 
                              onChange={(e) => handleRoleChange(user._id, e.target.value)}
                              className="role-select"
                            >
                              <option value="undergrad">Undergrad</option>
                              <option value="postgrad">Postgrad</option>
                              <option value="faculty">Faculty</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td>{user.department || '—'}</td>
                          <td>{user.credits}</td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>—</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="skills-tab">
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Skill Name</th>
                        <th>Category</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skills.map(skill => (
                        <tr key={skill.id}>
                          <td>{skill.name}</td>
                          <td>{skill.category || 'General'}</td>
                          <td>
                            <button className="delete-btn" onClick={() => handleDeleteSkill(skill.id)}>
                              <FaTrash /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboardScreen;

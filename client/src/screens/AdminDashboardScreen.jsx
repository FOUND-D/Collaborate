import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { 
  FaUsers, FaChartBar, FaCogs, FaSearch, FaTrash, FaUserShield, FaPlus, 
  FaTimes, FaUserSlash, FaHistory, FaBullhorn, FaCoins, FaFilter, FaEdit, FaSave
} from 'react-icons/fa';
import api from '../utils/api';
import Loader from '../components/Loader';
import AnnouncementCreateModal from '../components/AnnouncementCreateModal';
import './AdminDashboardScreen.css';

const AdminDashboardScreen = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  if (userInfo?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-main">
          <h1>Admin Control Panel</h1>
          <p>Global oversight and platform management.</p>
        </div>
        <div className="admin-tabs-scroll">
          <div className="admin-tabs">
            <AdminTabBtn id="overview" label="Overview" icon={<FaChartBar />} active={activeTab} onClick={setActiveTab} />
            <AdminTabBtn id="users" label="Users" icon={<FaUsers />} active={activeTab} onClick={setActiveTab} />
            <AdminTabBtn id="faculty" label="Faculty" icon={<FaUserShield />} active={activeTab} onClick={setActiveTab} />
            <AdminTabBtn id="skills" label="Skills" icon={<FaCogs />} active={activeTab} onClick={setActiveTab} />
            <AdminTabBtn id="listings" label="Listings" icon={<FaFilter />} active={activeTab} onClick={setActiveTab} />
            <AdminTabBtn id="sessions" label="Sessions" icon={<FaHistory />} active={activeTab} onClick={setActiveTab} />
            <AdminTabBtn id="announcements" label="Announcements" icon={<FaBullhorn />} active={activeTab} onClick={setActiveTab} />
            
          </div>
        </div>
      </header>

      <main className="admin-content">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'faculty' && <FacultyTab />}
        {activeTab === 'skills' && <SkillsTab />}
        {activeTab === 'listings' && <ListingsTab />}
        {activeTab === 'sessions' && <SessionsTab />}
        {activeTab === 'announcements' && <AnnouncementsTab />}
        
      </main>
    </div>
  );
};

const AdminTabBtn = ({ id, label, icon, active, onClick }) => (
  <button className={active === id ? 'active' : ''} onClick={() => onClick(id)}>
    {icon} <span>{label}</span>
  </button>
);

// --- TAB COMPONENTS ---

const OverviewTab = () => {
  const [data, setData] = useState(null);
  const [topSkills, setTopSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, skillsRes] = await Promise.all([
          api.get('/api/admin/stats'),
          api.get('/api/admin/top-skills')
        ]);
        setData(statsRes.data);
        setTopSkills(skillsRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loader />;
  if (!data) return <div className="error-state">Failed to load stats.</div>;

  const maxSkillUsage = Math.max(...topSkills.map(s => s.usage_count), 1);

  return (
    <div className="overview-tab fade-in">
      <div className="stats-grid">
        <StatCard label="Total Users" value={data.totalUsers} icon={<FaUsers />} color="blue" />
        <StatCard label="Active Listings" value={data.activeListings} icon={<FaFilter />} color="teal" />
        <StatCard label="Sessions (Week)" value={data.sessionsThisWeek} icon={<FaHistory />} color="green" />
        <StatCard label="Total Resources" value={data.totalResources} icon={<FaCogs />} color="amber" />
      </div>

      <div className="secondary-stats-row">
        <div className="small-stat-item"><strong>{data.totalStudents}</strong> Students</div>
        <div className="small-stat-item"><strong>{data.totalFaculty}</strong> Faculty</div>
        <div className="small-stat-item"><strong>{data.totalSkills}</strong> Total Skills</div>
      </div>

      <div className="overview-split">
        <div className="overview-panel">
          <h3>Top 10 Skills by Usage</h3>
          <div className="skills-bar-chart">
            {topSkills.map((skill, i) => (
              <div key={i} className="skill-bar-row">
                <div className="skill-bar-info">
                  <span className="skill-name">{skill.name}</span>
                  <span className="skill-cat">{skill.category}</span>
                  <span className="skill-count">{skill.usage_count}</span>
                </div>
                <div className="skill-bar-outer">
                  <div 
                    className="skill-bar-inner" 
                    style={{ width: `${(skill.usage_count / maxSkillUsage) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overview-panel">
          <h3>Recent Signups</h3>
          <table className="admin-table compact">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSignups.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info-cell">
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>
                  </td>
                  <td><span className={`role-pill ${user.role}`}>{user.role}</span></td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div className={`admin-stat-card ${color}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-info">
      <h3>{label}</h3>
      <p>{value}</p>
    </div>
  </div>
);

const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
    return (
    <div className="users-tab fade-in">
      <div className="table-controls">
        <div className="search-box">
          <FaSearch onClick={fetchUsers} />
          <input 
            type="text" 
            placeholder="Search name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="admin-select">
          <option value="all">All Roles</option>
          <option value="student">Student</option>
          <option value="postgrad">Postgrad</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? <Loader /> : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Dept</th>
                
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className={user.suspended ? 'suspended-row' : ''}>
                  <td>
                    <div className="user-info-cell">
                      <strong>
                        <a 
                          href={`/profile/${user.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer' }}
                        >
                          {user.name}
                        </a> 
                        {user.suspended && <span className="suspended-badge">Suspended</span>}
                      </strong>
                      <small>{user.email}</small>
                    </div>
                  </td>
                  <td>
                    <select 
                      value={user.role} 
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="compact-select"
                    >
                      <option value="student">Student</option>
                      <option value="undergrad">Undergrad</option>
                      <option value="postgrad">Postgrad</option>
                      <option value="faculty">Faculty</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{user.department || '—'}</td>
                  
                  <td>
                    <div className="action-btns">
                      <a 
                        href={`/profile/${user.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn-icon" 
                        title="View Profile"
                      >
                        <FaChartBar />
                      </a>
                      <button className="btn-icon" title="Message" onClick={() => window.open(`/chat?user=${user.id}`)}>
                        <FaBullhorn />
                      </button>
                      
                      <button 
                        className={`btn-icon ${user.suspended ? 'unsuspend' : 'suspend'}`} 
                        title={user.suspended ? 'Unsuspend' : 'Suspend'}
                        onClick={() => handleSuspend(user)}
                      >
                        <FaUserSlash />
                      </button>
                      <button 
                        className="btn-icon delete" 
                        title="Delete User"
                        onClick={() => handleDeleteUser(user)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


    </div>
  );
};

const FacultyTab = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newFac, setNewFac] = useState({ name: '', email: '' });
  const [error, setError] = useState(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/faculty-whitelist');
      setList(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const { data } = await api.post('/api/admin/faculty-whitelist', newFac);
      setList([data, ...list]);
      setShowModal(false);
      setNewFac({ name: '', email: '' });
    } catch (err) {
      setError(err.response?.status === 409 ? 'This email is already whitelisted' : 'Failed to add');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove from whitelist?')) return;
    try {
      await api.delete(`/api/admin/faculty-whitelist/${id}`);
      setList(list.filter(f => f.id !== id));
    } catch (err) { alert('Failed to delete'); }
  };

  return (
    <div className="faculty-tab fade-in">
      <div className="tab-header-row">
        <h2>Faculty Whitelist</h2>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          <FaPlus /> Add Faculty
        </button>
      </div>

      {loading ? <Loader /> : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Added On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length > 0 ? list.map(f => (
                <tr key={f.id}>
                  <td>{f.name}</td>
                  <td>{f.email}</td>
                  <td>{new Date(f.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-delete-outline" onClick={() => handleDelete(f.id)}>Remove</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="empty-state">No faculty whitelisted yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="modal-header">
              <h3>Whitelist Faculty</h3>
              <button onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleAdd} className="admin-form">
              {error && <div className="field-error-msg">{error}</div>}
              <div className="field-group">
                <label>Name</label>
                <input type="text" value={newFac.name} onChange={e => setNewFac({...newFac, name: e.target.value})} required />
              </div>
              <div className="field-group">
                <label>Email</label>
                <input type="email" value={newFac.email} onChange={e => setNewFac({...newFac, email: e.target.value})} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Add to Whitelist</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SkillsTab = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', category: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/skills');
      setSkills(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSkills(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this skill? Users will lose it.')) return;
    try {
      await api.delete(`/api/admin/skills/${id}`);
      setSkills(skills.filter(s => s.id !== id));
    } catch (err) { alert('Failed to delete'); }
  };

  const handleEdit = (skill) => {
    setEditingId(skill.id);
    setEditData({ name: skill.name, category: skill.category });
  };

  const handleSave = async (id) => {
    try {
      const { data } = await api.patch(`/api/admin/skills/${id}`, editData);
      setSkills(skills.map(s => s.id === id ? { ...s, name: data.name, category: data.category } : s));
      setEditingId(null);
    } catch (err) { alert('Failed to update'); }
  };

  const handleBlockUser = async (userId) => {
    if (!window.confirm('Suspend this user?')) return;
    try {
      await api.patch(`/api/admin/users/${userId}/suspend`);
      alert('User suspended');
    } catch (err) { alert('Failed to suspend user'); }
  };

  const filteredSkills = useMemo(() => {
    let result = skills.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filter === 'recent') {
      // Sort by created_at DESC
      result = [...result].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (filter === 'most_used') {
      result = [...result].sort((a, b) => b.usage_count - a.usage_count);
    } else if (filter === 'unused') {
      result = result.filter(s => s.usage_count === 0);
    }
    
    return result;
  }, [skills, searchTerm, filter]);

  const getNewBadge = (createdAt) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffMs = now - createdDate;
    const diffHrs = diffMs / (1000 * 60 * 60);
    const diffDays = diffHrs / 24;

    if (diffHrs <= 24) return <span className="skill-badge amber">Just Added</span>;
    if (diffDays <= 7) return <span className="skill-badge green">New</span>;
    return null;
  };

  return (
    <div className="skills-tab fade-in">
      <div className="table-controls">
        <div className="search-box">
          <FaSearch />
          <input 
            type="text" 
            placeholder="Search skills..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="admin-filter-pills">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All Skills</button>
          <button className={filter === 'recent' ? 'active' : ''} onClick={() => setFilter('recent')}>Recently Added</button>
          <button className={filter === 'most_used' ? 'active' : ''} onClick={() => setFilter('most_used')}>Most Used</button>
          <button className={filter === 'unused' ? 'active' : ''} onClick={() => setFilter('unused')}>Unused</button>
        </div>
      </div>

      {loading ? <Loader /> : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Skill Name</th>
                <th>Category</th>
                <th>Added By</th>
                <th>Email</th>
                <th>Usage Count</th>
                <th>Added On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSkills.map(skill => (
                <tr key={skill.id}>
                  <td>
                    {editingId === skill.id ? (
                      <input 
                        type="text" 
                        value={editData.name} 
                        onChange={e => setEditData({...editData, name: e.target.value})}
                        className="compact-input"
                      />
                    ) : (
                      <div className="skill-name-cell">
                        {skill.name} {getNewBadge(skill.created_at)}
                      </div>
                    )}
                  </td>
                  <td>
                    {editingId === skill.id ? (
                      <input 
                        type="text" 
                        value={editData.category} 
                        onChange={e => setEditData({...editData, category: e.target.value})}
                        className="compact-input"
                      />
                    ) : <span className="cat-tag">{skill.category || 'General'}</span>}
                  </td>
                  <td>
                    {skill.added_by ? (
                      <a 
                        href={`/profile/${skill.added_by}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="admin-user-link"
                      >
                        {skill.added_by_name || 'Unknown'}
                      </a>
                    ) : 'System'}
                  </td>
                  <td><small>{skill.added_by_email || '—'}</small></td>
                  <td>{skill.usage_count}</td>
                  <td>{new Date(skill.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-btns">
                      {editingId === skill.id ? (
                        <button className="btn-icon" onClick={() => handleSave(skill.id)}><FaSave /></button>
                      ) : (
                        <button className="btn-icon" onClick={() => handleEdit(skill)}><FaEdit /></button>
                      )}
                      <button className="btn-icon delete" onClick={() => handleDelete(skill.id)}><FaTrash /></button>
                      {skill.added_by && (
                        <>
                          <button className="btn-icon" title="Message User" onClick={() => window.open(`/chat?user=${skill.added_by}`)}>
                            <FaBullhorn />
                          </button>
                          <button className="btn-icon suspend" title="Block User" onClick={() => handleBlockUser(skill.added_by)}>
                            <FaUserSlash />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ListingsTab = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchListings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/admin/listings?status=${statusFilter}`);
      setListings(data.listings || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchListings(); }, [statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/api/admin/listings/${id}/status`, { status: newStatus });
      setListings(listings.map(l => l._id === id ? { ...l, status: newStatus } : l));
    } catch (err) { alert('Failed to update status'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await api.delete(`/api/admin/listings/${id}`);
      setListings(listings.filter(l => l._id !== id));
    } catch (err) { alert('Failed to delete'); }
  };

  return (
    <div className="listings-tab fade-in">
      <div className="table-controls">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-select">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? <Loader /> : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Type</th>
                <th>Posted By</th>
                <th>Created On</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map(l => (
                <tr key={l._id}>
                  <td>{l.skillName}</td>
                  <td><span className={`type-pill ${l.listingType}`}>{l.listingType}</span></td>
                  <td>
                    <div className="user-info-cell">
                      <strong>
                        <a 
                          href={`/profile/${l.user?._id || l.userId}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer' }}
                        >
                          {l.user?.name}
                        </a>
                      </strong>
                      <small>{l.user?.email}</small>
                    </div>
                  </td>
                  <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                  <td>
                    <select 
                      value={l.status} 
                      onChange={e => handleStatusChange(l._id, e.target.value)}
                      className="compact-select"
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn-icon delete" onClick={() => handleDelete(l._id)}><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const SessionsTab = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/admin/sessions?status=${statusFilter}`);
      setSessions(data.sessions || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSessions(); }, [statusFilter]);

  return (
    <div className="sessions-tab fade-in">
      <div className="table-controls">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-select">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? <Loader /> : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Teacher</th>
                <th>Learner</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s._id}>
                  <td>{s.skillName}</td>
                  <td>
                    <a 
                      href={`/profile/${s.teacher_id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {s.teacherName}
                    </a>
                  </td>
                  <td>
                    <a 
                      href={`/profile/${s.learner_id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {s.learnerName}
                    </a>
                  </td>
                  <td>{new Date(s.scheduled_at).toLocaleDateString()}</td>
                  <td><span className={`status-pill ${s.status}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const AnnouncementsTab = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/announcements');
      setList(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/api/admin/announcements/${id}`);
      setList(list.filter(a => a._id !== id));
    } catch (err) { alert('Failed to delete'); }
  };

  return (
    <div className="announcements-tab fade-in">
      <div className="tab-header-row">
        <h2>Announcements</h2>
        <button className="add-btn" onClick={() => setShowModal(true)}>
          <FaPlus /> Post Announcement
        </button>
      </div>

      {loading ? <Loader /> : (
        <div className="announcement-list">
          {list.map(a => (
            <div key={a._id} className="admin-ann-card">
              <div className="ann-card-body">
                <h3>{a.title}</h3>
                <p>{a.body?.substring(0, 120)}...</p>
                <div className="ann-card-meta">
                  <span>
                    Posted by: {' '}
                    <a 
                      href={`/profile/${a.author_id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {a.authorName}
                    </a>
                  </span>
                  <span>{new Date(a.created_at).toLocaleDateString()}</span>
                  <span className="rsvp-badge">{a.rsvpCount} RSVPs</span>
                </div>
              </div>
              <button className="btn-icon delete" onClick={() => handleDelete(a._id)}>
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AnnouncementCreateModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)}
          onSuccess={fetchList}
        />
      )}
    </div>
  );
};


export default AdminDashboardScreen;

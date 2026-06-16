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
            <AdminTabBtn id="announcements" label="Announcements" icon={<FaBullhorn />} active={activeTab} onClick={setActiveTab} />
            <AdminTabBtn id="credits" label="Credits" icon={<FaCoins />} active={activeTab} onClick={setActiveTab} />
          </div>
        </div>
      </header>

      <main className="admin-content">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'faculty' && <FacultyTab />}
        {activeTab === 'skills' && <SkillsTab />}
        {activeTab === 'listings' && <ListingsTab />}
        {activeTab === 'announcements' && <AnnouncementsTab />}
        {activeTab === 'credits' && <CreditsTab />}
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
  const [grantModal, setGrantModal] = useState(null); // { userId, name }
  const [grantData, setGrantData] = useState({ amount: 10, reason: '' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/admin/users?search=${searchTerm}&role=${roleFilter}`);
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') fetchUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) { alert('Failed to update role'); }
  };

  const handleSuspend = async (user) => {
    const actionStr = user.suspended ? 'UNSUSPEND' : 'SUSPEND';
    const input = window.prompt(`To ${actionStr.toLowerCase()} ${user.name}, please type ${actionStr} below:`);
    
    if (input !== actionStr) {
      if (input !== null) alert(`Action cancelled. You must type ${actionStr} exactly.`);
      return;
    }

    try {
      const { data } = await api.patch(`/api/admin/users/${user.id}/suspend`);
      setUsers(users.map(u => u.id === user.id ? { ...u, suspended: data.suspended } : u));
    } catch (err) { alert('Failed to toggle suspension'); }
  };

  const handleDeleteUser = async (user) => {
    const input = window.prompt(`WARNING: This will permanently delete ${user.name} and all their data. To proceed, type DELETE below:`);
    
    if (input !== 'DELETE') {
      if (input !== null) alert('Action cancelled. You must type DELETE exactly.');
      return;
    }

    try {
      await api.delete(`/api/admin/users/${user.id}`);
      setUsers(users.filter(u => u.id !== user.id));
    } catch (err) { alert('Failed to delete user'); }
  };

  const handleGrantCredits = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.patch(`/api/admin/users/${grantModal.userId}/credits`, grantData);
      setUsers(users.map(u => u.id === grantModal.userId ? { ...u, credits: data.newBalance } : u));
      setGrantModal(null);
      setGrantData({ amount: 10, reason: '' });
    } catch (err) { alert('Failed to grant credits'); }
  };

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
                <th>Credits</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className={user.suspended ? 'suspended-row' : ''}>
                  <td>
                    <div className="user-info-cell">
                      <strong>{user.name} {user.suspended && <span className="suspended-badge">Suspended</span>}</strong>
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
                  <td>{user.credits}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" title="Grant Credits" onClick={() => setGrantModal({ userId: user.id, name: user.name })}>
                        <FaCoins />
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

      {grantModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="modal-header">
              <h3>Adjust Credits: {grantModal.name}</h3>
              <button onClick={() => setGrantModal(null)}><FaTimes /></button>
            </div>
            <form onSubmit={handleGrantCredits} className="admin-form">
              <div className="field-group">
                <label>Amount (negative to deduct)</label>
                <input 
                  type="number" 
                  value={grantData.amount} 
                  onChange={(e) => setGrantData({...grantData, amount: e.target.value})}
                  required 
                />
              </div>
              <div className="field-group">
                <label>Reason</label>
                <input 
                  type="text" 
                  value={grantData.reason} 
                  onChange={(e) => setGrantData({...grantData, reason: e.target.value})}
                  placeholder="e.g., Reward for mentorship"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setGrantModal(null)}>Cancel</button>
                <button type="submit" className="submit-btn">Apply Adjustment</button>
              </div>
            </form>
          </div>
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

  const filteredSkills = skills.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

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
      </div>

      {loading ? <Loader /> : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Skill Name</th>
                <th>Category</th>
                <th>Usage</th>
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
                    ) : skill.name}
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
                  <td>{skill.usage_count}</td>
                  <td>
                    <div className="action-btns">
                      {editingId === skill.id ? (
                        <button className="btn-icon" onClick={() => handleSave(skill.id)}><FaSave /></button>
                      ) : (
                        <button className="btn-icon" onClick={() => handleEdit(skill)}><FaEdit /></button>
                      )}
                      <button className="btn-icon delete" onClick={() => handleDelete(skill.id)}><FaTrash /></button>
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
                        <a href={`/profile/${l.user?._id || l.userId}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-primary)', textDecoration: 'none' }}>
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
                  <span>Posted by: {a.authorName}</span>
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

const CreditsTab = () => {
  const [config, setConfig] = useState({ startingCredits: 50 });
  const [loading, setLoading] = useState(true);
  const [bulkData, setBulkData] = useState({ userSearch: '', amount: 0, reason: '', type: 'grant' });
  const [searchResults, setSearchResults] = useState([]);
  const [targetUser, setTargetUser] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get('/api/admin/credit-config');
        setConfig(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchConfig();
  }, []);

  const handleSaveConfig = async () => {
    try {
      await api.patch('/api/admin/credit-config', { startingCredits: config.startingCredits });
      alert('Config updated');
    } catch (err) { alert('Failed to update config'); }
  };

  const handleSearchUser = async () => {
    if (bulkData.userSearch.length < 3) return;
    try {
      const { data } = await api.get(`/api/admin/users?search=${bulkData.userSearch}`);
      setSearchResults(data.users || []);
    } catch (err) { console.error(err); }
  };

  const handleApplyBulk = async () => {
    if (!targetUser) return;
    const finalAmount = bulkData.type === 'deduct' ? -Math.abs(bulkData.amount) : Math.abs(bulkData.amount);
    
    if (!window.confirm(`Apply ${finalAmount} credits to ${targetUser.name}?`)) return;

    try {
      await api.patch(`/api/admin/users/${targetUser.id}/credits`, { 
        amount: finalAmount, 
        reason: bulkData.reason 
      });
      alert('Credits applied');
      setTargetUser(null);
      setBulkData({ userSearch: '', amount: 0, reason: '', type: 'grant' });
      setSearchResults([]);
    } catch (err) { alert('Failed to apply credits'); }
  };

  if (loading) return <Loader />;

  return (
    <div className="credits-tab fade-in">
      <div className="admin-panel config-panel">
        <h3>Starting Credits Configuration</h3>
        <p className="note">This value is granted to new users upon registration.</p>
        <div className="config-inline">
          <input 
            type="number" 
            value={config.startingCredits} 
            onChange={e => setConfig({ startingCredits: e.target.value })}
          />
          <button className="submit-btn" onClick={handleSaveConfig}>Save Changes</button>
        </div>
      </div>

      <div className="admin-panel bulk-panel">
        <h3>Grant / Deduct Credits (Manual)</h3>
        <div className="bulk-grid">
          <div className="field-group">
            <label>Search User</label>
            <div className="search-row">
              <input 
                type="text" 
                placeholder="Name or email..." 
                value={bulkData.userSearch}
                onChange={e => setBulkData({...bulkData, userSearch: e.target.value})}
              />
              <button className="compact-btn" onClick={handleSearchUser}>Search</button>
            </div>
            {searchResults.length > 0 && !targetUser && (
              <div className="inline-results">
                {searchResults.map(u => (
                  <div key={u.id} className="result-item" onClick={() => setTargetUser(u)}>
                    {u.name} ({u.email})
                  </div>
                ))}
              </div>
            )}
            {targetUser && (
              <div className="target-pill">
                Targeting: <strong>{targetUser.name}</strong>
                <FaTimes onClick={() => setTargetUser(null)} />
              </div>
            )}
          </div>

          <div className="field-group" style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label>Action</label>
              <select 
                value={bulkData.type} 
                onChange={e => setBulkData({...bulkData, type: e.target.value})}
                className="admin-select"
                style={{ width: '100%' }}
              >
                <option value="grant">Grant</option>
                <option value="deduct">Deduct</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label>Amount</label>
              <input 
                type="number" 
                min="1"
                value={bulkData.amount} 
                onChange={e => setBulkData({...bulkData, amount: Math.abs(e.target.value)})}
              />
            </div>
          </div>

          <div className="field-group-full">
            <label>Reason</label>
            <input 
              type="text" 
              placeholder="Internal note..." 
              value={bulkData.reason}
              onChange={e => setBulkData({...bulkData, reason: e.target.value})}
            />
          </div>
        </div>
        <button className="submit-btn" disabled={!targetUser} onClick={handleApplyBulk}>Apply Adjustment</button>
      </div>
    </div>
  );
};

export default AdminDashboardScreen;

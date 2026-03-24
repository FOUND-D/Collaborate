import React, { useEffect, useMemo, useState } from 'react';
import './OrganisationDetailScreen.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaBuilding, FaEdit, FaExclamationTriangle, FaPlus, FaSave, FaTrash, FaUserMinus, FaUsers } from 'react-icons/fa';
import api from '../utils/api';
import Loader from '../components/Loader';

const getInitials = (name = '') => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

const formatDate = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString();
};

const getAvatarColor = (seed = '') => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 60%, 45%)`;
};

const getImageSrc = (value) => {
  if (!value) return '';
  if (value.startsWith('data:image') || value.startsWith('http')) return value;
  return value;
};

const OrganisationDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.userLogin);
  const [org, setOrg] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('members');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteStatus, setInviteStatus] = useState({ type: '', message: '' });
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });
  const [memberRoleError, setMemberRoleError] = useState('');
  const [settingsForm, setSettingsForm] = useState({ name: '', description: '', logo: '', allowMemberInvites: false, requireApprovalToJoin: false });
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [orgRes, teamsRes] = await Promise.all([
          api.get(`/api/organisations/${id}`),
          api.get(`/api/organisations/${id}/teams`),
        ]);
        setOrg(orgRes.data);
        setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load organisation');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  useEffect(() => {
    if (org) {
      setSettingsForm({
        name: org.name || '',
        description: org.description || '',
        logo: org.logo || '',
        allowMemberInvites: Boolean(org.settings?.allowMemberInvites),
        requireApprovalToJoin: Boolean(org.settings?.requireApprovalToJoin),
      });
    }
  }, [org]);

  const currentUserRole = org?.members?.find((m) => (m.user?._id || m.user) === userInfo?._id)?.role;
  const isOwnerOrAdmin = ['owner', 'admin'].includes(currentUserRole);

  const sortedMembers = useMemo(() => {
    if (!org?.members) return [];
    const rank = { owner: 0, admin: 1, member: 2 };
    return [...org.members].sort((a, b) => (rank[a.role] ?? 3) - (rank[b.role] ?? 3));
  }, [org]);

  const clearActionMessages = () => {
    setActionError('');
    setInviteStatus({ type: '', message: '' });
    setSaveStatus({ type: '', message: '' });
    setMemberRoleError('');
  };

  const handleRoleChange = async (userId, role) => {
    try {
      setMemberRoleError('');
      await api.put(`/api/organisations/${id}/members/${userId}/role`, { role });
      setOrg((prev) => ({ ...prev, members: prev.members.map((member) => ((member.user?._id || member.user) === userId ? { ...member, role } : member)) }));
    } catch (err) {
      setMemberRoleError(err.response?.data?.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (member) => {
    const memberId = member.user?._id || member.user;
    try {
      setMemberRoleError('');
      await api.delete(`/api/organisations/${id}/members/${memberId}`);
      setOrg((prev) => ({ ...prev, members: prev.members.filter((item) => (item.user?._id || item.user) !== memberId) }));
    } catch (err) {
      setMemberRoleError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    try {
      clearActionMessages();
      await api.post(`/api/organisations/${id}/members/invite`, { email: inviteEmail, role: inviteRole });
      setInviteStatus({ type: 'success', message: 'Invite sent successfully' });
      setInviteEmail('');
      setInviteRole('member');
      setShowInviteForm(false);
    } catch (err) {
      setInviteStatus({ type: 'error', message: err.response?.data?.message || 'Failed to send invite' });
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      clearActionMessages();
      const payload = { name: settingsForm.name, description: settingsForm.description, logo: settingsForm.logo, settings: { allowMemberInvites: settingsForm.allowMemberInvites, requireApprovalToJoin: settingsForm.requireApprovalToJoin } };
      const { data } = await api.put(`/api/organisations/${id}`, payload);
      setOrg(data);
      setSaveStatus({ type: 'success', message: 'Settings saved successfully' });
    } catch (err) {
      setSaveStatus({ type: 'error', message: err.response?.data?.message || 'Failed to save settings' });
    }
  };

  const handleDeleteOrganisation = async () => {
    try {
      clearActionMessages();
      await api.delete(`/api/organisations/${id}`);
      navigate('/organisations');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete organisation');
    }
  };

  const handleRevokeInvite = () => window.alert('Revoke not yet supported');

  if (loading) {
    return <div className="org-detail-page org-detail-loading"><Loader /></div>;
  }

  if (error || !org) {
    return (
      <div className="org-detail-page">
        <div className="org-detail-error-card">
          <div className="org-detail-error-icon"><FaExclamationTriangle /></div>
          <div className="org-detail-error-text">{error || 'Failed to load organisation'}</div>
          <button className="org-detail-secondary-btn" onClick={() => navigate(-1)} type="button">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="org-detail-page">
      <div className="org-detail-header-card">
        <div className="org-detail-header-main">
          <div className="org-detail-logo-wrap">
            {org.logo ? <img className="org-detail-logo-img" src={getImageSrc(org.logo)} alt={org.name} /> : <div className="org-detail-logo-fallback" style={{ backgroundColor: getAvatarColor(org.name) }}>{getInitials(org.name).charAt(0)}</div>}
          </div>
          <div className="org-detail-header-copy">
            <div className="org-detail-eyebrow">Organisation</div>
            <h1 className="org-detail-title">{org.name}</h1>
            <div className="org-detail-slug">@{org.slug}</div>
            <p className="org-detail-description">{org.description || 'No description provided.'}</p>
          </div>
        </div>
        {isOwnerOrAdmin && (
          <div className="org-detail-header-actions">
            <button className="org-detail-outline-btn" onClick={() => { clearActionMessages(); setActiveTab('settings'); }} type="button"><FaEdit /> Edit</button>
            <button className="org-detail-outline-btn org-detail-danger-outline" onClick={() => setShowDeleteConfirm(true)} type="button"><FaTrash /> Delete</button>
          </div>
        )}
      </div>

      <div className="org-detail-stats-row">
        <div className="org-detail-stat-pill"><FaUsers /> {org.members?.length || 0} Members</div>
        <div className="org-detail-stat-pill"><FaBuilding /> {teams.length} Teams</div>
        <div className="org-detail-stat-pill">Created {formatDate(org.createdAt)}</div>
      </div>

      <div className="org-detail-tabs">
        <button className={`org-detail-tab-btn ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')} type="button">Members</button>
        <button className={`org-detail-tab-btn ${activeTab === 'teams' ? 'active' : ''}`} onClick={() => setActiveTab('teams')} type="button">Teams</button>
        {isOwnerOrAdmin && <button className={`org-detail-tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')} type="button">Pending Invites</button>}
        {isOwnerOrAdmin && <button className={`org-detail-tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')} type="button">Settings</button>}
      </div>

      {activeTab === 'members' && (
        <div className="org-detail-section">
          <div className="org-detail-section-header">
            <div className="org-detail-section-label">Members</div>
            {isOwnerOrAdmin && !showInviteForm && <button className="org-detail-primary-btn" type="button" onClick={() => setShowInviteForm(true)}><FaPlus /> Invite Member</button>}
          </div>
          {showInviteForm && (
            <form className="org-detail-inline-form" onSubmit={handleInviteSubmit}>
              <div className="org-detail-form-grid">
                <div className="org-detail-field"><label className="org-detail-field-label" htmlFor="inviteEmail">Email</label><input id="inviteEmail" className="org-detail-input" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required /></div>
                <div className="org-detail-field"><label className="org-detail-field-label" htmlFor="inviteRole">Role</label><select id="inviteRole" className="org-detail-input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}><option value="member">member</option><option value="admin">admin</option></select></div>
              </div>
              <div className="org-detail-form-actions"><button className="org-detail-primary-btn" type="submit">Send Invite</button><button className="org-detail-secondary-btn" type="button" onClick={() => setShowInviteForm(false)}>Cancel</button></div>
            </form>
          )}
          {inviteStatus.message && <div className={`org-detail-inline-message ${inviteStatus.type}`}>{inviteStatus.message}</div>}
          {memberRoleError && <div className="org-detail-inline-message error">{memberRoleError}</div>}
          <div className="org-detail-list-card">
            {sortedMembers.map((member) => {
              const memberId = member.user?._id || member.user;
              const canManage = isOwnerOrAdmin && member.role !== 'owner' && (currentUserRole === 'owner' || member.role === 'member');
              const canChangeRole = currentUserRole === 'owner' || (currentUserRole === 'admin' && member.role === 'member');
              return (
                <div key={memberId} className="org-detail-member-row">
                  <div className="org-detail-row-left">
                    <div className="org-detail-avatar" style={{ backgroundColor: getAvatarColor(member.user?.name || member.user?.email || memberId) }}>{member.user?.profileImage ? <img src={getImageSrc(member.user.profileImage)} alt={member.user?.name || 'Member'} /> : (member.user?.name || member.user?.email || '?').charAt(0).toUpperCase()}</div>
                    <div className="org-detail-row-copy"><div className="org-detail-row-title">{member.user?.name || 'Unknown user'}</div><div className="org-detail-row-subtitle">{member.user?.email || ''}</div></div>
                  </div>
                  <div className="org-detail-row-right">
                    <span className={`org-detail-role-pill ${member.role}`}>{member.role}</span>
                    {canManage && (
                      <>
                        {canChangeRole && <select className="org-detail-role-select" value={member.role} onChange={(e) => handleRoleChange(memberId, e.target.value)}><option value="member">member</option><option value="admin">admin</option></select>}
                        <button className="org-detail-icon-btn org-detail-danger-icon-btn" type="button" onClick={() => handleRemoveMember(member)} title="Remove member"><FaUserMinus /></button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="org-detail-section">
          <div className="org-detail-section-label">Teams</div>
          {teams.length === 0 ? <div className="org-detail-empty-state"><div className="org-detail-empty-title">No teams in this organisation yet</div><div className="org-detail-empty-subtitle">Create a team and link it to this organisation</div></div> : <div className="org-detail-team-grid">{teams.map((team) => <div key={team._id} className="org-detail-team-card"><div className="org-detail-team-name">{team.name}</div><div className="org-detail-team-meta">{team.members?.length || 0} members</div><div className="org-detail-team-owner">Owner: {team.owner?.name || 'Unknown'}</div><button className="org-detail-primary-btn org-detail-team-btn" type="button" onClick={() => navigate(`/team/${team._id}`)}>View Team</button></div>)}</div>}
        </div>
      )}

      {activeTab === 'pending' && isOwnerOrAdmin && (
        <div className="org-detail-section">
          <div className="org-detail-section-label">Pending Invites</div>
          <div className="org-detail-list-card">
            {org.pendingInvites?.length ? org.pendingInvites.map((invite) => <div key={invite._id || invite.email} className="org-detail-invite-row"><div className="org-detail-row-left"><div className="org-detail-row-copy"><div className="org-detail-row-title">{invite.email}</div><div className="org-detail-row-subtitle">Expires: {formatDate(invite.expiresAt)}</div></div></div><div className="org-detail-row-right"><span className={`org-detail-role-pill ${invite.role}`}>{invite.role}</span><button className="org-detail-outline-btn org-detail-danger-outline org-detail-small-btn" type="button" onClick={handleRevokeInvite}>Revoke</button></div></div>) : <div className="org-detail-empty-inline">No pending invites</div>}
          </div>
        </div>
      )}

      {activeTab === 'settings' && isOwnerOrAdmin && (
        <div className="org-detail-section">
          <div className="org-detail-section-label">Settings</div>
          <form className="org-detail-settings-card" onSubmit={handleSaveSettings}>
            <div className="org-detail-field"><label className="org-detail-field-label" htmlFor="orgName">Name</label><input id="orgName" className="org-detail-input" type="text" value={settingsForm.name} onChange={(e) => setSettingsForm((prev) => ({ ...prev, name: e.target.value }))} /></div>
            <div className="org-detail-field"><label className="org-detail-field-label" htmlFor="orgDescription">Description</label><textarea id="orgDescription" className="org-detail-input org-detail-textarea" value={settingsForm.description} onChange={(e) => setSettingsForm((prev) => ({ ...prev, description: e.target.value }))} /></div>
            <div className="org-detail-field"><label className="org-detail-field-label" htmlFor="orgLogo">Logo URL</label><input id="orgLogo" className="org-detail-input" type="text" value={settingsForm.logo} onChange={(e) => setSettingsForm((prev) => ({ ...prev, logo: e.target.value }))} />{settingsForm.logo && <img className="org-detail-logo-preview" src={getImageSrc(settingsForm.logo)} alt="Organisation logo preview" />}</div>
            <div className="org-detail-toggle-list">
              <label className="org-detail-toggle-item"><div><div className="org-detail-toggle-title">Allow member invites</div><div className="org-detail-toggle-subtitle">Allow members to invite others to this organisation</div></div><span className="org-detail-switch"><input type="checkbox" checked={settingsForm.allowMemberInvites} onChange={(e) => setSettingsForm((prev) => ({ ...prev, allowMemberInvites: e.target.checked }))} /><span className="org-detail-slider" /></span></label>
              <label className="org-detail-toggle-item"><div><div className="org-detail-toggle-title">Require approval to join</div><div className="org-detail-toggle-subtitle">Require owner/admin approval for join requests</div></div><span className="org-detail-switch"><input type="checkbox" checked={settingsForm.requireApprovalToJoin} onChange={(e) => setSettingsForm((prev) => ({ ...prev, requireApprovalToJoin: e.target.checked }))} /><span className="org-detail-slider" /></span></label>
            </div>
            {saveStatus.message && <div className={`org-detail-inline-message ${saveStatus.type}`}>{saveStatus.message}</div>}
            <button className="org-detail-primary-btn org-detail-save-btn" type="submit"><FaSave /> Save Changes</button>
          </form>
          {currentUserRole === 'owner' && (
            <div className="org-detail-danger-zone">
              <div className="org-detail-section-label org-detail-danger-label">Danger Zone</div>
              <button className="org-detail-outline-btn org-detail-danger-outline" type="button" onClick={() => setShowDeleteConfirm(true)}>Delete Organisation</button>
              {showDeleteConfirm && <div className="org-detail-confirm-box"><p>Are you sure? This will permanently delete the organisation, all its teams, and all associated data. Type the org name to confirm.</p><input className="org-detail-input" type="text" value={deleteConfirmName} onChange={(e) => setDeleteConfirmName(e.target.value)} /><div className="org-detail-form-actions"><button className="org-detail-primary-btn org-detail-danger-btn" type="button" disabled={deleteConfirmName !== org.name} onClick={handleDeleteOrganisation}>Confirm Delete</button><button className="org-detail-secondary-btn" type="button" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmName(''); }}>Cancel</button></div></div>}
            </div>
          )}
          {actionError && <div className="org-detail-inline-message error">{actionError}</div>}
        </div>
      )}
    </div>
  );
};

export default OrganisationDetailScreen;

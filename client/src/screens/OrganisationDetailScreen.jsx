import React, { useEffect, useMemo, useState } from 'react';
import './OrganisationDetailScreen.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaSave, FaUserMinus } from 'react-icons/fa';
import { FiAlertCircle, FiCalendar, FiCheck, FiChevronRight, FiEdit2, FiGrid, FiMail, FiSettings, FiUser, FiUserPlus, FiUsers } from 'react-icons/fi';
import api from '../utils/api';
import {
  ProvisionMemberModal,
  ComplianceBadge,
  AuditLogTable,
} from './OrgManagementPages';

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

const formatCreatedDate = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const avatarGradients = [
  'linear-gradient(135deg,#2563eb,#7c3aed)',
  'linear-gradient(135deg,#10b981,#2563eb)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#7c3aed,#ec4899)',
];

const getGradientStyle = (seed = '') => ({
  background: avatarGradients[Math.abs(seed.charCodeAt(0) || 0) % avatarGradients.length],
});

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
  const [inviteLoading, setInviteLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [memberActionLoading, setMemberActionLoading] = useState('');
  const [managementTab, setManagementTab] = useState('members');
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [orgRoles, setOrgRoles] = useState([]);
  const [roleForm, setRoleForm] = useState(null);
  const [membersData, setMembersData] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [complianceRules, setComplianceRules] = useState(null);
  const [auditEntries, setAuditEntries] = useState([]);

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

  const currentUserRole = org?.currentUserRole || null;
  const isOwnerOrAdmin = Boolean(org?.permissions?.canManageMembers || org?.permissions?.canManageRoles || org?.permissions?.canManageSettings || org?.permissions?.canViewReports || currentUserRole === 'owner' || currentUserRole === 'admin');
  const createdLabel = formatCreatedDate(org?.createdAt);

  useEffect(() => {
    if (!isOwnerOrAdmin || (!manageOpen && !memberModalOpen)) return;
    const loadAdminData = async () => {
      try {
        const requests = [];
        if (manageOpen) {
          requests.push(api.get(`/api/orgs/${id}/members`, { params: { limit: 20 } }));
        }
        if (manageOpen || memberModalOpen || managementTab === 'roles') {
          requests.push(api.get(`/api/orgs/${id}/roles`));
        }
        if (manageOpen || managementTab === 'customFields' || managementTab === 'compliance') {
          requests.push(api.get(`/api/orgs/${id}/custom-fields`));
        }
        if (manageOpen || managementTab === 'compliance') {
          requests.push(api.get(`/api/orgs/${id}/compliance`));
        }
        if (manageOpen || managementTab === 'audit') {
          requests.push(api.get(`/api/orgs/${id}/audit-log`, { params: { limit: 20 } }));
        }
        const results = await Promise.all(requests);
        let idx = 0;
        if (manageOpen) {
          setMembersData(results[idx]?.data?.members || []);
          idx += 1;
        }
        if (manageOpen || memberModalOpen || managementTab === 'roles') {
          setOrgRoles(results[idx]?.data || []);
          idx += 1;
        }
        if (manageOpen || managementTab === 'customFields' || managementTab === 'compliance') {
          setCustomFields(results[idx]?.data || []);
          idx += 1;
        }
        if (manageOpen || managementTab === 'compliance') {
          setComplianceRules(results[idx]?.data || null);
          idx += 1;
        }
        if (manageOpen || managementTab === 'audit') {
          setAuditEntries(results[idx]?.data?.entries || []);
        }
      } catch (err) {
        // keep page usable if the admin panel is slow
      }
    };
    loadAdminData();
  }, [id, isOwnerOrAdmin, manageOpen, memberModalOpen, managementTab]);

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
      setMemberActionLoading(userId);
      setMemberRoleError('');
      await api.put(`/api/organisations/${id}/members/${userId}/role`, { role });
      setOrg((prev) => ({ ...prev, members: prev.members.map((member) => ((member.user?._id || member.user) === userId ? { ...member, role } : member)) }));
    } catch (err) {
      setMemberRoleError(err.response?.data?.message || 'Failed to update member role');
    } finally {
      setMemberActionLoading('');
    }
  };

  const handleRemoveMember = async (member) => {
    const memberId = member.user?._id || member.user;
    try {
      setMemberActionLoading(memberId);
      setMemberRoleError('');
      await api.delete(`/api/organisations/${id}/members/${memberId}`);
      setOrg((prev) => ({ ...prev, members: prev.members.filter((item) => (item.user?._id || item.user) !== memberId) }));
    } catch (err) {
      setMemberRoleError(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setMemberActionLoading('');
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    try {
      setInviteLoading(true);
      clearActionMessages();
      await api.post(`/api/organisations/${id}/members/invite`, { email: inviteEmail, role: inviteRole });
      setInviteStatus({ type: 'success', message: 'Invite sent successfully' });
      setInviteEmail('');
      setInviteRole('member');
      setShowInviteForm(false);
    } catch (err) {
      setInviteStatus({ type: 'error', message: err.response?.data?.message || 'Failed to send invite' });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      clearActionMessages();
      const payload = { name: settingsForm.name, description: settingsForm.description, logo: settingsForm.logo, settings: { allowMemberInvites: settingsForm.allowMemberInvites, requireApprovalToJoin: settingsForm.requireApprovalToJoin } };
      const { data } = await api.put(`/api/organisations/${id}`, payload);
      setOrg(data);
      setSaveStatus({ type: 'success', message: 'Settings saved successfully' });
    } catch (err) {
      setSaveStatus({ type: 'error', message: err.response?.data?.message || 'Failed to save settings' });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteOrganisation = async () => {
    try {
      setDeleteLoading(true);
      clearActionMessages();
      await api.delete(`/api/organisations/${id}`);
      navigate('/organisations');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete organisation');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRevokeInvite = () => window.alert('Revoke not yet supported');

  if (loading) {
    return (
      <div className="org-detail-page org-detail-loading-page">
        <div className="org-detail-skeleton org-detail-skeleton-header" />
        <div className="org-detail-skeleton-row">
          <div className="org-detail-skeleton org-detail-skeleton-pill" />
          <div className="org-detail-skeleton org-detail-skeleton-pill" />
          <div className="org-detail-skeleton org-detail-skeleton-pill" />
        </div>
        <div className="org-detail-skeleton org-detail-skeleton-content" />
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="org-detail-page org-detail-error-page">
        <div className="org-detail-error-card">
          <div className="org-detail-error-icon"><FiAlertCircle /></div>
          <div className="org-detail-error-title">Failed to load organisation</div>
          <div className="org-detail-error-text">{error || 'Failed to load organisation'}</div>
          <button className="org-detail-outline-btn" onClick={() => navigate(-1)} type="button">Go Back</button>
        </div>
      </div>
    );
  }

  const memberCount = org.members?.length || 0;
  const teamCount = teams.length;

  const renderRoleBadge = (role) => <span className={`org-detail-role-pill ${role}`}>{role}</span>;
  const roleOptions = orgRoles || [];
  const roleCounts = useMemo(() => {
    const counts = {};
    (membersData || []).forEach((member) => {
      const key = member.orgRoleId || member.org_role_id || member.role;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [membersData]);
  const selectedRoleCount = (roleId) => roleCounts[roleId] || 0;
  const tabs = [
    { key: 'members', label: 'Members', icon: FiUsers },
    { key: 'teams', label: 'Teams', icon: FiGrid },
  ];
  if (isOwnerOrAdmin) {
    tabs.push({ key: 'pending', label: 'Invites', icon: FiMail });
    tabs.push({ key: 'settings', label: 'Settings', icon: FiSettings });
  }

  return (
    <div className="org-detail-page">
      <div className="org-detail-header-card">
        <div className="org-detail-header-main">
          <div className="org-detail-logo-wrap">
            {org.logo ? <img className="org-detail-logo-img" src={getImageSrc(org.logo)} alt={org.name} /> : <div className="org-detail-logo-fallback" style={getGradientStyle(org.name)}>{getInitials(org.name).charAt(0)}</div>}
          </div>
          <div className="org-detail-header-copy">
            <div className="org-detail-eyebrow">ORGANISATION</div>
            <h1 className="org-detail-title">{org.name}</h1>
            <div className="org-detail-slug">@{org.slug}</div>
            <p className="org-detail-description">{org.description || 'No description provided.'}</p>
          </div>
        </div>
        {isOwnerOrAdmin && (
          <div className="org-detail-header-actions">
            <button className="org-detail-outline-btn" onClick={() => setManageOpen(true)} type="button"><FiSettings /> Manage</button>
            <button className="org-detail-outline-btn" onClick={() => { clearActionMessages(); setActiveTab('settings'); }} type="button"><FiEdit2 /> Edit</button>
            <button className="org-detail-outline-btn" onClick={() => setActiveTab('settings')} type="button"><FiSettings /> Settings</button>
          </div>
        )}
      </div>

      <div className="org-detail-stats-row">
        <div className="org-detail-stat-pill"><FiUsers className="org-detail-pill-icon members" /> {memberCount} Members</div>
        <div className="org-detail-stat-pill"><FiGrid className="org-detail-pill-icon teams" /> {teamCount} Teams</div>
        <div className="org-detail-stat-pill"><FiCalendar className="org-detail-pill-icon created" /> Since {createdLabel}</div>
      </div>

      <div className="org-detail-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return <button key={tab.key} className={`org-detail-tab-btn ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)} type="button"><Icon /> {tab.label}</button>;
        })}
      </div>

      {isOwnerOrAdmin && (
        <div className="org-detail-management-shell">
          <div className="org-detail-tabs org-detail-inline-tabs">
            <button className={`org-detail-tab-btn ${managementTab === 'members' ? 'active' : ''}`} type="button" onClick={() => setManagementTab('members')}>Members</button>
            <button className={`org-detail-tab-btn ${managementTab === 'roles' ? 'active' : ''}`} type="button" onClick={() => setManagementTab('roles')}>Roles</button>
            <button className={`org-detail-tab-btn ${managementTab === 'compliance' ? 'active' : ''}`} type="button" onClick={() => setManagementTab('compliance')}>Compliance</button>
            <button className={`org-detail-tab-btn ${managementTab === 'customFields' ? 'active' : ''}`} type="button" onClick={() => setManagementTab('customFields')}>Custom Fields</button>
            <button className={`org-detail-tab-btn ${managementTab === 'audit' ? 'active' : ''}`} type="button" onClick={() => setManagementTab('audit')}>Audit Log</button>
          </div>
          {managementTab === 'members' && (
            <div className="org-detail-inline-panel">
              <div className="org-detail-section-header">
                <div className="org-detail-section-label">MEMBERS</div>
                <button className="org-detail-primary-btn" type="button" onClick={() => setMemberModalOpen(true)}><FiUserPlus /> Add Member</button>
              </div>
              <div className="org-mgmt-filterbar">
                <input className="org-mgmt-input" placeholder="Search members" />
                <select className="org-mgmt-input"><option>All roles</option>{orgRoles.map((r) => <option key={r._id}>{r.name}</option>)}</select>
              </div>
              <div className="org-detail-list-card">
                {membersData.length ? membersData.map((member) => {
                  const memberId = member.userId || member.user?._id || member.user;
                  return (
                    <div key={memberId} className="org-detail-member-row">
                      <div className="org-detail-row-left">
                        <div className="org-detail-avatar" style={getGradientStyle(member.user?.name || member.user?.email || memberId)}>{member.user?.profileImage ? <img src={getImageSrc(member.user.profileImage)} alt={member.user?.name || 'Member'} /> : (member.user?.name || member.user?.email || '?').charAt(0).toUpperCase()}</div>
                        <div className="org-detail-row-copy"><div className="org-detail-row-title">{member.user?.name || 'Unknown user'}</div><div className="org-detail-row-subtitle">{member.user?.email || ''}</div></div>
                      </div>
                      <div className="org-detail-row-right">
                        <ComplianceBadge status={member.status} />
                        {renderRoleBadge(member.orgRole?.slug || member.role)}
                      </div>
                    </div>
                  );
                }) : <div className="org-detail-empty-state"><FiUsers className="org-detail-empty-icon" /><div className="org-detail-empty-title">No members yet</div><div className="org-detail-empty-subtitle">Invite people to join this organisation</div></div>}
              </div>
            </div>
          )}
          {managementTab === 'roles' && (
            <div className="org-detail-inline-panel">
              <div className="org-detail-section-label">ROLES</div>
              <div className="org-detail-row-right" style={{ justifyContent: 'space-between' }}>
                <div className="org-detail-empty-subtitle">Create and manage built-in or custom org roles.</div>
                <button className="org-detail-primary-btn" type="button" onClick={() => setRoleForm({ mode: 'create', name: '', slug: '', canManageMembers: false, canManageRoles: false, canManageSettings: false, canManageTeams: false, canInviteMembers: false, canViewReports: false })}>+ New Role</button>
              </div>
              {roleForm && (
                <div className="org-detail-settings-card">
                  <div className="org-detail-field"><label className="org-detail-field-label">Name</label><input className="org-detail-input" value={roleForm.name} onChange={(e) => setRoleForm((p) => ({ ...p, name: e.target.value, slug: p.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))} /></div>
                  <div className="org-detail-field"><label className="org-detail-field-label">Slug</label><input className="org-detail-input" value={roleForm.slug} onChange={(e) => setRoleForm((p) => ({ ...p, slug: e.target.value }))} /></div>
                  <div className="org-detail-field"><label className="org-detail-field-label">Permissions</label>
                    <div className="org-mgmt-permissions-grid">
                      {[
                        { key: 'canManageMembers', label: 'Manage Members' },
                        { key: 'canManageRoles', label: 'Manage Roles' },
                        { key: 'canManageSettings', label: 'Manage Settings' },
                        { key: 'canManageTeams', label: 'Manage Teams' },
                        { key: 'canInviteMembers', label: 'Invite Members' },
                        { key: 'canViewReports', label: 'View Reports' },
                      ].map((perm) => (
                        <label key={perm.key} className="org-mgmt-permission">
                          <input type="checkbox" checked={!!roleForm[perm.key]} onChange={(e) => setRoleForm((p) => ({ ...p, [perm.key]: e.target.checked }))} />
                          <span>{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="org-mgmt-row">
                    <button className="org-mgmt-secondary-btn" type="button" onClick={() => setRoleForm(null)}>Cancel</button>
                    <button className="org-mgmt-primary-btn" type="button" onClick={async () => {
                      await api.post(`/api/orgs/${id}/roles`, {
                        name: roleForm.name,
                        slug: roleForm.slug,
                        canManageMembers: roleForm.canManageMembers,
                        canManageRoles: roleForm.canManageRoles,
                        canManageSettings: roleForm.canManageSettings,
                        canManageTeams: roleForm.canManageTeams,
                        canInviteMembers: roleForm.canInviteMembers,
                        canViewReports: roleForm.canViewReports,
                      });
                      const { data } = await api.get(`/api/orgs/${id}/roles`);
                      setOrgRoles(data || []);
                      setRoleForm(null);
                    }}>Save Role</button>
                  </div>
                </div>
              )}
              <div className="org-detail-list-card">
                {orgRoles.map((role) => <div key={role._id} className="org-detail-member-row"><div className="org-detail-row-left"><div className="org-detail-row-copy"><div className="org-detail-row-title">{role.name}</div><div className="org-detail-row-subtitle">{role.slug} · {selectedRoleCount(role._id)} members</div></div></div><div className="org-detail-row-right">{role.isSystemRole ? <span className="org-detail-role-pill owner">Locked</span> : <span className="org-detail-role-pill member">Custom</span>}</div></div>)}
              </div>
            </div>
          )}
          {managementTab === 'compliance' && (
            <div className="org-detail-inline-panel">
              <div className="org-detail-section-label">COMPLIANCE</div>
              <form className="org-detail-settings-card">
                <div className="org-detail-toggle-list">
                  <label className="org-detail-toggle-item"><div><div className="org-detail-toggle-title">Require Profile Photo</div><div className="org-detail-toggle-subtitle">Users must upload a profile photo</div></div><span className="org-detail-switch"><input type="checkbox" checked={Boolean(complianceRules?.requireProfilePhoto)} readOnly /><span className="org-detail-slider" /></span></label>
                  <label className="org-detail-toggle-item"><div><div className="org-detail-toggle-title">Require Mobile Number</div><div className="org-detail-toggle-subtitle">Users must add a mobile number</div></div><span className="org-detail-switch"><input type="checkbox" checked={Boolean(complianceRules?.requireMobileNumber)} readOnly /><span className="org-detail-slider" /></span></label>
                  <label className="org-detail-toggle-item"><div><div className="org-detail-toggle-title">Require Full Name</div><div className="org-detail-toggle-subtitle">Users must have a non-empty name</div></div><span className="org-detail-switch"><input type="checkbox" checked={Boolean(complianceRules?.requireFullName)} readOnly /><span className="org-detail-slider" /></span></label>
                  <label className="org-detail-toggle-item"><div><div className="org-detail-toggle-title">Require Bio / Designation</div><div className="org-detail-toggle-subtitle">Users must set bio and designation</div></div><span className="org-detail-switch"><input type="checkbox" checked={Boolean(complianceRules?.requireBioDesignation)} readOnly /><span className="org-detail-slider" /></span></label>
                </div>
                <div className="org-detail-empty-inline">Required custom fields: {(complianceRules?.requiredCustomFieldSlugs || []).join(', ') || 'None'}</div>
              </form>
            </div>
          )}
          {managementTab === 'customFields' && (
            <div className="org-detail-inline-panel">
              <div className="org-detail-section-label">CUSTOM FIELDS</div>
              <div className="org-detail-list-card">
                {customFields.map((field) => <div key={field._id} className="org-detail-member-row"><div className="org-detail-row-left"><div className="org-detail-row-copy"><div className="org-detail-row-title">{field.label}</div><div className="org-detail-row-subtitle">{field.slug} · {field.fieldType}</div></div></div><div className="org-detail-row-right">{field.isRequired ? <span className="org-detail-role-pill owner">Required</span> : <span className="org-detail-role-pill member">Optional</span>}</div></div>)}
              </div>
            </div>
          )}
          {managementTab === 'audit' && (
            <div className="org-detail-inline-panel">
              <div className="org-detail-section-label">AUDIT LOG</div>
              <AuditLogTable entries={auditEntries} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="org-detail-section">
          <div className="org-detail-section-header">
            <div className="org-detail-section-label">MEMBERS</div>
            {isOwnerOrAdmin && !showInviteForm && <button className="org-detail-primary-btn" type="button" onClick={() => setShowInviteForm(true)}><FiUserPlus /> Invite Member</button>}
          </div>
          {showInviteForm && (
            <form className="org-detail-inline-form" onSubmit={handleInviteSubmit}>
              <input id="inviteEmail" className="org-detail-input" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Member email address" required />
              <div className="org-detail-inline-form-row">
                <select id="inviteRole" className="org-detail-input org-detail-select" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}><option value="member">member</option><option value="admin">admin</option></select>
                <button className="org-detail-primary-btn" type="submit" disabled={inviteLoading}>{inviteLoading ? 'Sending...' : 'Send Invite'}</button>
                <button className="org-detail-secondary-btn" type="button" onClick={() => setShowInviteForm(false)}>Cancel</button>
              </div>
            </form>
          )}
          {inviteStatus.message && <div className={`org-detail-inline-message ${inviteStatus.type}`}>{inviteStatus.message}</div>}
          {memberRoleError && <div className="org-detail-inline-message error">{memberRoleError}</div>}
          <div className="org-detail-list-card">
            {sortedMembers.length ? sortedMembers.map((member) => {
              const memberId = member.user?._id || member.user;
              const canManage = isOwnerOrAdmin && member.role !== 'owner' && (currentUserRole === 'owner' || member.role === 'member');
              const canChangeRole = currentUserRole === 'owner' || (currentUserRole === 'admin' && member.role === 'member');
              return (
                <div key={memberId} className="org-detail-member-row">
                  <div className="org-detail-row-left">
                    <div className="org-detail-avatar" style={getGradientStyle(member.user?.name || member.user?.email || memberId)}>{member.user?.profileImage ? <img src={getImageSrc(member.user.profileImage)} alt={member.user?.name || 'Member'} /> : (member.user?.name || member.user?.email || '?').charAt(0).toUpperCase()}</div>
                    <div className="org-detail-row-copy"><div className="org-detail-row-title">{member.user?.name || 'Unknown user'}</div><div className="org-detail-row-subtitle">{member.user?.email || ''}</div></div>
                  </div>
                  <div className="org-detail-row-right">
                    {renderRoleBadge(member.role)}
                    {canManage && (
                      <>
                        {canChangeRole && <select className="org-detail-role-select" value={member.role} onChange={(e) => handleRoleChange(memberId, e.target.value)} disabled={memberActionLoading === memberId}><option value="member">member</option><option value="admin">admin</option></select>}
                        <button className="org-detail-icon-btn org-detail-danger-icon-btn" type="button" onClick={() => handleRemoveMember(member)} title="Remove member" disabled={memberActionLoading === memberId}><FaUserMinus /></button>
                      </>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="org-detail-empty-state">
                <FiUsers className="org-detail-empty-icon" />
                <div className="org-detail-empty-title">No members yet</div>
                <div className="org-detail-empty-subtitle">Invite people to join this organisation</div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="org-detail-section">
          <div className="org-detail-section-label">TEAMS</div>
          {teams.length === 0 ? <div className="org-detail-empty-state"><FiGrid className="org-detail-empty-icon" /><div className="org-detail-empty-title">No teams yet</div><div className="org-detail-empty-subtitle">Create a team and link it to this organisation</div></div> : <div className="org-detail-team-grid">{teams.map((team) => <div key={team._id} className="org-detail-team-card" role="button" tabIndex={0} onClick={() => navigate(`/team/${team._id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/team/${team._id}`)}><div className="org-detail-team-avatar" style={getGradientStyle(team.name)}>{getInitials(team.name).charAt(0)}</div><div className="org-detail-team-name">{team.name}</div><div className="org-detail-team-meta"><span><FiUsers /> {team.members?.length || 0} members</span><span><FiUser /> {team.owner?.name || 'Unknown'}</span></div><div className="org-detail-team-footer"><button className="org-detail-team-link" type="button" onClick={(e) => { e.stopPropagation(); navigate(`/team/${team._id}`); }}>View Team <FiChevronRight /></button></div></div>)}</div>}
        </div>
      )}

      {activeTab === 'pending' && isOwnerOrAdmin && (
        <div className="org-detail-section">
          <div className="org-detail-section-label">PENDING INVITES</div>
          <div className="org-detail-list-card">
            {org.pendingInvites?.length ? org.pendingInvites.map((invite) => <div key={invite._id || invite.email} className="org-detail-invite-row"><div className="org-detail-row-left"><div className="org-detail-invite-icon"><FiMail /></div><div className="org-detail-row-copy"><div className="org-detail-row-title">{invite.email}</div><div className="org-detail-row-subtitle">Expires {formatDate(invite.expiresAt)}</div></div></div><div className="org-detail-row-right">{renderRoleBadge(invite.role)}<button className="org-detail-revoke-btn" type="button" onClick={handleRevokeInvite}>Revoke</button></div></div>) : <div className="org-detail-empty-state"><FiMail className="org-detail-empty-icon" /><div className="org-detail-empty-title">No pending invites</div><div className="org-detail-empty-subtitle">Invited members will appear here</div></div>}
          </div>
        </div>
      )}

      {activeTab === 'settings' && isOwnerOrAdmin && (
        <div className="org-detail-section">
          <div className="org-detail-section-label">SETTINGS HUB</div>
          <div className="org-detail-team-grid org-detail-settings-grid">
            <button type="button" className="org-detail-team-card" onClick={() => navigate(`/organisations/${id}/settings/members`)}>
              <div className="org-detail-team-avatar" style={getGradientStyle('members')}><FiUsers /></div>
              <div className="org-detail-team-name">Members</div>
              <div className="org-detail-team-meta"><span>Manage members and invitations</span></div>
            </button>
            <button type="button" className="org-detail-team-card" onClick={() => navigate(`/organisations/${id}/settings/roles`)}>
              <div className="org-detail-team-avatar" style={getGradientStyle('roles')}><FiSettings /></div>
              <div className="org-detail-team-name">Roles</div>
              <div className="org-detail-team-meta"><span>Custom role hierarchy</span></div>
            </button>
            <button type="button" className="org-detail-team-card" onClick={() => navigate(`/organisations/${id}/settings/compliance`)}>
              <div className="org-detail-team-avatar" style={getGradientStyle('compliance')}><FiCheck /></div>
              <div className="org-detail-team-name">Compliance</div>
              <div className="org-detail-team-meta"><span>Profile and field rules</span></div>
            </button>
            <button type="button" className="org-detail-team-card" onClick={() => navigate(`/organisations/${id}/settings/custom-fields`)}>
              <div className="org-detail-team-avatar" style={getGradientStyle('fields')}><FiEdit2 /></div>
              <div className="org-detail-team-name">Custom Fields</div>
              <div className="org-detail-team-meta"><span>Org-defined profile fields</span></div>
            </button>
            <button type="button" className="org-detail-team-card" onClick={() => navigate(`/organisations/${id}/settings/audit-log`)}>
              <div className="org-detail-team-avatar" style={getGradientStyle('audit')}><FiCalendar /></div>
              <div className="org-detail-team-name">Audit Log</div>
              <div className="org-detail-team-meta"><span>Read-only admin history</span></div>
            </button>
          </div>
          <div className="org-detail-section-label">ORGANISATION INFO</div>
          <form className="org-detail-settings-card" onSubmit={handleSaveSettings}>
            <div className="org-detail-field"><label className="org-detail-field-label" htmlFor="orgName">Name</label><input id="orgName" className="org-detail-input" type="text" maxLength={100} value={settingsForm.name} onChange={(e) => setSettingsForm((prev) => ({ ...prev, name: e.target.value }))} /></div>
            <div className="org-detail-field"><label className="org-detail-field-label" htmlFor="orgDescription">Description</label><textarea id="orgDescription" className="org-detail-input org-detail-textarea" rows={3} maxLength={500} value={settingsForm.description} onChange={(e) => setSettingsForm((prev) => ({ ...prev, description: e.target.value }))} /></div>
            <div className="org-detail-field"><label className="org-detail-field-label" htmlFor="orgLogo">Logo URL</label><input id="orgLogo" className="org-detail-input" type="text" value={settingsForm.logo} onChange={(e) => setSettingsForm((prev) => ({ ...prev, logo: e.target.value }))} />{settingsForm.logo && <img className="org-detail-logo-preview" src={getImageSrc(settingsForm.logo)} alt="Organisation logo preview" />}</div>
            <div className="org-detail-section-label org-detail-settings-label">PERMISSIONS</div>
            <div className="org-detail-toggle-list">
              <label className="org-detail-toggle-item"><div><div className="org-detail-toggle-title">Allow Member Invites</div><div className="org-detail-toggle-subtitle">Let members invite others to this organisation</div></div><span className="org-detail-switch"><input type="checkbox" checked={settingsForm.allowMemberInvites} onChange={(e) => setSettingsForm((prev) => ({ ...prev, allowMemberInvites: e.target.checked }))} /><span className="org-detail-slider" /></span></label>
              <label className="org-detail-toggle-item"><div><div className="org-detail-toggle-title">Require Approval to Join</div><div className="org-detail-toggle-subtitle">New members must be approved by an admin</div></div><span className="org-detail-switch"><input type="checkbox" checked={settingsForm.requireApprovalToJoin} onChange={(e) => setSettingsForm((prev) => ({ ...prev, requireApprovalToJoin: e.target.checked }))} /><span className="org-detail-slider" /></span></label>
            </div>
            {saveStatus.message && <div className={`org-detail-inline-message ${saveStatus.type}`}><FiCheck /> {saveStatus.message}</div>}
            <button className="org-detail-primary-btn org-detail-save-btn" type="submit" disabled={saveLoading}>{saveLoading ? 'Saving...' : <><FaSave /> Save Changes</>}</button>
          </form>
          {currentUserRole === 'owner' && (
            <div className="org-detail-danger-zone">
              <div className="org-detail-section-label org-detail-danger-label">DANGER ZONE</div>
              <div className="org-detail-danger-card">
                <div>
                  <div className="org-detail-danger-title">Delete Organisation</div>
                  <div className="org-detail-danger-subtitle">Permanently delete this org and all its data</div>
                </div>
                <button className="org-detail-outline-btn org-detail-danger-outline" type="button" onClick={() => setShowDeleteConfirm(true)}>Delete</button>
              </div>
              {showDeleteConfirm && <div className="org-detail-confirm-box"><p>Type "{org.name}" to confirm deletion</p><div className="org-detail-confirm-row"><input className="org-detail-input" type="text" value={deleteConfirmName} onChange={(e) => setDeleteConfirmName(e.target.value)} /><button className="org-detail-primary-btn org-detail-danger-btn" type="button" disabled={deleteConfirmName !== org.name || deleteLoading} onClick={handleDeleteOrganisation}>{deleteLoading ? 'Deleting...' : 'Confirm Delete'}</button><button className="org-detail-secondary-btn" type="button" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmName(''); }}>Cancel</button></div></div>}
            </div>
          )}
          {actionError && <div className="org-detail-inline-message error">{actionError}</div>}
        </div>
      )}

      {memberModalOpen && (
        <ProvisionMemberModal
          open={memberModalOpen}
          orgId={id}
          roles={orgRoles}
          onClose={() => setMemberModalOpen(false)}
          onCreated={async () => {
            const { data } = await api.get(`/api/orgs/${id}/members`, { params: { limit: 20 } });
            setMembersData(data.members || []);
          }}
        />
      )}

      {manageOpen && isOwnerOrAdmin && (
        <div className="org-detail-drawer-backdrop" onClick={() => setManageOpen(false)} role="presentation">
          <div className="org-detail-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="org-detail-drawer-header">
              <div>
                <div className="org-detail-eyebrow">ORGANISATION SETTINGS</div>
                <div className="org-detail-drawer-title">{org.name} - Settings</div>
              </div>
              <button className="org-detail-icon-btn" type="button" onClick={() => setManageOpen(false)}>×</button>
            </div>
            <div className="org-detail-tabs org-detail-drawer-tabs">
              {isOwnerOrAdmin && <button className={`org-detail-tab-btn ${managementTab === 'roles' ? 'active' : ''}`} type="button" onClick={() => setManagementTab('roles')}>Roles</button>}
              {isOwnerOrAdmin && <button className={`org-detail-tab-btn ${managementTab === 'compliance' ? 'active' : ''}`} type="button" onClick={() => setManagementTab('compliance')}>Compliance</button>}
              {isOwnerOrAdmin && <button className={`org-detail-tab-btn ${managementTab === 'customFields' ? 'active' : ''}`} type="button" onClick={() => setManagementTab('customFields')}>Custom Fields</button>}
              {isOwnerOrAdmin && <button className={`org-detail-tab-btn ${managementTab === 'audit' ? 'active' : ''}`} type="button" onClick={() => setManagementTab('audit')}>Audit Log</button>}
            </div>
            <div className="org-detail-drawer-body">
              {managementTab === 'roles' && (
                <div className="org-detail-inline-panel">
                  <div className="org-detail-section-label">ROLES</div>
                  <div className="org-detail-list-card">
                    {orgRoles.map((role) => <div key={role._id} className="org-detail-member-row"><div className="org-detail-row-left"><div className="org-detail-row-copy"><div className="org-detail-row-title">{role.name}</div><div className="org-detail-row-subtitle">{role.slug}</div></div></div><div className="org-detail-row-right">{role.isSystemRole ? <span className="org-detail-role-pill owner">Locked</span> : <span className="org-detail-role-pill member">Custom</span>}</div></div>)}
                  </div>
                </div>
              )}
              {managementTab === 'compliance' && (
                <div className="org-detail-inline-panel">
                  <div className="org-detail-section-label">COMPLIANCE</div>
                  <div className="org-detail-settings-card">
                    <div className="org-detail-toggle-list">
                      <label className="org-detail-toggle-item"><div><div className="org-detail-toggle-title">Require Profile Photo</div><div className="org-detail-toggle-subtitle">Users must upload a profile photo</div></div><span className="org-detail-switch"><input type="checkbox" checked={Boolean(complianceRules?.requireProfilePhoto)} readOnly /><span className="org-detail-slider" /></span></label>
                      <label className="org-detail-toggle-item"><div><div className="org-detail-toggle-title">Require Mobile Number</div><div className="org-detail-toggle-subtitle">Users must add a mobile number</div></div><span className="org-detail-switch"><input type="checkbox" checked={Boolean(complianceRules?.requireMobileNumber)} readOnly /><span className="org-detail-slider" /></span></label>
                      <label className="org-detail-toggle-item"><div><div className="org-detail-toggle-title">Require Full Name</div><div className="org-detail-toggle-subtitle">Users must have a non-empty name</div></div><span className="org-detail-switch"><input type="checkbox" checked={Boolean(complianceRules?.requireFullName)} readOnly /><span className="org-detail-slider" /></span></label>
                      <label className="org-detail-toggle-item"><div><div className="org-detail-toggle-title">Require Bio / Designation</div><div className="org-detail-toggle-subtitle">Users must set bio and designation</div></div><span className="org-detail-switch"><input type="checkbox" checked={Boolean(complianceRules?.requireBioDesignation)} readOnly /><span className="org-detail-slider" /></span></label>
                    </div>
                    <div className="org-detail-empty-inline">Required custom fields: {(complianceRules?.requiredCustomFieldSlugs || []).join(', ') || 'None'}</div>
                  </div>
                </div>
              )}
              {managementTab === 'customFields' && (
                <div className="org-detail-inline-panel">
                  <div className="org-detail-section-label">CUSTOM FIELDS</div>
                  <div className="org-detail-list-card">
                    {customFields.map((field) => <div key={field._id} className="org-detail-member-row"><div className="org-detail-row-left"><div className="org-detail-row-copy"><div className="org-detail-row-title">{field.label}</div><div className="org-detail-row-subtitle">{field.slug} · {field.fieldType}</div></div></div><div className="org-detail-row-right">{field.isRequired ? <span className="org-detail-role-pill owner">Required</span> : <span className="org-detail-role-pill member">Optional</span>}</div></div>)}
                  </div>
                </div>
              )}
              {managementTab === 'audit' && (
                <div className="org-detail-inline-panel">
                  <div className="org-detail-section-label">AUDIT LOG</div>
                  <AuditLogTable entries={auditEntries} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganisationDetailScreen;

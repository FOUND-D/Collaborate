import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiCopy, FiUserPlus } from 'react-icons/fi';
import api from '../utils/api';
import './OrgManagementPages.css';

const useOrgContext = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/organisations/${id}`);
        setOrg(data);
      } catch (e) {
        setError(e.response?.data?.message || e.response?.data?.error || 'Failed to load organisation');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return { id, org, setOrg, loading, error, navigate };
};

const PageShell = ({ title, subtitle, children, actions }) => (
  <div className="org-mgmt-page">
    <div className="org-mgmt-header">
      <div>
        <div className="org-mgmt-eyebrow">ORGANISATION SETTINGS</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="org-mgmt-actions">{actions}</div>
    </div>
    {children}
  </div>
);

const SectionCard = ({ children, className = '' }) => <div className={`org-mgmt-card ${className}`}>{children}</div>;

const Input = (props) => <input className="org-mgmt-input" {...props} />;
const Select = (props) => <select className="org-mgmt-input" {...props} />;
const Textarea = (props) => <textarea className="org-mgmt-input org-mgmt-textarea" {...props} />;
const DESIGNATION_OPTIONS = ['Developer', 'Designer', 'Product Manager', 'QA', 'DevOps', 'Other'];

const buildProvisionEmail = ({ name, email, organisation }) => {
  if (String(email || '').includes('@')) {
    return email;
  }

  const localPart = String(email || name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  const orgPart = String(organisation?.slug || organisation?.name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!localPart || !orgPart) return email;
  return `${localPart}@${orgPart}.collaborate.local`;
};

const buildShareableProvisionCopy = (credentials) => [
  `Organisation: ${credentials.organisationName || 'Collaborate'}`,
  `Email: ${credentials.email}`,
  `Temporary password: ${credentials.tempPassword}`,
  `Onboarding link: ${credentials.onboardingUrl || credentials.onboardingPath || ''}`,
].join('\n');

const getProvisionErrorMessage = (error) => {
  const code = error.response?.data?.error;
  if (code === 'EMAIL_EXISTS') return 'A user with that provisioned email already exists.';
  if (code === 'FORBIDDEN') return 'Your current organisation role cannot assign the selected role.';
  if (code === 'ROLE_NOT_FOUND') return 'The selected organisation role no longer exists.';
  if (code === 'ORG_NOT_FOUND') return 'The organisation could not be found.';
  return code || error.response?.data?.message || 'Request failed';
};

export const ProvisionMemberModal = ({ open, orgId, org, roles, onClose, onCreated }) => {
  const [mode, setMode] = useState('provision');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', orgRoleId: '', mobileNumber: '', designation: '' });
  const [tempCreds, setTempCreds] = useState(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const roleOptions = useMemo(() => (Array.isArray(roles) ? roles : []), [roles]);

  useEffect(() => {
    if (open) {
      setForm({ name: '', email: '', orgRoleId: roleOptions[0]?._id || '', mobileNumber: '', designation: '' });
      setTempCreds(null);
      setEmailTouched(false);
      setActionMessage('');
      setErrorMessage('');
    }
  }, [open, roleOptions]);

  useEffect(() => {
    if (mode !== 'provision' || emailTouched) return;
    setForm((prev) => ({
      ...prev,
      email: buildProvisionEmail({ name: prev.name, email: prev.email, organisation: org }),
    }));
  }, [mode, org, emailTouched, form.name]);

  if (!open) return null;

  const credentials = tempCreds ? {
    ...tempCreds,
    onboardingUrl: `${window.location.origin}${tempCreds.onboardingPath || ''}`,
  } : null;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setActionMessage('');
    setErrorMessage('');
    try {
      if (mode === 'provision') {
        const { data } = await api.post(`/api/orgs/${orgId}/members/provision`, form);
        setTempCreds(data);
        onCreated?.();
      } else {
        await api.post(`/api/organisations/${orgId}/members/invite`, { email: form.email, role: 'member' });
        onCreated?.();
        onClose();
      }
    } catch (error) {
      setErrorMessage(getProvisionErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!credentials) return;
    await navigator.clipboard.writeText(buildShareableProvisionCopy(credentials));
    setActionMessage('Copied onboarding details');
  };

  const handleCopyLink = async () => {
    if (!credentials?.onboardingUrl) return;
    await navigator.clipboard.writeText(credentials.onboardingUrl);
    setActionMessage('Copied onboarding link');
  };

  const handleResetTempPassword = async () => {
    if (!credentials?.userId) return;
    setLoading(true);
    setActionMessage('');
    setErrorMessage('');
    try {
      const { data } = await api.post(`/api/orgs/${orgId}/members/${credentials.userId}/reset-temp-password`);
      setTempCreds(data);
      setActionMessage('Temporary password reset');
      onCreated?.();
    } catch (error) {
      setErrorMessage(getProvisionErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="org-mgmt-modal-backdrop">
      <div className="org-mgmt-modal">
        <div className="org-mgmt-modal-top">
          <div>
            <div className="org-mgmt-eyebrow">ADD MEMBER</div>
            <h3>{mode === 'provision' ? 'Provision Account' : 'Invite by Email'}</h3>
          </div>
          <button className="org-mgmt-icon-btn" onClick={onClose} type="button">×</button>
        </div>
        {!tempCreds ? (
          <>
            <div className="org-mgmt-tabs">
              <button type="button" className={mode === 'provision' ? 'active' : ''} onClick={() => setMode('provision')}>Provision Account</button>
              <button type="button" className={mode === 'invite' ? 'active' : ''} onClick={() => setMode('invite')}>Invite by Email</button>
            </div>
            <form onSubmit={submit} className="org-mgmt-stack">
              {mode === 'provision' && <Input placeholder="Full name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />}
              <Input type="email" placeholder={mode === 'provision' ? `Email address (defaults to ${org?.slug || 'organisation'} domain)` : 'Email address'} value={form.email} onChange={(e) => { setEmailTouched(true); setForm((p) => ({ ...p, email: e.target.value })); }} required />
              {mode === 'provision' && (
                <>
                  <Select value={form.orgRoleId} onChange={(e) => setForm((p) => ({ ...p, orgRoleId: e.target.value }))}>
                    {roleOptions.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </Select>
                  <Input placeholder="Mobile number" value={form.mobileNumber} onChange={(e) => setForm((p) => ({ ...p, mobileNumber: e.target.value }))} />
                  <Select value={form.designation} onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))}>
                    <option value="">Designation</option>
                    {DESIGNATION_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </Select>
                </>
              )}
              <div className="org-mgmt-row">
                <button className="org-mgmt-primary-btn" disabled={loading} type="submit">{loading ? 'Working...' : mode === 'provision' ? 'Create Account' : 'Send Invite'}</button>
                <button className="org-mgmt-secondary-btn" type="button" onClick={onClose}>Cancel</button>
              </div>
              {errorMessage && <div className="org-mgmt-error">{errorMessage}</div>}
            </form>
          </>
        ) : (
          <div className="org-mgmt-credentials">
            <div className="org-mgmt-success"><FiCheck /> Account created successfully.</div>
            <div className="org-mgmt-credential-line"><span>Organisation</span><strong>{credentials.organisationName}</strong></div>
            <div className="org-mgmt-credential-line"><span>Email</span><strong>{credentials.email}</strong></div>
            <div className="org-mgmt-credential-line"><span>Password</span><strong>{credentials.tempPassword}</strong></div>
            <div className="org-mgmt-credential-link">
              <span>Onboarding link</span>
              <a href={credentials.onboardingUrl} target="_blank" rel="noreferrer">{credentials.onboardingUrl}</a>
            </div>
            <p>Share the onboarding link with the user and separately share the temporary password. If the password is lost, reset it here.</p>
            <div className="org-mgmt-row">
              <button className="org-mgmt-secondary-btn" type="button" onClick={handleCopyCredentials}><FiCopy /> Copy Login Details</button>
              <button className="org-mgmt-secondary-btn" type="button" onClick={handleCopyLink}><FiCopy /> Copy Onboarding Link</button>
              <button className="org-mgmt-secondary-btn" type="button" onClick={handleResetTempPassword} disabled={loading}>Reset Temporary Password</button>
              <button className="org-mgmt-primary-btn" type="button" onClick={onClose}>Done</button>
            </div>
            {actionMessage && <div className="org-mgmt-info">{actionMessage}</div>}
            {errorMessage && <div className="org-mgmt-error">{errorMessage}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export const RoleSelector = ({ roles, value, onChange, disabled }) => (
  <Select value={value || ''} onChange={onChange} disabled={disabled}>{roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}</Select>
);

export const ComplianceBadge = ({ status }) => <span className={`org-mgmt-badge ${status}`}>{status === 'pending_onboarding' ? 'Pending onboarding' : status}</span>;

export const CustomFieldInput = ({ field, value, onChange }) => {
  if (field.fieldType === 'select') return <Select value={value || ''} onChange={(e) => onChange(e.target.value)}>{(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</Select>;
  if (field.fieldType === 'date') return <Input type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
  if (field.fieldType === 'number') return <Input type="number" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
  if (field.fieldType === 'url') return <Input type="url" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
  return <Input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
};

export const OrgRolePermissionsGrid = ({ permissions, value, onChange, limit = permissions }) => (
  <div className="org-mgmt-permissions-grid">
    {permissions.map((perm) => (
      <label key={perm.key} className="org-mgmt-permission">
        <input type="checkbox" checked={!!value[perm.key]} onChange={(e) => onChange({ ...value, [perm.key]: e.target.checked })} disabled={!limit.includes(perm.key)} />
        <span>{perm.label}</span>
      </label>
    ))}
  </div>
);

export const AuditLogTable = ({ entries }) => (
  <div className="org-mgmt-table">
    {entries.map((entry) => (
      <details key={entry._id} className="org-mgmt-details">
        <summary>
          <span>{new Date(entry.createdAt).toLocaleString()}</span>
          <span>{entry.action}</span>
          <span>{entry.actorId}</span>
          <span>{entry.targetUserId || '—'}</span>
        </summary>
        <pre>{JSON.stringify(entry.metadata, null, 2)}</pre>
      </details>
    ))}
  </div>
);

export const MembersPage = () => {
  const { id, org, loading, error } = useOrgContext();
  const [data, setData] = useState([]);
  const [query, setQuery] = useState({ search: '', role: '', status: '', page: 1 });
  const [roles, setRoles] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => { api.get(`/api/orgs/${id}/roles`).then((r) => setRoles(r.data)); }, [id]);
  useEffect(() => { api.get(`/api/orgs/${id}/members`, { params: { ...query, limit: 20 } }).then((r) => setData(r.data.members || [])); }, [id, query]);

  const actions = <button className="org-mgmt-primary-btn" onClick={() => setOpen(true)} type="button"><FiUserPlus /> Add Member</button>;
  if (loading) return <PageShell title="Members" subtitle="Loading..." actions={actions}><SectionCard>Loading...</SectionCard></PageShell>;
  if (error) return <PageShell title="Members" subtitle={error} actions={actions}><SectionCard>{error}</SectionCard></PageShell>;
  return (
    <PageShell title="Members" subtitle={org?.name || ''} actions={actions}>
      <SectionCard>
        <div className="org-mgmt-filterbar">
          <Input placeholder="Search name or email" value={query.search} onChange={(e) => setQuery((p) => ({ ...p, search: e.target.value }))} />
          <Select value={query.role} onChange={(e) => setQuery((p) => ({ ...p, role: e.target.value }))}><option value="">All roles</option>{roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}</Select>
          <Select value={query.status} onChange={(e) => setQuery((p) => ({ ...p, status: e.target.value }))}><option value="">All status</option><option value="active">active</option><option value="pending_onboarding">pending_onboarding</option><option value="suspended">suspended</option></Select>
        </div>
        <div className="org-mgmt-table org-mgmt-member-table">
          {data.map((m) => <div key={m.userId} className="org-mgmt-row-item"><span>{m.user?.name || 'Unknown'}</span><span>{m.user?.email}</span><span>{m.role}</span><ComplianceBadge status={m.status} /></div>)}
        </div>
      </SectionCard>
      <ProvisionMemberModal open={open} orgId={id} org={org} roles={roles} onClose={() => setOpen(false)} />
    </PageShell>
  );
};

export const RolesPage = () => {
  const { id, org } = useOrgContext();
  const [roles, setRoles] = useState([]);
  useEffect(() => { api.get(`/api/orgs/${id}/roles`).then((r) => setRoles(r.data)); }, [id]);
  return <PageShell title="Roles" subtitle={org?.name || ''}><SectionCard>{roles.map((r) => <div key={r._id} className="org-mgmt-row-item"><span>{r.name}</span><span>{r.slug}</span><span>{r.isSystemRole ? 'Locked' : 'Custom'}</span></div>)}</SectionCard></PageShell>;
};

export const CompliancePage = () => {
  const { id, org } = useOrgContext();
  const [rules, setRules] = useState(null);
  useEffect(() => { api.get(`/api/orgs/${id}/compliance`).then((r) => setRules(r.data)); }, [id]);
  return <PageShell title="Compliance" subtitle={org?.name || ''}><SectionCard>{rules ? <pre>{JSON.stringify(rules, null, 2)}</pre> : 'Loading...'}</SectionCard></PageShell>;
};

export const CustomFieldsPage = () => {
  const { id, org } = useOrgContext();
  const [fields, setFields] = useState([]);
  useEffect(() => { api.get(`/api/orgs/${id}/custom-fields`).then((r) => setFields(r.data)); }, [id]);
  return <PageShell title="Custom Fields" subtitle={org?.name || ''}><SectionCard>{fields.map((f) => <div key={f._id} className="org-mgmt-row-item"><span>{f.label}</span><span>{f.slug}</span><span>{f.fieldType}</span></div>)}</SectionCard></PageShell>;
};

export const AuditLogPage = () => {
  const { id, org } = useOrgContext();
  const [entries, setEntries] = useState([]);
  useEffect(() => { api.get(`/api/orgs/${id}/audit-log`).then((r) => setEntries(r.data.entries || [])); }, [id]);
  return <PageShell title="Audit Log" subtitle={org?.name || ''}><SectionCard><AuditLogTable entries={entries} /></SectionCard></PageShell>;
};

export const CompleteProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [missing, setMissing] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get(`/api/orgs/${id}/compliance/me`), api.get(`/api/orgs/${id}/custom-fields`)]).then(([compliance, fields]) => {
      setMissing(compliance.data.missing || []);
      setCustomFields(fields.data || []);
      setLoading(false);
    });
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    await api.patch('/api/users/profile', form);
    const { data } = await api.get(`/api/orgs/${id}/compliance/me`);
    if (data.compliant) navigate(`/organisations/${id}`);
    else setMissing(data.missing || []);
  };

  if (loading) return <div className="org-mgmt-blocker">Loading...</div>;

  return (
    <div className="org-mgmt-blocker">
      <SectionCard className="org-mgmt-blocker-card">
        <div className="org-mgmt-eyebrow">MANDATORY</div>
        <h1>Complete Your Profile</h1>
        <p>Finish the missing fields before you can continue.</p>
        <form onSubmit={submit} className="org-mgmt-stack">
          {missing.includes('profile_photo') && <Input placeholder="Profile image URL" onChange={(e) => setForm((p) => ({ ...p, profileImage: e.target.value }))} />}
          {missing.includes('mobile_number') && <Input placeholder="Mobile number" onChange={(e) => setForm((p) => ({ ...p, mobileNumber: e.target.value }))} />}
          {missing.includes('full_name') && <Input placeholder="Full name" onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />}
          {missing.includes('bio_designation') && (
            <>
              <Textarea placeholder="Bio" onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} />
              <Input placeholder="Designation" onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))} />
            </>
          )}
          {customFields.map((field) => missing.includes(`custom_field:${field.slug}`) && (
            <CustomFieldInput
              key={field._id}
              field={field}
              value={form[field.slug]}
              onChange={(value) => setForm((p) => ({ ...p, customFields: { ...(p.customFields || {}), [field.slug]: value } }))}
            />
          ))}
          <button className="org-mgmt-primary-btn" type="submit">Save and Continue</button>
        </form>
      </SectionCard>
    </div>
  );
};

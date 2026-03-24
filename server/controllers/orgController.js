const asyncHandler = require('../middleware/asyncHandler');
const { supabase, crypto, toPublicOrgRole, toPublicOrgMember, toPublicComplianceRules, toPublicCustomField, toPublicAuditLog, createUser, getUserByEmail } = require('../lib/repo');
const { enforceOrgCompliance } = require('../middleware/orgMiddleware');

const ROLE_FLAGS = ['can_manage_members', 'can_manage_roles', 'can_manage_settings', 'can_manage_teams', 'can_invite_members', 'can_view_reports'];

const generatePassword = () => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*()-_=+[]{};:,.<>?';
  const all = upper + lower + digits + special;
  const pick = (chars) => chars[crypto.randomInt(0, chars.length)];
  const chars = [pick(upper), pick(lower), pick(digits), pick(special)];
  while (chars.length < 12) chars.push(pick(all));
  return chars.sort(() => crypto.randomInt(0, 2) - 1).join('');
};

const getOrgRole = async (orgId, roleId) => {
  const { data, error } = await supabase.from('org_roles').select('*').eq('org_id', orgId).eq('id', roleId).maybeSingle();
  if (error) throw error;
  return data;
};

const assertRoleHierarchy = (actorRole, targetRole) => ROLE_FLAGS.every((flag) => !targetRole[flag] || actorRole[flag]);

const logAudit = async (organisationId, actorId, action, targetUserId, metadata = {}) => {
  await supabase.from('org_audit_log').insert({
    organisation_id: organisationId,
    actor_id: actorId,
    action,
    target_user_id: targetUserId || null,
    metadata,
  });
};

const getOrgContext = async (orgId, userId) => {
  const { data: memberRow, error } = await supabase
    .from('organisation_members')
    .select('*, users(*), org_roles(*)')
    .eq('organisation_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return memberRow;
};

const listMembers = asyncHandler(async (req, res) => {
  const { search = '', role = '', status = '', page = 1, limit = 20 } = req.query;
  let query = supabase.from('organisation_members').select('*, users(*), org_roles(*)', { count: 'exact' }).eq('organisation_id', req.params.orgId);
  if (status) query = query.eq('status', status);
  if (role) query = query.eq('role', role);
  if (search) query = query.or(`users.name.ilike.%${search}%,users.email.ilike.%${search}%`);
  const start = (Number(page) - 1) * Number(limit);
  const end = start + Number(limit) - 1;
  query = query.range(start, end).order('joined_at', { ascending: false });
  const { data, count, error } = await query;
  if (error) throw error;
  res.json({ members: (data || []).map(toPublicOrgMember), page: Number(page), limit: Number(limit), total: count || 0 });
});

const provisionMember = asyncHandler(async (req, res) => {
  const { name, email, orgRoleId, mobileNumber = '', designation = '' } = req.body;
  const existing = await getUserByEmail(email);
  if (existing) return res.status(409).json({ error: 'EMAIL_EXISTS' });
  const orgRole = await getOrgRole(req.params.orgId, orgRoleId);
  if (!orgRole) return res.status(404).json({ error: 'ROLE_NOT_FOUND' });
  if (!assertRoleHierarchy(req.orgRole, orgRole)) return res.status(403).json({ error: 'FORBIDDEN' });
  const tempPassword = generatePassword();
  const user = await createUser({ name, email, password: tempPassword, role: 'Developer' });
  const { error } = await supabase.from('users').update({ mobile_number: mobileNumber, designation, bio: '' }).eq('id', user._id);
  if (error) throw error;
  await supabase.from('organisation_members').insert({
    organisation_id: req.params.orgId,
    user_id: user._id,
    org_role_id: orgRoleId,
    role: orgRole.slug,
    is_provisioned: true,
    temp_password_plain: tempPassword,
    temp_password_used: false,
    invited_by: req.user._id,
    status: 'pending_onboarding',
  });
  await logAudit(req.params.orgId, req.user._id, 'member.created', user._id, { orgRoleId, email });
  res.status(201).json({ userId: user._id, email, tempPassword });
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { orgRoleId } = req.body;
  const target = await supabase.from('organisation_members').select('*, org_roles(*)').eq('organisation_id', req.params.orgId).eq('user_id', req.params.userId).maybeSingle();
  if (!target.data) return res.status(404).json({ error: 'MEMBER_NOT_FOUND' });
  if (target.data.role === 'owner' && req.orgRole.slug !== 'owner') return res.status(403).json({ error: 'FORBIDDEN' });
  const nextRole = await getOrgRole(req.params.orgId, orgRoleId);
  if (!nextRole) return res.status(404).json({ error: 'ROLE_NOT_FOUND' });
  if (!assertRoleHierarchy(req.orgRole, nextRole)) return res.status(403).json({ error: 'FORBIDDEN' });
  const { error } = await supabase.from('organisation_members').update({ org_role_id: orgRoleId, role: nextRole.slug }).eq('organisation_id', req.params.orgId).eq('user_id', req.params.userId);
  if (error) throw error;
  await logAudit(req.params.orgId, req.user._id, 'role.assigned', req.params.userId, { from_role: target.data.role, to_role: nextRole.slug });
  res.json({ ok: true });
});

const updateMemberStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { error } = await supabase.from('organisation_members').update({ status }).eq('organisation_id', req.params.orgId).eq('user_id', req.params.userId);
  if (error) throw error;
  res.json({ ok: true });
});

const removeMember = asyncHandler(async (req, res) => {
  await supabase.from('organisation_members').delete().eq('organisation_id', req.params.orgId).eq('user_id', req.params.userId);
  res.json({ ok: true });
});

const listRoles = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('org_roles').select('*').eq('org_id', req.params.orgId).order('created_at', { ascending: true });
  if (error) throw error;
  res.json((data || []).map(toPublicOrgRole));
});

const createRole = asyncHandler(async (req, res) => {
  const payload = {
    org_id: req.params.orgId,
    name: req.body.name,
    slug: req.body.slug,
    can_manage_members: !!req.body.canManageMembers,
    can_manage_roles: !!req.body.canManageRoles,
    can_manage_settings: !!req.body.canManageSettings,
    can_manage_teams: !!req.body.canManageTeams,
    can_invite_members: !!req.body.canInviteMembers,
    can_view_reports: !!req.body.canViewReports,
    is_system_role: false,
  };
  const { data, error } = await supabase.from('org_roles').insert(payload).select('*').single();
  if (error) throw error;
  res.status(201).json(toPublicOrgRole(data));
});

const updateRole = asyncHandler(async (req, res) => {
  const { data: existing } = await supabase.from('org_roles').select('*').eq('org_id', req.params.orgId).eq('id', req.params.roleId).maybeSingle();
  if (!existing) return res.status(404).json({ error: 'ROLE_NOT_FOUND' });
  if (existing.is_system_role) return res.status(403).json({ error: 'SYSTEM_ROLE_LOCKED' });
  const updates = {};
  ['name', 'slug'].forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });
  ROLE_FLAGS.forEach((flag) => {
    const bodyKey = flag.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (req.body[bodyKey] !== undefined) updates[flag] = !!req.body[bodyKey];
  });
  const { data, error } = await supabase.from('org_roles').update(updates).eq('id', req.params.roleId).select('*').single();
  if (error) throw error;
  res.json(toPublicOrgRole(data));
});

const deleteRole = asyncHandler(async (req, res) => {
  const { data: existing } = await supabase.from('org_roles').select('*').eq('org_id', req.params.orgId).eq('id', req.params.roleId).maybeSingle();
  if (!existing) return res.status(404).json({ error: 'ROLE_NOT_FOUND' });
  if (existing.is_system_role) return res.status(403).json({ error: 'SYSTEM_ROLE_LOCKED' });
  await supabase.from('org_roles').delete().eq('id', req.params.roleId);
  res.json({ ok: true });
});

const getCompliance = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('org_compliance_rules').select('*').eq('organisation_id', req.params.orgId).maybeSingle();
  if (error) throw error;
  res.json(toPublicComplianceRules(data));
});

const updateCompliance = asyncHandler(async (req, res) => {
  const payload = {
    require_profile_photo: !!req.body.requireProfilePhoto,
    require_mobile_number: !!req.body.requireMobileNumber,
    require_full_name: !!req.body.requireFullName,
    require_bio_designation: !!req.body.requireBioDesignation,
    required_custom_field_slugs: req.body.requiredCustomFieldSlugs || [],
  };
  const { data, error } = await supabase.from('org_compliance_rules').update(payload).eq('organisation_id', req.params.orgId).select('*').single();
  if (error) throw error;
  await logAudit(req.params.orgId, req.user._id, 'rules.updated', null, payload);
  res.json(toPublicComplianceRules(data));
});

const getComplianceMe = asyncHandler(async (req, res) => {
  const result = await enforceOrgCompliance(req.params.orgId, req.user._id, { skipIfOwnerManaging: true });
  res.json(result);
});

const listCustomFields = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('org_custom_fields').select('*').eq('organisation_id', req.params.orgId).order('sort_order', { ascending: true });
  if (error) throw error;
  res.json((data || []).map(toPublicCustomField));
});

const createCustomField = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('org_custom_fields').insert({
    organisation_id: req.params.orgId,
    label: req.body.label,
    slug: req.body.slug,
    field_type: req.body.type,
    options: req.body.options || [],
    is_required: !!req.body.isRequired,
    sort_order: req.body.sortOrder || 0,
  }).select('*').single();
  if (error) throw error;
  res.status(201).json(toPublicCustomField(data));
});

const updateCustomField = asyncHandler(async (req, res) => {
  const updates = {};
  if (req.body.label !== undefined) updates.label = req.body.label;
  if (req.body.slug !== undefined) updates.slug = req.body.slug;
  if (req.body.type !== undefined) updates.field_type = req.body.type;
  if (req.body.options !== undefined) updates.options = req.body.options;
  if (req.body.isRequired !== undefined) updates.is_required = !!req.body.isRequired;
  if (req.body.sortOrder !== undefined) updates.sort_order = req.body.sortOrder;
  const { data, error } = await supabase.from('org_custom_fields').update(updates).eq('organisation_id', req.params.orgId).eq('id', req.params.fieldId).select('*').single();
  if (error) throw error;
  res.json(toPublicCustomField(data));
});

const deleteCustomField = asyncHandler(async (req, res) => {
  await supabase.from('org_custom_fields').delete().eq('organisation_id', req.params.orgId).eq('id', req.params.fieldId);
  res.json({ ok: true });
});

const getAuditLog = asyncHandler(async (req, res) => {
  let query = supabase.from('org_audit_log').select('*', { count: 'exact' }).eq('organisation_id', req.params.orgId).order('created_at', { ascending: false });
  if (req.query.action) query = query.eq('action', req.query.action);
  if (req.query.actorId) query = query.eq('actor_id', req.query.actorId);
  if (req.query.from) query = query.gte('created_at', req.query.from);
  if (req.query.to) query = query.lte('created_at', req.query.to);
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const { data, count, error } = await query.range((page - 1) * limit, page * limit - 1);
  if (error) throw error;
  res.json({ entries: (data || []).map(toPublicAuditLog), page, limit, total: count || 0 });
});

module.exports = {
  listMembers,
  provisionMember,
  updateMemberRole,
  updateMemberStatus,
  removeMember,
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  getCompliance,
  updateCompliance,
  getComplianceMe,
  listCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  getAuditLog,
};

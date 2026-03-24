const asyncHandler = require('./asyncHandler');
const { supabase, toPublicOrgRole, toPublicOrgMember, toPublicComplianceRules } = require('../lib/repo');

const PERMISSION_FLAGS = {
  can_manage_members: 'can_manage_members',
  can_manage_roles: 'can_manage_roles',
  can_manage_settings: 'can_manage_settings',
  can_manage_teams: 'can_manage_teams',
  can_invite_members: 'can_invite_members',
  can_view_reports: 'can_view_reports',
};

const legacyRolePermissions = (role) => ({
  owner: {
    can_manage_members: true,
    can_manage_roles: true,
    can_manage_settings: true,
    can_manage_teams: true,
    can_invite_members: true,
    can_view_reports: true,
  },
  admin: {
    can_manage_members: true,
    can_manage_roles: false,
    can_manage_settings: true,
    can_manage_teams: true,
    can_invite_members: true,
    can_view_reports: true,
  },
  member: {
    can_manage_members: false,
    can_manage_roles: false,
    can_manage_settings: false,
    can_manage_teams: false,
    can_invite_members: false,
    can_view_reports: false,
  },
}[role] || {
  can_manage_members: false,
  can_manage_roles: false,
  can_manage_settings: false,
  can_manage_teams: false,
  can_invite_members: false,
  can_view_reports: false,
});

const getOrgContext = async (orgId, userId) => {
  const { data: memberRow, error: memberError } = await supabase
    .from('organisation_members')
    .select('organisation_id,user_id,org_role_id,role,status,is_provisioned,temp_password_used,invited_by,joined_at,users(*),org_roles(*)')
    .eq('organisation_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();
  if (memberError) throw memberError;
  if (!memberRow) return null;
  const orgRole = memberRow.org_roles || {
    slug: memberRow.role,
    name: memberRow.role,
    is_system_role: true,
    ...legacyRolePermissions(memberRow.role),
  };
  return {
    member: toPublicOrgMember(memberRow),
    orgRole: toPublicOrgRole(orgRole),
    rawMember: memberRow,
  };
};

const requireOrgMember = asyncHandler(async (req, res, next) => {
  const orgId = req.params.orgId || req.params.id;
  if (!orgId) return res.status(400).json({ error: 'ORG_ID_REQUIRED' });
  const context = await getOrgContext(orgId, req.user._id);
  if (!context) return res.status(403).json({ error: 'NOT_ORG_MEMBER' });
  req.orgId = orgId;
  req.orgMember = context.member;
  req.orgRole = context.orgRole;
  req.orgMemberRaw = context.rawMember;
  if (context.rawMember?.is_provisioned && !context.rawMember?.temp_password_used) {
    return res.status(403).json({ error: 'TEMP_PASSWORD_NOT_USED' });
  }
  next();
});

const requireOrgPermission = (flag) => asyncHandler(async (req, res, next) => {
  const context = await getOrgContext(req.params.orgId || req.params.id, req.user._id);
  if (!context) return res.status(403).json({ error: 'NOT_ORG_MEMBER' });
  if (!context.orgRole?.[flag]) return res.status(403).json({ error: 'FORBIDDEN' });
  req.orgId = req.params.orgId || req.params.id;
  req.orgMember = context.member;
  req.orgRole = context.orgRole;
  req.orgMemberRaw = context.rawMember;
  next();
});

const enforceOrgCompliance = async (orgId, userId, { skipIfOwnerManaging = false } = {}) => {
  const { data: rulesRow, error: rulesError } = await supabase
    .from('org_compliance_rules')
    .select('*')
    .eq('org_id', orgId)
    .maybeSingle();
  if (rulesError) throw rulesError;
  if (!rulesRow) return { compliant: true, missing: [] };
  const { data: memberRow, error: memberError } = await supabase
    .from('organisation_members')
    .select('status,is_provisioned,temp_password_used,role,users(*)')
    .eq('organisation_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();
  if (memberError) throw memberError;
  if (!memberRow) return { compliant: false, missing: ['org_membership'] };
  if (skipIfOwnerManaging && memberRow.role === 'owner') return { compliant: true, missing: [] };
  const user = memberRow.users || {};
  const missing = [];
  if (rulesRow.require_profile_photo && !user.profile_image) missing.push('profile_photo');
  if (rulesRow.require_mobile_number && !user.mobile_number) missing.push('mobile_number');
  if (rulesRow.require_full_name && !String(user.name || '').trim()) missing.push('full_name');
  if (rulesRow.require_bio_designation && (!String(user.bio || '').trim() || !String(user.designation || '').trim())) missing.push('bio_designation');
  const customFields = user.custom_fields || {};
  for (const slug of rulesRow.required_custom_field_slugs || []) {
    if (!customFields || customFields[slug] === undefined || customFields[slug] === null || customFields[slug] === '') {
      missing.push(`custom_field:${slug}`);
    }
  }
  return { compliant: missing.length === 0, missing };
};

const requireOrgCompliance = asyncHandler(async (req, res, next) => {
  const orgId = req.params.orgId || req.params.id;
  const result = await enforceOrgCompliance(orgId, req.user._id);
  if (!result.compliant) {
    const { data: memberRow } = await supabase
      .from('organisation_members')
      .select('is_provisioned,temp_password_used')
      .eq('organisation_id', orgId)
      .eq('user_id', req.user._id)
      .maybeSingle();
    if (memberRow?.is_provisioned && memberRow?.temp_password_used) {
      return res.status(403).json({ error: 'PROFILE_INCOMPLETE', missing: result.missing });
    }
  }
  req.orgCompliance = result;
  next();
});

module.exports = { PERMISSION_FLAGS, requireOrgMember, requireOrgPermission, enforceOrgCompliance, requireOrgCompliance };

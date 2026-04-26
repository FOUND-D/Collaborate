const asyncHandler = require('./asyncHandler');
const { supabase, toPublicOrgRole, toPublicOrgMember, toPublicComplianceRules } = require('../lib/repo');

const PERMISSION_FLAGS = {
  canManageMembers: 'canManageMembers',
  canManageRoles: 'canManageRoles',
  canManageSettings: 'canManageSettings',
  canManageTeams: 'canManageTeams',
  canInviteMembers: 'canInviteMembers',
  canViewReports: 'canViewReports',
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

const ownerRolePermissions = () => ({
  slug: 'owner',
  name: 'Owner',
  is_system_role: true,
  can_manage_members: true,
  can_manage_roles: true,
  can_manage_settings: true,
  can_manage_teams: true,
  can_invite_members: true,
  can_view_reports: true,
});

const getOrgContext = async (orgId, userId) => {
  console.log(`[getOrgContext] Fetching context for org:${orgId} user:${userId}`);
  const { data: memberRow, error: memberError } = await supabase
    .from('organisation_members')
    .select('organisation_id,user_id,org_role_id,role,status,is_provisioned,temp_password_used,invited_by,joined_at,users!organisation_members_user_id_fkey(*),org_roles(*),organisations!inner(owner_id)')
    .eq('organisation_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (memberError) {
    console.error(`[getOrgContext] Database error:`, memberError);
    throw memberError;
  }

  if (!memberRow) {
    console.warn(`[getOrgContext] No membership found for user:${userId} in org:${orgId}`);
    return null;
  }

  const isOrganisationOwner = memberRow.organisations?.owner_id === userId;

  const orgRole = isOrganisationOwner ? {
    id: memberRow.org_roles?.id || null,
    org_id: orgId,
    ...ownerRolePermissions(),
  } : memberRow.org_roles || {
    slug: memberRow.role,
    name: memberRow.role,
    is_system_role: true,
    ...legacyRolePermissions(memberRow.role),
  };

  const context = {
    member: toPublicOrgMember(memberRow),
    orgRole: toPublicOrgRole(orgRole),
    rawMember: memberRow,
  };

  console.log(`[getOrgContext] Success. Role slug: ${orgRole.slug}. Permissions:`, context.orgRole);
  return context;
};

const requireOrgMember = asyncHandler(async (req, res, next) => {
  const orgId = req.params.orgId || req.params.id;
  console.log(`[requireOrgMember] Checking membership for org:${orgId}`);
  if (!orgId) {
    console.warn(`[requireOrgMember] Missing orgId in request`);
    return res.status(400).json({ error: 'ORG_ID_REQUIRED' });
  }

  const context = await getOrgContext(orgId, req.user._id);
  if (!context) {
    console.warn(`[requireOrgMember] Access denied: User ${req.user._id} is not a member of ${orgId}`);
    return res.status(403).json({ error: 'NOT_ORG_MEMBER' });
  }

  req.orgId = orgId;
  req.orgMember = context.member;
  req.orgRole = context.orgRole;
  req.orgMemberRaw = context.rawMember;

  if (context.rawMember?.is_provisioned && !context.rawMember?.temp_password_used) {
    console.warn(`[requireOrgMember] Access blocked: User must use temporary password first`);
    return res.status(403).json({ error: 'TEMP_PASSWORD_NOT_USED' });
  }

  console.log(`[requireOrgMember] Authorized.`);
  next();
});

const requireRole = (allowedRoles = []) => asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'NOT_AUTHENTICATED' });
  }

  const normalizedAllowedRoles = allowedRoles.map((role) => String(role).toLowerCase());
  const userRole = String(req.user.role || '').toLowerCase();

  if (!normalizedAllowedRoles.includes(userRole)) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      role: req.user.role || null,
      allowedRoles,
    });
  }

  next();
});

const requireOrgPermission = (flag) => asyncHandler(async (req, res, next) => {
  const orgId = req.params.orgId || req.params.id;
  console.log(`[requireOrgPermission] START - flag:${flag} org:${orgId} user:${req.user?._id}`);
  
  if (!orgId) {
    console.warn(`[requireOrgPermission] FAIL - No orgId found in params`);
    return res.status(400).json({ error: 'ORG_ID_REQUIRED' });
  }

  const context = await getOrgContext(orgId, req.user._id);
  if (!context) {
    console.warn(`[requireOrgPermission] FAIL - Context not found for user:${req.user._id} in org:${orgId}`);
    return res.status(403).json({ error: 'NOT_ORG_MEMBER' });
  }

  // Support both snake_case and camelCase for better flexibility
  const snakeFlag = flag.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  const hasPermission = context.orgRole?.[flag] || context.orgRole?.[snakeFlag];

  console.log(`[requireOrgPermission] Evaluation - Flag:${flag}, SnakeFlag:${snakeFlag}, HasPerm:${!!hasPermission}`);

  if (!hasPermission) {
    console.warn(`[requireOrgPermission] FAIL - Forbidden. Role ${context.orgRole?.slug} lacks ${flag}/${snakeFlag}`);
    return res.status(403).json({ error: 'FORBIDDEN', flag, role: context.orgRole?.slug });
  }

  req.orgId = orgId;
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
    .select('status,is_provisioned,temp_password_used,role,users!organisation_members_user_id_fkey(*)')
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

module.exports = {
  PERMISSION_FLAGS,
  requireRole,
  requireOrgMember,
  requireOrgPermission,
  enforceOrgCompliance,
  requireOrgCompliance,
};

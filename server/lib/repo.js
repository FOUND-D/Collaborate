const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('./supabase');

const toPublicUser = (u) => u && ({
  _id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  profileImage: u.profile_image || '',
  mobileNumber: u.mobile_number || '',
  bio: u.bio || '',
  designation: u.designation || '',
  customFields: u.custom_fields || {},
  techStack: u.tech_stack || [],
  reputationScore: u.reputation_score || 0,
  createdAt: u.created_at,
  updatedAt: u.updated_at,
});

const toPublicOrganisation = (o) => o && ({
  _id: o.id,
  name: o.name,
  slug: o.slug,
  description: o.description,
  logo: o.logo,
  ownerId: o.owner_id,
  settings: o.settings,
  createdAt: o.created_at,
  updatedAt: o.updated_at,
});

const toPublicOrgRole = (role) => role && ({
  _id: role.id,
  organisationId: role.organisation_id,
  name: role.name,
  slug: role.slug,
  description: role.description,
  isSystemRole: role.is_system_role,
  canManageMembers: role.can_manage_members,
  canManageRoles: role.can_manage_roles,
  canManageSettings: role.can_manage_settings,
  canManageTeams: role.can_manage_teams,
  canInviteMembers: role.can_invite_members,
  canViewReports: role.can_view_reports,
  createdAt: role.created_at,
  updatedAt: role.updated_at,
});

const toPublicOrgMember = (member) => member && ({
  organisationId: member.organisation_id,
  userId: member.user_id,
  orgRoleId: member.org_role_id,
  role: member.role,
  status: member.status,
  isProvisioned: member.is_provisioned,
  tempPasswordUsed: member.temp_password_used,
  invitedBy: member.invited_by,
  joinedAt: member.joined_at,
  user: member.users ? toPublicUser(member.users) : undefined,
  orgRole: member.org_roles ? toPublicOrgRole(member.org_roles) : undefined,
});

const toPublicComplianceRules = (rules) => rules && ({
  _id: rules.id,
  organisationId: rules.organisation_id,
  requireProfilePhoto: rules.require_profile_photo,
  requireMobileNumber: rules.require_mobile_number,
  requireFullName: rules.require_full_name,
  requireBioDesignation: rules.require_bio_designation,
  requiredCustomFieldSlugs: rules.required_custom_field_slugs || [],
  createdAt: rules.created_at,
  updatedAt: rules.updated_at,
});

const toPublicCustomField = (field) => field && ({
  _id: field.id,
  organisationId: field.organisation_id,
  label: field.label,
  slug: field.slug,
  fieldType: field.field_type,
  options: field.options || [],
  isRequired: field.is_required,
  sortOrder: field.sort_order,
  createdAt: field.created_at,
  updatedAt: field.updated_at,
});

const toPublicAuditLog = (entry) => entry && ({
  _id: entry.id,
  organisationId: entry.organisation_id,
  actorId: entry.actor_id,
  action: entry.action,
  targetUserId: entry.target_user_id,
  metadata: entry.metadata || {},
  createdAt: entry.created_at,
});

const getUserById = async (id) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toPublicUser(data) : null;
};

const getUserByEmail = async (email) => {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  if (error) throw error;
  return data ? toPublicUser(data) : null;
};

const createUser = async ({ name, email, password, role, techStack, profileImage }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase.from('users').insert({
    name, email, password_hash: passwordHash, role: role || 'Developer',
    tech_stack: techStack || [], profile_image: profileImage || '', mobile_number: '', bio: '', designation: '', custom_fields: {},
  }).select('*').single();
  if (error) throw error;
  return toPublicUser(data);
};

const verifyUserPassword = async (email, password) => {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  if (error || !data) return null;
  const ok = await bcrypt.compare(password, data.password_hash);
  return ok ? toPublicUser(data) : null;
};

const updateUser = async (id, patch) => {
  const updates = {};
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.email !== undefined) updates.email = patch.email;
  if (patch.role !== undefined) updates.role = patch.role;
  if (patch.profileImage !== undefined) updates.profile_image = patch.profileImage;
  if (patch.mobileNumber !== undefined) updates.mobile_number = patch.mobileNumber;
  if (patch.bio !== undefined) updates.bio = patch.bio;
  if (patch.designation !== undefined) updates.designation = patch.designation;
  if (patch.customFields !== undefined) updates.custom_fields = patch.customFields;
  if (patch.techStack !== undefined) updates.tech_stack = patch.techStack;
  if (patch.password !== undefined) updates.password_hash = await bcrypt.hash(patch.password, 10);
  const { data, error } = await supabase.from('users').update(updates).eq('id', id).select('*').single();
  if (error) throw error;
  return toPublicUser(data);
};

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const uniqueSlug = async (name, excludeId) => {
  const base = slugify(name);
  let slug = base;
  let i = 2;
  while (true) {
    let q = supabase.from('organisations').select('id').eq('slug', slug);
    if (excludeId) q = q.neq('id', excludeId);
    const { data, error } = await q.limit(1);
    if (error) throw error;
    if (!data.length) return slug;
    slug = `${base}-${i++}`;
  }
};

module.exports = {
  supabase,
  crypto,
  toPublicUser,
  toPublicOrganisation,
  toPublicOrgRole,
  toPublicOrgMember,
  toPublicComplianceRules,
  toPublicCustomField,
  toPublicAuditLog,
  getUserById,
  getUserByEmail,
  createUser,
  verifyUserPassword,
  updateUser,
  uniqueSlug,
};

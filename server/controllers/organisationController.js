const asyncHandler = require('../middleware/asyncHandler');
const { supabase, crypto, uniqueSlug, toPublicOrganisation, toPublicOrgMember } = require('../lib/repo');

const createOrganisation = asyncHandler(async (req, res) => {
  const { name, description = '', logo = '' } = req.body;
  console.log(`[createOrganisation] Payload: name=${name}, owner_id=${req.user._id}`);
  
  const slug = await uniqueSlug(name);
  console.log(`[createOrganisation] Generated unique slug: ${slug}`);

  const { data, error } = await supabase.from('organisations').insert({ name, slug, description, logo, owner_id: req.user._id }).select('*').single();
  if (error) {
    console.error(`[createOrganisation] Org insertion failed:`, error);
    throw error;
  }
  
  console.log(`[createOrganisation] Created Org ID: ${data.id}`);

  const systemRoles = [
    { org_id: data.id, name: 'Owner', slug: 'owner', is_system_role: true, can_manage_members: true, can_manage_roles: true, can_manage_settings: true, can_manage_teams: true, can_invite_members: true, can_view_reports: true, created_by: req.user._id },
    { org_id: data.id, name: 'Admin', slug: 'admin', is_system_role: true, can_manage_members: true, can_manage_roles: false, can_manage_settings: true, can_manage_teams: true, can_invite_members: true, can_view_reports: true, created_by: req.user._id },
    { org_id: data.id, name: 'Member', slug: 'member', is_system_role: true, can_manage_members: false, can_manage_roles: false, can_manage_settings: false, can_manage_teams: false, can_invite_members: false, can_view_reports: false, created_by: req.user._id },
  ];

  console.log(`[createOrganisation] Inserting system roles...`);
  const { data: roles, error: rolesError } = await supabase.from('org_roles').insert(systemRoles).select('*');
  if (rolesError) {
    console.error(`[createOrganisation] Roles seeding failed:`, rolesError);
    throw rolesError;
  }
  
  console.log(`[createOrganisation] Roles seeded. Seeding owner member entry...`);
  const ownerRole = roles?.find((r) => r.slug === 'owner');
  if (ownerRole) {
    const { error: memberError } = await supabase.from('organisation_members').insert({
      organisation_id: data.id,
      user_id: req.user._id,
      org_role_id: ownerRole.id,
      role: 'owner',
      status: 'active',
      is_provisioned: false,
      temp_password_plain: null,
      temp_password_used: true,
      invited_by: null,
    });
    if (memberError) {
      console.error(`[createOrganisation] Member seeding failed:`, memberError);
      throw memberError;
    }
  }
  
  console.log(`[createOrganisation] Seeding compliance rules...`);
  const { error: complianceError } = await supabase.from('org_compliance_rules').insert({ org_id: data.id, require_profile_photo: false, require_mobile_number: false, require_full_name: false, require_bio_designation: false, required_custom_field_slugs: [] });
  if (complianceError) {
    console.error(`[createOrganisation] Compliance seeding failed:`, complianceError);
    throw complianceError;
  }
  
  console.log(`[createOrganisation] Success.`);
  res.status(201).json(toPublicOrganisation(data));
});

const getMyOrganisations = asyncHandler(async (req, res) => {
  // Select organisations where the user is a member, including their role.
  const { data, error } = await supabase
    .from('organisations')
    .select('id,name,slug,description,logo,owner_id,created_at,organisation_members!inner(role,user_id,org_role_id)')
    .eq('organisation_members.user_id', req.user._id);
    
  if (error) throw error;
  
  const orgs = (data || []).map(o => {
    const publicOrg = toPublicOrganisation(o);
    const memberRole = o.organisation_members?.[0]?.role || 'member';
    return {
      ...publicOrg,
      role: memberRole
    };
  });
  
  res.json(orgs);
});

const getOrganisationById = asyncHandler(async (req, res) => {
  const { data } = await supabase.from('organisations').select('*').eq('id', req.params.id).maybeSingle();
  if (!data) return res.status(404).json({ message: 'Organisation not found' });
  const { data: memberRow } = await supabase
    .from('organisation_members')
    .select('role, org_role_id, org_roles(slug,can_manage_members,can_manage_roles,can_manage_settings,can_manage_teams,can_invite_members,can_view_reports)')
    .eq('organisation_id', req.params.id)
    .eq('user_id', req.user._id)
    .maybeSingle();
  const memberRole = memberRow?.org_roles?.slug || memberRow?.role || null;
  const permissions = memberRow?.org_roles ? {
    canManageMembers: Boolean(memberRow.org_roles.can_manage_members),
    canManageRoles: Boolean(memberRow.org_roles.can_manage_roles),
    canManageSettings: Boolean(memberRow.org_roles.can_manage_settings),
    canManageTeams: Boolean(memberRow.org_roles.can_manage_teams),
    canInviteMembers: Boolean(memberRow.org_roles.can_invite_members),
    canViewReports: Boolean(memberRow.org_roles.can_view_reports),
  } : null;
  res.json({ ...toPublicOrganisation(data), currentUserRole: memberRole, permissions });
});

const updateOrganisation = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('organisations').update(req.body).eq('id', req.params.id).select('*').single();
  if (error) throw error;
  res.json(toPublicOrganisation(data));
});

const deleteOrganisation = asyncHandler(async (req, res) => {
  await supabase.from('organisations').delete().eq('id', req.params.id);
  res.json({ message: 'Organisation deleted' });
});

const inviteMemberToOrg = asyncHandler(async (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  await supabase.from('organisation_pending_invites').insert({ organisation_id: req.params.id, email: req.body.email, token, role: req.body.role || 'member', invited_by: req.user._id });
  res.json({ message: 'Invite sent' });
});

const acceptOrgInvite = asyncHandler(async (req, res) => {
  res.json({ message: 'Invite acceptance should be handled with the SQL schema and auth flow.' });
});

const removeMemberFromOrg = asyncHandler(async (req, res) => {
  await supabase.from('organisation_members').delete().eq('organisation_id', req.params.id).eq('user_id', req.params.userId);
  res.json({ message: 'Member removed' });
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('organisation_members').update({ role: req.body.role }).eq('organisation_id', req.params.id).eq('user_id', req.params.userId).select('*').single();
  if (error) throw error;
  res.json(data);
});

const getOrgMembers = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('organisation_members').select('*, users(*), org_roles(*)').eq('organisation_id', req.params.id);
  if (error) throw error;
  res.json({ members: (data || []).map(toPublicOrgMember) });
});

const getOrgTeams = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('teams').select('*').eq('organisation_id', req.params.id);
  if (error) throw error;
  res.json(data || []);
});

module.exports = { createOrganisation, getMyOrganisations, getOrganisationById, updateOrganisation, deleteOrganisation, inviteMemberToOrg, acceptOrgInvite, removeMemberFromOrg, updateMemberRole, getOrgMembers, getOrgTeams };

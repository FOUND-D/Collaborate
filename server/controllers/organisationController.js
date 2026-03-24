const asyncHandler = require('../middleware/asyncHandler');
const { supabase, crypto, uniqueSlug } = require('../lib/repo');

const createOrganisation = asyncHandler(async (req, res) => {
  const { name, description = '', logo = '' } = req.body;
  const slug = await uniqueSlug(name);
  const { data, error } = await supabase.from('organisations').insert({ name, slug, description, logo, owner_id: req.user._id }).select('*').single();
  if (error) throw error;
  await supabase.from('organisation_members').insert({ organisation_id: data.id, user_id: req.user._id, role: 'owner' });
  res.status(201).json(data);
});

const getMyOrganisations = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('organisations').select('*').eq('organisation_members.user_id', req.user._id);
  if (error) throw error;
  res.json(data || []);
});

const getOrganisationById = asyncHandler(async (req, res) => {
  const { data } = await supabase.from('organisations').select('*').eq('id', req.params.id).maybeSingle();
  if (!data) return res.status(404).json({ message: 'Organisation not found' });
  res.json(data);
});

const updateOrganisation = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('organisations').update(req.body).eq('id', req.params.id).select('*').single();
  if (error) throw error;
  res.json(data);
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
  const { data, error } = await supabase.from('organisation_members').select('user_id,role,joined_at,users(id,name,email,profile_image)').eq('organisation_id', req.params.id);
  if (error) throw error;
  res.json(data || []);
});

const getOrgTeams = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('teams').select('*').eq('organisation_id', req.params.id);
  if (error) throw error;
  res.json(data || []);
});

module.exports = { createOrganisation, getMyOrganisations, getOrganisationById, updateOrganisation, deleteOrganisation, inviteMemberToOrg, acceptOrgInvite, removeMemberFromOrg, updateMemberRole, getOrgMembers, getOrgTeams };

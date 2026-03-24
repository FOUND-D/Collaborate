const asyncHandler = require('../middleware/asyncHandler');
const generateToken = require('../utils/generateToken');
const { supabase, createUser, verifyUserPassword, updateUser, getUserById } = require('../lib/repo');

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, techStack, profileImage } = req.body;
  const existing = await supabase.from('users').select('id').eq('email', email).maybeSingle();
  if (existing.data) return res.status(400).json({ message: 'User already exists' });
  const user = await createUser({ name, email, password, role, techStack, profileImage });
  res.status(201).json({ ...user, token: generateToken(user._id) });
});

const loginUser = asyncHandler(async (req, res) => {
  const user = await verifyUserPassword(req.body.email, req.body.password);
  if (!user) return res.status(401).json({ message: 'Invalid email or password' });
  const { data: orgMembers } = await supabase.from('organisation_members').select('organisation_id,is_provisioned,temp_password_used,status').eq('user_id', user._id);
  if (orgMembers?.length) {
    const updates = orgMembers.filter((m) => m.is_provisioned && !m.temp_password_used).map((m) => supabase.from('organisation_members').update({ temp_password_used: true, temp_password_plain: null, status: 'active' }).eq('organisation_id', m.organisation_id).eq('user_id', user._id));
    if (updates.length) await Promise.all(updates);
  }
  res.json({ ...user, token: generateToken(user._id) });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  try {
    const { data: teams, error: teamsError } = await supabase
      .from('team_members')
      .select('team_id, teams(*)')
      .eq('user_id', req.user._id);
    
    if (teamsError) {
      console.error('Error fetching user teams:', teamsError);
      return res.json({ ...user, teams: [], pendingInvites: [] });
    }

    const { data: pendingInvites, error: invitesError } = await supabase
      .from('organisation_pending_invites')
      .select('id,email,role,token,expires_at,created_at,organisations(id,name,slug,logo)')
      .eq('email', user.email)
      .order('created_at', { ascending: false });

    if (invitesError) {
      console.error('Error fetching pending invites:', invitesError);
    }
    
    res.json({
      ...user,
      teams: (teams || []).map((r) => r.teams).filter(Boolean).map(t => ({ ...t, _id: t.id })),
      pendingInvites: (pendingInvites || []).map((invite) => ({
        _id: invite.id,
        email: invite.email,
        role: invite.role,
        token: invite.token,
        expiresAt: invite.expires_at,
        createdAt: invite.created_at,
        organisation: invite.organisations ? {
          _id: invite.organisations.id,
          name: invite.organisations.name,
          slug: invite.organisations.slug,
          logo: invite.organisations.logo,
        } : null,
      })),
    });
  } catch (err) {
    console.error('Unexpected error in getUserProfile teams fetch:', err);
    res.json({ ...user, teams: [], pendingInvites: [] });
  }
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const updated = await updateUser(req.user._id, req.body);
  res.json({ ...updated, token: generateToken(updated._id) });
});

const getUsers = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('users').select('id,name,email,role,profile_image,tech_stack,reputation_score,created_at,updated_at');
  if (error) throw error;
  res.json((data || []).map((u) => ({ _id: u.id, name: u.name, email: u.email, role: u.role, profileImage: u.profile_image, techStack: u.tech_stack, reputationScore: u.reputation_score })));
});

const updateUserProfileImage = asyncHandler(async (req, res) => {
  const updated = await updateUser(req.user._id, { profileImage: req.body.image || '' });
  res.json({ ...updated, token: generateToken(updated._id) });
});

const searchUsers = asyncHandler(async (req, res) => {
  const q = req.query.search || '';
  const { data, error } = await supabase.from('users').select('id,name,email,role,profile_image,tech_stack').neq('id', req.user._id).or(`name.ilike.%${q}%,email.ilike.%${q}%`);
  if (error) throw error;
  res.json((data || []).map((u) => ({ _id: u.id, name: u.name, email: u.email, role: u.role, profileImage: u.profile_image, techStack: u.tech_stack })));
});

module.exports = { registerUser, loginUser, searchUsers, getUsers, getUserProfile, updateUserProfile, updateUserProfileImage };

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
  res.json({ ...user, token: generateToken(user._id) });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { data: teams } = await supabase.from('team_members').select('team_id, teams(*)').eq('user_id', req.user._id);
  res.json({ ...user, teams: (teams || []).map((r) => r.teams).filter(Boolean) });
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

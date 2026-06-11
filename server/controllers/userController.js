const axios = require('axios');
const asyncHandler = require('../middleware/asyncHandler');
const generateToken = require('../utils/generateToken');
const { supabase, createUser, verifyUserPassword, updateUser, getUserById } = require('../lib/repo');

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, yearOfStudy, studentId, techStack, profileImage } = req.body;
  const existing = await supabase.from('users').select('id').eq('email', email).maybeSingle();
  if (existing.data) return res.status(400).json({ message: 'User already exists' });
  const user = await createUser({ name, email, password, role, department, yearOfStudy, studentId, techStack, profileImage });
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
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Not authorized, user data missing' });
  }

  const user = req.user;
  console.log(`[getUserProfile] Fetching profile for user: ${user._id} (${user.email})`);

  try {
    const { data: teams, error: teamsError } = await supabase
      .from('team_members')
      .select('team_id, teams:teams(*)')
      .eq('user_id', user._id);

    if (teamsError) {
      console.error('[getUserProfile] Error fetching user teams:', teamsError);
    } else {
      console.log(`[getUserProfile] Found ${teams?.length || 0} teams`);
    }

    const { data: pendingInvites, error: invitesError } = await supabase
      .from('organisation_pending_invites')
      .select('id,email,role,token,expires_at,created_at,organisation:organisations(id,name,slug,logo)')
      .eq('email', user.email)
      .order('created_at', { ascending: false });

    if (invitesError) {
      console.error('[getUserProfile] Error fetching pending invites:', invitesError);
    } else {
      console.log(`[getUserProfile] Found ${pendingInvites?.length || 0} pending invites`);
    }

    const responseData = {
      ...user,
      teams: (teams || []).map((r) => {
        const teamObj = Array.isArray(r.teams) ? r.teams[0] : r.teams;
        return teamObj ? { ...teamObj, _id: teamObj.id } : null;
      }).filter(Boolean),
      pendingInvites: (pendingInvites || []).map((invite) => ({
        _id: invite.id,
        email: invite.email,
        role: invite.role,
        token: invite.token,
        expiresAt: invite.expires_at,
        createdAt: invite.created_at,
        organisation: invite.organisation ? {
          _id: (Array.isArray(invite.organisation) ? invite.organisation[0]?.id : invite.organisation.id),
          name: (Array.isArray(invite.organisation) ? invite.organisation[0]?.name : invite.organisation.name),
          slug: (Array.isArray(invite.organisation) ? invite.organisation[0]?.slug : invite.organisation.slug),
          logo: (Array.isArray(invite.organisation) ? invite.organisation[0]?.logo : invite.organisation.logo),
        } : null,
      })),
    };

    console.log('[getUserProfile] Sending successful response');
    res.json(responseData);
  } catch (err) {
    console.error('[getUserProfile] Unexpected error:', err);
    res.status(500).json({ message: 'Internal Server Error', details: err.message, stack: err.stack });
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

// @desc    Get public profile by ID
// @route   GET /api/users/:id
// @access  Private
const getUserPublicProfile = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Filter out private fields for other users
  const isOwnProfile = req.user._id === user._id;
  
  const publicProfile = {
    _id: user._id,
    name: user.name,
    role: user.role,
    department: user.department,
    yearOfStudy: user.yearOfStudy,
    profileImage: user.profileImage,
    avgRating: user.avgRating,
    githubUsername: user.githubUsername,
    githubShowPrivate: user.githubShowPrivate,
    linkedinUrl: user.linkedinUrl,
    leetcodeUsername: user.leetcodeUsername,
    portfolioUrl: user.portfolioUrl,
    showcasedProjectIds: user.showcasedProjectIds,
    bio: user.bio,
    createdAt: user.createdAt,
  };

  if (isOwnProfile) {
    publicProfile.email = user.email;
    publicProfile.studentId = user.studentId;
    publicProfile.credits = user.credits;
  }

  res.json(publicProfile);
});

// @desc    Get user stats for dashboard
// @route   GET /api/users/me/stats
// @access  Private
const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Sessions taught
  const { count: sessionsTaught } = await supabase
    .from('booking_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', userId)
    .eq('status', 'completed');

  // 2. Sessions attended
  const { count: sessionsAttended } = await supabase
    .from('booking_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('learner_id', userId)
    .eq('status', 'completed');

  // 3. User details (credits, avgRating)
  const { data: userDetails } = await supabase
    .from('users')
    .select('credits, avg_rating')
    .eq('id', userId)
    .maybeSingle();

  // 4. Skill count
  const { count: skillCount } = await supabase
    .from('user_skills')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // 5. Badges count
  const { count: badgesCount } = await supabase
    .from('badges')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // 6. Resources uploaded
  const { count: resourcesUploaded } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .eq('uploader_id', userId);

  // 7. Sessions this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: sessionsThisMonth } = await supabase
    .from('booking_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`)
    .gte('scheduled_at', startOfMonth.toISOString());

  res.json({
    sessionsTaught: sessionsTaught || 0,
    sessionsAttended: sessionsAttended || 0,
    creditsBalance: userDetails?.credits ?? 0,
    avgRating: userDetails?.avg_rating ?? null,
    skillCount: skillCount || 0,
    badgesCount: badgesCount || 0,
    resourcesUploaded: resourcesUploaded || 0,
    sessionsThisMonth: sessionsThisMonth || 0,
  });
});

// --- ADMIN ENDPOINTS ---

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
const adminGetUsers = asyncHandler(async (req, res) => {
  const { search, role } = req.query;
  let query = supabase.from('users').select('*').order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (role) {
    query = query.eq('role', role);
  }

  const { data, error } = await query;
  if (error) throw error;

  res.json((data || []).map(u => ({
    _id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    credits: u.credits,
    avgRating: u.avg_rating,
    createdAt: u.created_at,
  })));
});

// @desc    Update user role (Admin only)
// @route   PATCH /api/admin/users/:id/role
// @access  Private/Admin
const adminUpdateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', req.params.id)
    .select('*')
    .single();

  if (error) throw error;
  res.json({
    _id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
  });
});

// @desc    Get platform stats (Admin only)
// @route   GET /api/admin/stats
// @access  Private/Admin
const adminGetStats = asyncHandler(async (req, res) => {
  const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const { count: activeListings } = await supabase.from('exchange_listings').select('*', { count: 'exact', head: true }).eq('status', 'active');
  const { count: totalResources } = await supabase.from('resources').select('*', { count: 'exact', head: true });

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const { count: sessionsThisWeek } = await supabase.from('booking_sessions').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString());

  // Top skills (harder to do with just Supabase without complex grouping, let's do a simple one)
  const { data: topSkills } = await supabase.rpc('get_top_skills'); // Assuming we add this RPC or just return empty for now

  res.json({
    total_users: totalUsers || 0,
    active_listings: activeListings || 0,
    sessions_this_week: sessionsThisWeek || 0,
    total_resources: totalResources || 0,
    top_skills: topSkills || [],
  });
});

// @desc    Proxy GitHub API securely using backend PAT
// @route   GET /api/users/github/:username
// @access  Private
const getGithubStats = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const showPrivate = req.query.showPrivate === 'true';
  
  const headers = {};
  let reposUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`;

  if (showPrivate && process.env.GITHUB_PAT) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_PAT}`;
    // /users/:username/repos only returns public repos even with a PAT.
    // To get private repos, we must use /user/repos which gets all repos for the authenticated PAT.
    reposUrl = `https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator`;
  }

  try {
    const [userRes, reposRes] = await Promise.all([
      axios.get(`https://api.github.com/users/${username}`, { headers }),
      axios.get(reposUrl, { headers })
    ]);
    
    let repos = reposRes.data;
    if (showPrivate && process.env.GITHUB_PAT) {
      // Filter the authenticated user's repos to ensure they belong to the requested username
      repos = repos.filter(repo => repo.owner.login.toLowerCase() === username.toLowerCase());
    }

    res.json({ user: userRes.data, repos });
  } catch (error) {
    console.error('GitHub proxy error:', error.message);
    res.status(500).json({ message: 'Error fetching GitHub data' });
  }
});

module.exports = {
  registerUser,
  loginUser,
  searchUsers,
  getUsers,
  getUserProfile,
  updateUserProfile,
  updateUserProfileImage,
  getUserStats,
  getUserPublicProfile,
  getGithubStats,
  adminGetUsers,
  adminUpdateUserRole,
  adminGetStats,
};

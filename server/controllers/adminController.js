const asyncHandler = require('../middleware/asyncHandler');
const { supabase, toPublicUser, toPublicListing, toPublicSession, toPublicSkill, toPublicMessage } = require('../lib/repo');

// --- OVERVIEW ---

// @desc    Get admin platform stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = asyncHandler(async (req, res) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [
    { count: totalUsers },
    { count: totalStudents },
    { count: totalFaculty },
    { count: activeListings },
    { count: sessionsThisWeek },
    { count: totalResources },
    { count: totalSkills },
    { data: recentSignups }
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'faculty'),
    supabase.from('exchange_listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('booking_sessions').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString()),
    supabase.from('resources').select('*', { count: 'exact', head: true }),
    supabase.from('skills').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('id, name, email, role, created_at').order('created_at', { ascending: false }).limit(5)
  ]);

  res.json({
    totalUsers: totalUsers || 0,
    totalStudents: totalStudents || 0,
    totalFaculty: totalFaculty || 0,
    activeListings: activeListings || 0,
    sessionsThisWeek: sessionsThisWeek || 0,
    totalResources: totalResources || 0,
    totalSkills: totalSkills || 0,
    recentSignups: (recentSignups || []).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      created_at: u.created_at
    }))
  });
});

// @desc    Get top skills by usage
// @route   GET /api/admin/top-skills
// @access  Private/Admin
const getTopSkills = asyncHandler(async (req, res) => {
  // Supabase doesn't support complex GROUP BY in its client directly for counts on joins
  // We use a raw query via a stored procedure/RPC or we can aggregate manually for small-ish datasets
  // The prompt provides the SQL, so we'll assume an RPC named 'get_admin_top_skills' exists or we use a clever join
  
  const { data, error } = await supabase.rpc('get_admin_top_skills_v2');
  
  if (error) {
    // Fallback: manually aggregate if RPC fails (though in prod we'd want the RPC)
    const { data: skills } = await supabase.from('skills').select('id, name, category');
    const { data: userSkills } = await supabase.from('user_skills').select('skill_id');
    
    const counts = (userSkills || []).reduce((acc, curr) => {
      acc[curr.skill_id] = (acc[curr.skill_id] || 0) + 1;
      return acc;
    }, {});

    const result = (skills || [])
      .map(s => ({
        name: s.name,
        category: s.category,
        usage_count: counts[s.id] || 0
      }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);
      
    return res.json(result);
  }

  res.json(data);
});

// --- USERS ---

// @desc    Get all users with filtering
// @route   GET /api/admin/users
// @access  Private/Admin
const getAdminUsers = asyncHandler(async (req, res) => {
  const { search, role } = req.query;
  let query = supabase.from('users').select('*').order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (role && role !== 'all') {
    query = query.eq('role', role);
  }

  const { data, error } = await query;
  if (error) throw error;

  res.json({
    users: (data || []).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      credits: u.credits,
      avg_rating: u.avg_rating,
      created_at: u.created_at,
      student_id: u.student_id,
      suspended: u.suspended || false
    }))
  });
});

// @desc    Update user role
// @route   PATCH /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const validRoles = ['student', 'undergrad', 'postgrad', 'faculty', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', req.params.id)
    .select('*')
    .single();

  if (error) throw error;
  res.json(toPublicUser(data));
});

// @desc    Update user credits
// @route   PATCH /api/admin/users/:id/credits
// @access  Private/Admin
const updateUserCredits = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  const userId = req.params.id;

  const { data: user, error: fetchError } = await supabase.from('users').select('credits').eq('id', userId).single();
  if (fetchError) throw fetchError;

  const newBalance = (user.credits || 0) + Number(amount);

  const { error: updateError } = await supabase
    .from('users')
    .update({ credits: newBalance })
    .eq('id', userId);

  if (updateError) throw updateError;

  // Optional: Insert into credit_transactions if table exists
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: Number(amount),
    reason: reason || 'Admin adjustment',
    type: amount > 0 ? 'grant' : 'deduction'
  }).select().maybeSingle();

  res.json({ newBalance });
});

// @desc    Toggle user suspension
// @route   PATCH /api/admin/users/:id/suspend
// @access  Private/Admin
const toggleUserSuspension = asyncHandler(async (req, res) => {
  const { data: user, error: fetchError } = await supabase.from('users').select('suspended').eq('id', req.params.id).single();
  if (fetchError) throw fetchError;

  const newState = !user.suspended;

  const { data, error } = await supabase
    .from('users')
    .update({ suspended: newState })
    .eq('id', req.params.id)
    .select('suspended')
    .single();

  if (error) throw error;
  res.json({ suspended: data.suspended });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const { error } = await supabase.from('users').delete().eq('id', req.params.id);
  if (error) throw error;
  res.json({ message: 'User deleted' });
});

// --- FACULTY WHITELIST ---

// @desc    Get faculty whitelist
// @route   GET /api/admin/faculty-whitelist
// @access  Private/Admin
const getFacultyWhitelist = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('faculty_whitelist')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  res.json(data);
});

// @desc    Add to faculty whitelist
// @route   POST /api/admin/faculty-whitelist
// @access  Private/Admin
const addFacultyToWhitelist = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existing } = await supabase.from('faculty_whitelist').select('id').eq('email', normalizedEmail).maybeSingle();
  if (existing) return res.status(409).json({ message: 'This email is already whitelisted' });

  const { data, error } = await supabase
    .from('faculty_whitelist')
    .insert({ name, email: normalizedEmail, added_by: req.user._id })
    .select('*')
    .single();

  if (error) throw error;
  res.status(201).json(data);
});

// @desc    Delete from faculty whitelist
// @route   DELETE /api/admin/faculty-whitelist/:id
// @access  Private/Admin
const deleteFacultyFromWhitelist = asyncHandler(async (req, res) => {
  const { error } = await supabase.from('faculty_whitelist').delete().eq('id', req.params.id);
  if (error) throw error;
  res.json({ message: 'Removed from whitelist' });
});

// --- SKILLS ---

// @desc    Get all skills with usage count
// @route   GET /api/admin/skills
// @access  Private/Admin
const getAdminSkills = asyncHandler(async (req, res) => {
  // Fetch skills with added_by user info
  const { data: skills, error } = await supabase
    .from('skills')
    .select('*, added_by_user:users!added_by(id, name, email)')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch all user_skills to calculate usage_count
  const { data: userSkills } = await supabase.from('user_skills').select('skill_id');
  const counts = (userSkills || []).reduce((acc, curr) => {
    acc[curr.skill_id] = (acc[curr.skill_id] || 0) + 1;
    return acc;
  }, {});

  const result = (skills || []).map(s => ({
    id: s.id,
    name: s.name,
    category: s.category,
    added_by: s.added_by,
    added_by_name: s.added_by_user?.name,
    added_by_email: s.added_by_user?.email,
    usage_count: counts[s.id] || 0,
    created_at: s.created_at
  }));

  res.json(result);
});

// @desc    Delete skill
// @route   DELETE /api/admin/skills/:id
// @access  Private/Admin
const deleteSkill = asyncHandler(async (req, res) => {
  const { error } = await supabase.from('skills').delete().eq('id', req.params.id);
  if (error) throw error;
  res.json({ message: 'Skill deleted' });
});

// @desc    Update skill
// @route   PATCH /api/admin/skills/:id
// @access  Private/Admin
const updateSkill = asyncHandler(async (req, res) => {
  const { name, category } = req.body;
  const { data, error } = await supabase
    .from('skills')
    .update({ name, category })
    .eq('id', req.params.id)
    .select('*')
    .single();

  if (error) throw error;
  res.json(toPublicSkill(data));
});

// --- LISTINGS ---

// @desc    Get all listings
// @route   GET /api/admin/listings
// @access  Private/Admin
const getAdminListings = asyncHandler(async (req, res) => {
  const { status, page = 1 } = req.query;
  const limit = 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from('exchange_listings').select('*, users!user_id(name, email), skills!skill_id(name)', { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);
  if (error) throw error;

  res.json({
    listings: (data || []).map(l => ({
      ...toPublicListing(l),
      user: l.users,
      skillName: l.skills?.name
    })),
    total: count
  });
});

// @desc    Update listing status
// @route   PATCH /api/admin/listings/:id/status
// @access  Private/Admin
const updateListingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { data, error } = await supabase
    .from('exchange_listings')
    .update({ status })
    .eq('id', req.params.id)
    .select('*, users!user_id(name, email), skills!skill_id(name)')
    .single();

  if (error) throw error;
  res.json(toPublicListing(data));
});

// @desc    Delete listing
// @route   DELETE /api/admin/listings/:id
// @access  Private/Admin
const deleteListing = asyncHandler(async (req, res) => {
  const { error } = await supabase.from('exchange_listings').delete().eq('id', req.params.id);
  if (error) throw error;
  res.json({ message: 'Listing removed' });
});

// --- SESSIONS ---

// @desc    Get all sessions
// @route   GET /api/admin/sessions
// @access  Private/Admin
const getAdminSessions = asyncHandler(async (req, res) => {
  const { status, page = 1 } = req.query;
  const limit = 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from('booking_sessions').select('*, teacher:users!teacher_id(name), learner:users!learner_id(name), skills!skill_id(name)', { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, count, error } = await query.order('scheduled_at', { ascending: false }).range(from, to);
  if (error) throw error;

  res.json({
    sessions: (data || []).map(s => ({
      ...toPublicSession(s),
      teacherName: s.teacher?.name,
      learnerName: s.learner?.name,
      skillName: s.skills?.name
    })),
    total: count
  });
});

// --- ANNOUNCEMENTS ---

// @desc    Get all announcements
// @route   GET /api/admin/announcements
// @access  Private/Admin
const getAdminAnnouncements = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('announcements')
    .select('*, users!author_id(name)')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Manual RSVP count if not in join
  const { data: rsvps } = await supabase.from('announcement_rsvps').select('announcement_id');
  const rsvpCounts = (rsvps || []).reduce((acc, curr) => {
    acc[curr.announcement_id] = (acc[curr.announcement_id] || 0) + 1;
    return acc;
  }, {});

  res.json((data || []).map(a => ({
    ...a,
    _id: a.id,
    authorName: a.users?.name,
    rsvpCount: rsvpCounts[a.id] || 0
  })));
});

// @desc    Delete announcement
// @route   DELETE /api/admin/announcements/:id
// @access  Private/Admin
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const { error } = await supabase.from('announcements').delete().eq('id', req.params.id);
  if (error) throw error;
  res.json({ message: 'Announcement deleted' });
});

// --- CREDITS CONFIG ---

// @desc    Get credit config
// @route   GET /api/admin/credit-config
// @access  Private/Admin
const getCreditConfig = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('platform_config')
    .select('value')
    .eq('key', 'starting_credits')
    .maybeSingle();

  // If the table doesn't exist yet (42P01) or row not found (PGRST116), just return default
  if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
    throw error;
  }
  res.json({ startingCredits: data?.value || 50 });
});

// @desc    Update credit config
// @route   PATCH /api/admin/credit-config
// @access  Private/Admin
const updateCreditConfig = asyncHandler(async (req, res) => {
  const { startingCredits } = req.body;
  
  const { data, error } = await supabase
    .from('platform_config')
    .upsert({ key: 'starting_credits', value: startingCredits, updated_at: new Date().toISOString() })
    .select('*')
    .single();

  if (error) throw error;
  res.json({ startingCredits: data.value });
});

module.exports = {
  getAdminStats,
  getTopSkills,
  getAdminUsers,
  updateUserRole,
  updateUserCredits,
  toggleUserSuspension,
  deleteUser,
  getFacultyWhitelist,
  addFacultyToWhitelist,
  deleteFacultyFromWhitelist,
  getAdminSkills,
  deleteSkill,
  updateSkill,
  getAdminListings,
  updateListingStatus,
  deleteListing,
  getAdminSessions,
  getAdminAnnouncements,
  deleteAnnouncement,
  getCreditConfig,
  updateCreditConfig
};

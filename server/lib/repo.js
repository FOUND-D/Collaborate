const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('./supabase');

const SESSION_REQUEST_PREFIX = 'SESSION_REQUEST:';

const formatAvgRating = (val) => {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
};

const unique = (arr) => [...new Set(arr)];

const toPublicCompactUser = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || '',
    avgRating: formatAvgRating(user.avg_rating),
    avg_rating: formatAvgRating(user.avg_rating),
    profileImage: user.profile_image || '',
    credits: user.credits ?? 0,
  };
};

const toPublicUser = (u) => {
  if (!u) return null;
  console.log(`[toPublicUser] Mapping user: ${u.id}`);
  return {
    id: u.id,
    _id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department || '',
    yearOfStudy: u.year_of_study ?? null,
    year_of_study: u.year_of_study ?? null,
    studentId: u.student_id || '',
    student_id: u.student_id || '',
    techStack: u.tech_stack || [],
    tech_stack: u.tech_stack || [],
    reputationScore: u.reputation_score ?? 0,
    reputation_score: u.reputation_score ?? 0,
    profileImage: u.profile_image || '',
    profile_image: u.profile_image || '',
    credits: u.credits ?? 50,
    avgRating: formatAvgRating(u.avg_rating),
    avg_rating: formatAvgRating(u.avg_rating),
    phone: u.phone || '',
    location: u.location || '',
    timezone: u.timezone || 'UTC',
    language: u.language || 'English',
    dateFormat: u.date_format || 'MM/DD/YYYY',
    university: u.university || '',
    githubUsername: u.github_username || '',
    githubShowPrivate: u.github_show_private || false,
    linkedinUrl: u.linkedin_url || '',
    leetcodeUsername: u.leetcode_username || '',
    portfolioUrl: u.portfolio_url || '',
    showcasedProjectIds: u.showcased_project_ids || [],
    bio: u.bio || '',
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  };
};

const toPublicOrganisation = (o) => {
  if (!o) return null;
  console.log(`[toPublicOrganisation] Mapping org: ${o.id}`);
  return {
    id: o.id,
    _id: o.id,
    name: o.name,
    slug: o.slug,
    description: o.description,
    logo: o.logo,
    ownerId: o.owner_id,
    settings: o.settings,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  };
};

const toPublicOrgRole = (role) => {
  if (!role) return null;
  console.log(`[toPublicOrgRole] Mapping role: ${role.id} (org: ${role.org_id})`);
  return {
    id: role.id,
    _id: role.id,
    organisationId: role.org_id,
    name: role.name,
    slug: role.slug,
    description: role.description,
    isSystemRole: role.is_system_role,
    canManageMembers: role.can_manage_members,
    canManageRoles: role.can_manage_roles,
    canManageSettings: role.can_manage_settings,
    canManageTeams: role.can_manage_teams,
    canManageTasks: role.can_manage_tasks,
    canManageProjects: role.can_manage_projects,
    canModerateExchange: role.can_moderate_exchange,
    createdAt: role.created_at,
    updatedAt: role.updated_at,
  };
};

const toPublicOrgMember = (member) => {
  if (!member) return null;
  console.log(`[toPublicOrgMember] Mapping member: user=${member.user_id} org=${member.organisation_id}`);
  return {
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
  };
};

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

const toPublicMeeting = (meeting) => {
  if (!meeting) return null;
  return {
    _id: meeting.id,
    team: meeting.team_id,
    roomId: meeting.room_id,
    status: meeting.status,
    startedBy: meeting.started_by,
    agenda: meeting.agenda || '',
    createdAt: meeting.created_at,
    updatedAt: meeting.updated_at,
  };
};

const toPublicSkill = (skill) => skill && ({
  id: skill.id,
  name: skill.name,
  category: skill.category || '',
  createdAt: skill.created_at,
});

const toPublicUserSkill = (userSkill) => userSkill && ({
  userId: userSkill.user_id,
  skillId: userSkill.skill_id,
  type: userSkill.type,
  level: userSkill.level || null,
  endorsedBy: userSkill.endorsed_by || null,
  endorsedAt: userSkill.endorsed_at || null,
  skill: userSkill.skill ? toPublicSkill(userSkill.skill) : undefined,
  endorsedByUser: userSkill.endorsedByUser ? toPublicCompactUser(userSkill.endorsedByUser) : undefined,
});

const toPublicListing = (listing) => listing && ({
  _id: listing.id,
  userId: listing.user_id,
  skillId: listing.skill_id,
  listingType: listing.listing_type,
  listing_type: listing.listing_type,
  level: listing.level || null,
  creditRate: listing.credit_rate ?? 0,
  credit_rate: listing.credit_rate ?? 0,
  format: listing.format || null,
  maxGroupSize: listing.max_group_size ?? null,
  max_group_size: listing.max_group_size ?? null,
  description: listing.description || '',
  status: listing.status,
  createdAt: listing.created_at,
  updatedAt: listing.updated_at,
  user: listing.user ? toPublicCompactUser(listing.user) : undefined,
  skill: listing.skill ? toPublicSkill(listing.skill) : undefined,
});

const toPublicSession = (session) => session && ({
  _id: session.id,
  id: session.id,
  listingId: session.listing_id || null,
  listing_id: session.listing_id || null,
  teacherId: session.teacher_id,
  teacher_id: session.teacher_id,
  learnerId: session.learner_id || null,
  learner_id: session.learner_id || null,
  scheduledAt: session.scheduled_at,
  scheduled_at: session.scheduled_at,
  durationMin: session.duration_min,
  duration_min: session.duration_min,
  agenda: session.agenda || '',
  status: session.status,
  meetingId: session.meeting_id || null,
  meeting_id: session.meeting_id || null,
  createdAt: session.created_at,
  updatedAt: session.updated_at,
  listing: session.listing ? toPublicListing(session.listing) : undefined,
  teacher: session.teacher ? toPublicCompactUser(session.teacher) : undefined,
  learner: session.learner ? toPublicCompactUser(session.learner) : undefined,
  meeting: session.meeting ? toPublicMeeting(session.meeting) : undefined,
  teamId: session.team_id || null,
  team_id: session.team_id || null,
  team: session.team || undefined,
  skill: session.skill ? toPublicSkill(session.skill) : undefined,
  rated: Boolean(session.rated),
});

const toPublicRating = (rating) => rating && ({
  sessionId: rating.session_id,
  session_id: rating.session_id,
  raterId: rating.rater_id,
  rater_id: rating.rater_id,
  rateeId: rating.ratee_id,
  ratee_id: rating.ratee_id,
  stars: rating.stars ?? null,
  review: rating.review || '',
  isFlagged: Boolean(rating.is_flagged),
  is_flagged: Boolean(rating.is_flagged),
  rater: rating.rater ? toPublicCompactUser(rating.rater) : undefined,
  ratee: rating.ratee ? toPublicCompactUser(rating.ratee) : undefined,
  session: rating.session ? toPublicSession(rating.session) : undefined,
});

const toPublicResource = (resource) => {
  if (!resource) return null;
  return {
    id: resource.id,
    _id: resource.id,
    title: resource.title,
    description: resource.description,
    fileUrl: resource.file_url,
    fileType: resource.file_type,
    tags: resource.tags || [],
    aiSummary: resource.ai_summary,
    viewCount: resource.view_count || 0,
    downloadCount: resource.download_count || 0,
    isPinned: resource.is_pinned || false,
    uploaderId: resource.uploader_id,
    uploaderName: resource.users?.name || (resource.uploader ? resource.uploader.name : undefined),
    uploader: resource.users ? toPublicCompactUser(resource.users) : (resource.uploader ? toPublicCompactUser(resource.uploader) : undefined),
    teamId: resource.team_id,
    createdAt: resource.created_at,
  };
};

const decodeMessageContent = (rawContent) => {
  if (typeof rawContent !== 'string' || !rawContent.startsWith(SESSION_REQUEST_PREFIX)) {
    return { type: 'text', content: rawContent || '', sessionRequest: null };
  }

  try {
    const decoded = JSON.parse(rawContent.slice(SESSION_REQUEST_PREFIX.length));
    return {
      type: 'session_request',
      content: decoded.message || 'I would like to book a session.',
      sessionRequest: {
        listingId: decoded.listingId,
        scheduledAt: decoded.scheduledAt,
        durationMin: decoded.durationMin,
        agenda: decoded.agenda,
      }
    };
  } catch (err) {
    return { type: 'text', content: rawContent, sessionRequest: null };
  }
};

const toPublicMessage = (message) => {
  if (!message) return null;
  const parsed = decodeMessageContent(message.content);
  return {
    _id: message.id,
    content: parsed.content,
    type: parsed.type,
    sessionRequest: parsed.sessionRequest,
    sender: message.sender ? toPublicCompactUser(message.sender) : toPublicCompactUser(message.users),
    senderId: message.sender_id,
    sender_id: message.sender_id,
    team: message.team_id || null,
    teamId: message.team_id || null,
    team_id: message.team_id || null,
    conversationId: message.conversation_id || null,
    conversation_id: message.conversation_id || null,
    createdAt: message.created_at,
    updatedAt: message.updated_at,
  };
};

const normalizeEmail = (email) => email ? email.trim().toLowerCase() : '';

const slugify = (value) => {
  if (!value) return '';
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const getUserById = async (id) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toPublicUser(data) : null;
};

const getUserByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;
  const { data, error } = await supabase.from('users').select('*').ilike('email', normalizedEmail).limit(10);
  if (error) throw error;
  const user = (data || []).find((row) => normalizeEmail(row.email) === normalizedEmail);
  return user ? toPublicUser(user) : null;
};

const createUser = async ({ name, email, password, role, department, yearOfStudy, studentId, techStack, profileImage }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase.from('users').insert({
    name,
    email: normalizeEmail(email),
    password_hash: passwordHash,
    role: role || 'undergrad',
    department: department || null,
    year_of_study: yearOfStudy || null,
    student_id: studentId || null,
    tech_stack: techStack || [],
    profile_image: profileImage || null,
    credits: 50,
  }).select('*').single();
  if (error) throw error;
  return toPublicUser(data);
};

const verifyUserPassword = async (email, password) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) return null;
  const { data, error } = await supabase.from('users').select('*').ilike('email', normalizedEmail).limit(10);
  if (error) return null;
  const user = (data || []).find((row) => normalizeEmail(row.email) === normalizedEmail);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? toPublicUser(user) : null;
};

const updateUser = async (id, patch) => {
  const updates = {};
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.email !== undefined) updates.email = normalizeEmail(patch.email);
  if (patch.role !== undefined) updates.role = patch.role;
  if (patch.department !== undefined) updates.department = patch.department;
  if (patch.yearOfStudy !== undefined) updates.year_of_study = patch.yearOfStudy;
  if (patch.year_of_study !== undefined) updates.year_of_study = patch.year_of_study;
  if (patch.studentId !== undefined) updates.student_id = patch.studentId;
  if (patch.student_id !== undefined) updates.student_id = patch.student_id;
  if (patch.techStack !== undefined) updates.tech_stack = patch.techStack;
  if (patch.tech_stack !== undefined) updates.tech_stack = patch.tech_stack;
  if (patch.profileImage !== undefined) updates.profile_image = patch.profileImage;
  if (patch.profile_image !== undefined) updates.profile_image = patch.profile_image;
  if (patch.phone !== undefined) updates.phone = patch.phone;
  if (patch.location !== undefined) updates.location = patch.location;
  if (patch.timezone !== undefined) updates.timezone = patch.timezone;
  if (patch.language !== undefined) updates.language = patch.language;
  if (patch.dateFormat !== undefined) updates.date_format = patch.dateFormat;
  if (patch.university !== undefined) updates.university = patch.university;
  if (patch.github_username !== undefined) updates.github_username = patch.github_username;
  if (patch.githubUsername !== undefined) updates.github_username = patch.githubUsername;
  if (patch.githubShowPrivate !== undefined) updates.github_show_private = patch.githubShowPrivate;
  if (patch.linkedin_url !== undefined) updates.linkedin_url = patch.linkedin_url;
  if (patch.linkedinUrl !== undefined) updates.linkedin_url = patch.linkedinUrl;
  if (patch.leetcode_username !== undefined) updates.leetcode_username = patch.leetcode_username;
  if (patch.leetcodeUsername !== undefined) updates.leetcode_username = patch.leetcodeUsername;
  if (patch.portfolio_url !== undefined) updates.portfolio_url = patch.portfolio_url;
  if (patch.portfolioUrl !== undefined) updates.portfolio_url = patch.portfolioUrl;
  if (patch.showcased_project_ids !== undefined) updates.showcased_project_ids = patch.showcased_project_ids;
  if (patch.showcasedProjectIds !== undefined) updates.showcased_project_ids = patch.showcasedProjectIds;
  if (patch.bio !== undefined) updates.bio = patch.bio;
  if (patch.credits !== undefined) updates.credits = patch.credits;
  if (patch.avg_rating !== undefined) updates.avg_rating = patch.avg_rating;
  if (patch.password !== undefined) {
    updates.password_hash = await bcrypt.hash(patch.password, 10);
  }

  const { data, error } = await supabase.from('users').update(updates).eq('id', id).select('*').single();
  if (error) throw error;
  return toPublicUser(data);
};

const listSkills = async () => {
  const { data, error } = await supabase.from('skills').select('*').order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map(toPublicSkill);
};

const getSkillRecordById = async (skillId) => {
  const { data, error } = await supabase.from('skills').select('*').eq('id', skillId).maybeSingle();
  if (error) throw error;
  return data || null;
};

const getSkillRecordByName = async (name) => {
  const { data, error } = await supabase.from('skills').select('*').ilike('name', name).maybeSingle();
  if (error) throw error;
  return data || null;
};

const addUserSkill = async ({ userId, skillId, name, type, level }) => {
  let finalSkillId = skillId;
  if (!finalSkillId && name) {
    const existing = await getSkillRecordByName(name);
    if (existing) {
      finalSkillId = existing.id;
    } else {
      const { data: newSkill, error: insertError } = await supabase.from('skills').insert({ name, category: 'General' }).select().single();
      if (insertError) throw insertError;
      finalSkillId = newSkill.id;
    }
  }

  const { data, error } = await supabase.from('user_skills').upsert({
    user_id: userId,
    skill_id: finalSkillId,
    type,
    level: level || null,
  }, { onConflict: 'user_id,skill_id,type' }).select('*').single();

  if (error) throw error;
  const skill = await getSkillRecordById(finalSkillId);
  return toPublicUserSkill({ ...data, skill });
};

const removeUserSkill = async ({ userId, skillId, type }) => {
  let query = supabase.from('user_skills').delete().eq('user_id', userId).eq('skill_id', skillId);
  if (type) query = query.eq('type', type);
  const { error } = await query;
  if (error) throw error;
  return true;
};

const getUserSkills = async (userId) => {
  const { data, error } = await supabase.from('user_skills').select('*').eq('user_id', userId);
  if (error) throw error;
  if (!data?.length) return [];

  const skillIds = unique(data.map((r) => r.skill_id));
  const endorserIds = unique(data.map((r) => r.endorsed_by).filter(Boolean));

  const [skills, endorsers] = await Promise.all([
    supabase.from('skills').select('*').in('id', skillIds),
    supabase.from('users').select('id,name,email,role,profile_image,avg_rating').in('id', endorserIds),
  ]);

  const skillMap = Object.fromEntries((skills.data || []).map((s) => [s.id, toPublicSkill(s)]));
  const endorsedMap = Object.fromEntries((endorsers.data || []).map((u) => [u.id, toPublicCompactUser(u)]));

  return (data || []).map((row) => toPublicUserSkill({
    ...row,
    skill: skillMap[row.skill_id] || null,
    endorsedByUser: endorsedMap[row.endorsed_by] || null,
  }));
};

const getPeerMatches = async (userId, limit = 5) => {
  const { data: me, error: meError } = await supabase
    .from('users')
    .select('id,department,avg_rating')
    .eq('id', userId)
    .single();

  if (meError) throw meError;

  const mySkills = await getUserSkills(userId);
  const wantsToLearnIds = mySkills.filter(s => s.type === 'wants_to_learn').map(s => s.skillId);
  const canTeachIds = mySkills.filter(s => s.type === 'can_teach').map(s => s.skillId);

  if (!wantsToLearnIds.length && !canTeachIds.length) return [];

  const { data: others, error: othersError } = await supabase
    .from('users')
    .select('id,name,email,role,department,avg_rating,profile_image')
    .neq('id', userId)
    .limit(50);

  if (othersError) throw othersError;

  const matches = [];

  for (const user of others) {
    const userSkills = await getUserSkills(user.id);
    const userCanTeachIds = userSkills.filter(s => s.type === 'can_teach').map(s => s.skillId);
    const userWantsToLearnIds = userSkills.filter(s => s.type === 'wants_to_learn').map(s => s.skillId);

    const matchedSkills = userCanTeachIds.filter(id => wantsToLearnIds.includes(id));
    const reciprocalSkills = userWantsToLearnIds.filter(id => canTeachIds.includes(id));

    if (matchedSkills.length > 0) {
      let score = matchedSkills.length * 10;
      score += reciprocalSkills.length * 5;
      if (user.department === me.department) score += 2;
      score += (user.avg_rating || 0);

      matches.push({
        user,
        score,
        matchedSkills: matchedSkills.map(id => ({ skillId: id, skillName: userSkills.find(s => s.skillId === id)?.skill?.name })),
        reciprocalSkills: reciprocalSkills.map(id => ({ skillId: id, skillName: userSkills.find(s => s.skillId === id)?.skill?.name })),
      });
    }
  }

  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(entry => ({
      user: toPublicCompactUser(entry.user),
      matchScore: Number(entry.score.toFixed(2)),
      matchedSkills: entry.matchedSkills,
      reciprocalSkills: entry.reciprocalSkills,
    }));
};

const normalizeListingPayload = (payload) => ({
  skill_id: payload.skillId || payload.skill_id,
  listing_type: payload.listingType || payload.listing_type,
  level: payload.level || null,
  credit_rate: payload.creditRate ?? payload.credit_rate ?? 0,
  format: payload.format || 'one_on_one',
  max_group_size: payload.maxGroupSize ?? payload.max_group_size ?? null,
  description: payload.description || '',
  status: payload.status || 'active',
});

const enrichListings = async (listings) => {
  if (!listings.length) return [];
  const userIds = unique(listings.map((l) => l.user_id));
  const skillIds = unique(listings.map((l) => l.skill_id));

  const [users, skills] = await Promise.all([
    supabase.from('users').select('id,name,email,role,department,avg_rating,profile_image').in('id', userIds),
    supabase.from('skills').select('*').in('id', skillIds),
  ]);

  const userMap = Object.fromEntries((users.data || []).map((u) => [u.id, u]));
  const skillMap = Object.fromEntries((skills.data || []).map((s) => [s.id, s]));

  return listings.map((l) => ({
    ...l,
    user: userMap[l.user_id],
    skill: skillMap[l.skill_id],
  }));
};

const createListing = async ({ userId, payload }) => {
  const { data, error } = await supabase.from('exchange_listings').insert({
    ...normalizeListingPayload(payload),
    user_id: userId,
  }).select('*').single();
  if (error) throw error;
  return toPublicListing((await enrichListings([data]))[0]);
};

const listListings = async (filters = {}) => {
  let query = supabase.from('exchange_listings').select('*').order('created_at', { ascending: false });

  if (filters.skill_id) query = query.eq('skill_id', filters.skill_id);
  if (filters.format) query = query.eq('format', filters.format);
  if (filters.listing_type) query = query.eq('listing_type', filters.listing_type);
  if (filters.user_id) query = query.eq('user_id', filters.user_id);
  if (filters.userId) query = query.eq('user_id', filters.userId);
  if (filters.status) {
    query = query.eq('status', filters.status);
  } else {
    query = query.eq('status', 'active');
  }

  const { data, error } = await query;
  if (error) throw error;
  
  let listings = await enrichListings(data || []);
  
  if (filters.department) {
    listings = listings.filter(l => l.user?.department === filters.department);
  }

  return (listings || []).map(toPublicListing);
};

const getListingRecordById = async (listingId) => {
  const { data, error } = await supabase.from('exchange_listings').select('*').eq('id', listingId).maybeSingle();
  if (error) throw error;
  return data || null;
};

const getListingById = async (listingId) => {
  const listing = await getListingRecordById(listingId);
  if (!listing) return null;
  return toPublicListing((await enrichListings([listing]))[0]);
};

const updateListing = async ({ listingId, userId, payload }) => {
  const { data, error } = await supabase
    .from('exchange_listings')
    .update(normalizeListingPayload(payload))
    .eq('id', listingId)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return toPublicListing((await enrichListings([data]))[0]);
};

const deleteListing = async ({ listingId, userId }) => {
  const { error } = await supabase.from('exchange_listings').delete().eq('id', listingId).eq('user_id', userId);
  if (error) throw error;
  return true;
};

const enrichSessions = async (sessions) => {
  if (!sessions.length) return [];
  const listingIds = unique(sessions.map((s) => s.listing_id).filter(Boolean));
  const teacherIds = unique(sessions.map((s) => s.teacher_id));
  const learnerIds = unique(sessions.map((s) => s.learner_id).filter(Boolean));
  const teamIds = unique(sessions.map((s) => s.team_id).filter(Boolean));
  const skillIds = unique(sessions.map((s) => s.skill_id).filter(Boolean));
  const meetingIds = unique(sessions.map((s) => s.meeting_id).filter(Boolean));

  const [listings, teachers, learners, teams, skills, meetings, ratings] = await Promise.all([
    listingIds.length ? supabase.from('exchange_listings').select('*').in('id', listingIds) : { data: [] },
    supabase.from('users').select('id,name,email,role,profile_image,avg_rating').in('id', teacherIds),
    learnerIds.length ? supabase.from('users').select('id,name,email,role,profile_image,avg_rating').in('id', learnerIds) : { data: [] },
    teamIds.length ? supabase.from('teams').select('*').in('id', teamIds) : { data: [] },
    skillIds.length ? supabase.from('skills').select('*').in('id', skillIds) : { data: [] },
    meetingIds.length ? supabase.from('sessions').select('*').in('id', meetingIds) : { data: [] },
    supabase.from('ratings').select('session_id').in('session_id', sessions.map(s => s.id))
  ]);

  const listingMap = Object.fromEntries((listings.data || []).map((l) => [l.id, l]));
  const teacherMap = Object.fromEntries((teachers.data || []).map((u) => [u.id, u]));
  const learnerMap = Object.fromEntries((learners.data || []).map((u) => [u.id, u]));
  const teamMap = Object.fromEntries((teams.data || []).map((t) => [t.id, t]));
  const skillMap = Object.fromEntries((skills.data || []).map((s) => [s.id, s]));
  const meetingMap = Object.fromEntries((meetings.data || []).map((m) => [m.id, m]));
  const ratedSet = new Set((ratings.data || []).map(r => r.session_id));

  const enrichedListings = await enrichListings(listings.data || []);
  const enrichedListingMap = Object.fromEntries(enrichedListings.map(l => [l.id, l]));

  return sessions.map((s) => ({
    ...s,
    listing: enrichedListingMap[s.listing_id],
    teacher: teacherMap[s.teacher_id],
    learner: learnerMap[s.learner_id],
    team: teamMap[s.team_id],
    skill: skillMap[s.skill_id],
    meeting: meetingMap[s.meeting_id],
    rated: ratedSet.has(s.id)
  }));
};

const createSessionBooking = async ({ listingId, actorId, scheduledAt, durationMin, agenda }) => {
  const listing = await getListingRecordById(listingId);
  if (!listing) throw new Error('Listing not found');

  const { data, error } = await supabase.from('booking_sessions').insert({
    listing_id: listingId,
    teacher_id: listing.user_id,
    learner_id: actorId,
    skill_id: listing.skill_id,
    scheduled_at: scheduledAt,
    duration_min: durationMin || 60,
    agenda: agenda || '',
    status: 'pending',
  }).select('*').single();

  if (error) throw error;
  return toPublicSession((await enrichSessions([data]))[0]);
};

const getSessionRecordById = async (sessionId) => {
  const { data, error } = await supabase.from('booking_sessions').select('*').eq('id', sessionId).maybeSingle();
  if (error) throw error;
  return data || null;
};

const getSessionById = async (sessionId) => {
  const session = await getSessionRecordById(sessionId);
  if (!session) return null;
  return toPublicSession((await enrichSessions([session]))[0]);
};

const getSessionsByIds = async (sessionIds) => {
  const ids = unique(sessionIds);
  if (!ids.length) return [];
  const { data, error } = await supabase.from('booking_sessions').select('*').in('id', ids);
  if (error) throw error;
  return (await enrichSessions(data || [])).map(toPublicSession);
};

const listUserSessions = async (userId) => {
  const { data, error } = await supabase
    .from('booking_sessions')
    .select('*')
    .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`)
    .order('scheduled_at', { ascending: true });
  if (error) throw error;

  const now = new Date();
  const sessions = (await enrichSessions(data || [])).map(toPublicSession);
  const upcoming = [];
  const past = [];

  for (const session of sessions) {
    const scheduled = session.scheduledAt ? new Date(session.scheduledAt) : null;
    const isPast = session.status === 'completed' || session.status === 'cancelled' || (scheduled && scheduled < now);
    if (isPast) {
      past.push(session);
    } else {
      upcoming.push(session);
    }
  }

  return { upcoming, past };
};

const updateSessionStatus = async ({ sessionId, updates }) => {
  const { data, error } = await supabase
    .from('booking_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select('*')
    .single();

  if (error) throw error;
  return toPublicSession((await enrichSessions([data]))[0]);
};

const completeSession = async ({ sessionId }) => {
  const session = await getSessionRecordById(sessionId);
  if (!session) throw new Error('Session not found');
  if (session.status === 'completed') return getSessionById(sessionId);
  if (session.status === 'cancelled') throw new Error('Cancelled sessions cannot be completed');

  const listing = session.listing_id ? await getListingRecordById(session.listing_id) : null;
  const creditRate = listing?.credit_rate ?? 0;

  // Transfer credits
  const { error: txError } = await supabase.rpc('transfer_credits', {
    from_user: session.learner_id,
    to_user: session.teacher_id,
    amount: creditRate,
  });

  if (txError) throw txError;

  const { data, error } = await supabase
    .from('booking_sessions')
    .update({ status: 'completed' })
    .eq('id', sessionId)
    .select('*')
    .single();

  if (error) throw error;
  return toPublicSession((await enrichSessions([data]))[0]);
};

const enrichRatings = async (ratings) => {
  if (!ratings.length) return [];
  const raterIds = unique(ratings.map(r => r.rater_id));
  const rateeIds = unique(ratings.map(r => r.ratee_id));
  const sessionIds = unique(ratings.map(r => r.session_id));

  const [raters, ratees, sessions] = await Promise.all([
    supabase.from('users').select('id,name,email,role,profile_image,avg_rating').in('id', raterIds),
    supabase.from('users').select('id,name,email,role,profile_image,avg_rating').in('id', rateeIds),
    supabase.from('booking_sessions').select('*').in('id', sessionIds),
  ]);

  const raterMap = Object.fromEntries((raters.data || []).map(u => [u.id, u]));
  const rateeMap = Object.fromEntries((ratees.data || []).map(u => [u.id, u]));
  const enrichedSessions = await enrichSessions(sessions.data || []);
  const sessionMap = Object.fromEntries(enrichedSessions.map(s => [s.id, s]));

  return ratings.map(r => ({
    ...r,
    rater: raterMap[r.rater_id],
    ratee: rateeMap[r.ratee_id],
    session: sessionMap[r.session_id],
  }));
};

const createRating = async ({ sessionId, raterId, stars, review }) => {
  const session = await getSessionRecordById(sessionId);
  if (!session) throw new Error('Session not found');

  const rateeId = raterId === session.teacher_id ? session.learner_id : session.teacher_id;

  const { data, error } = await supabase
    .from('ratings')
    .insert({
      session_id: sessionId,
      rater_id: raterId,
      ratee_id: rateeId,
      stars,
      review: review || '',
    })
    .select('*')
    .single();

  if (error) throw error;

  await recalculateUserAverageRating(rateeId);

  return toPublicRating((await enrichRatings([data]))[0]);
};

const getRatingsForUser = async (userId) => {
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('ratee_id', userId);
  if (error) throw error;

  const ratings = (await enrichRatings(data || [])).map(toPublicRating);
  const avgRating = await recalculateUserAverageRating(userId);
  return { avgRating, ratings };
};

const recalculateUserAverageRating = async (userId) => {
  const { data, error } = await supabase
    .from('ratings')
    .select('stars')
    .eq('ratee_id', userId);
  if (error) throw error;

  if (!data?.length) return 0;
  const sum = data.reduce((acc, r) => acc + r.stars, 0);
  const avg = sum / data.length;

  await supabase.from('users').update({ avg_rating: avg }).eq('id', userId);
  return avg;
};

const createMessage = async ({ senderId, teamId, conversationId, content }) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      team_id: teamId || null,
      conversation_id: conversationId || null,
      content,
    })
    .select('*')
    .single();

  if (error) throw error;

  const senders = await supabase.from('users').select('id,name,email,role,profile_image,avg_rating').eq('id', senderId);
  const senderMap = Object.fromEntries((senders.data || []).map(u => [u.id, u]));

  return toPublicMessage({ ...data, sender: senderMap[senderId] || null });
};

const listTeamMessages = async (teamId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const senderIds = unique(data.map(m => m.sender_id));
  const senders = await supabase.from('users').select('id,name,email,role,profile_image,avg_rating').in('id', senderIds);
  const senderMap = Object.fromEntries((senders.data || []).map(u => [u.id, u]));

  return (data || []).map((row) => toPublicMessage({ ...row, sender: senderMap[row.sender_id] || null }));
};

const listConversationMessages = async (conversationId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const senderIds = unique(data.map(m => m.sender_id));
  const senders = await supabase.from('users').select('id,name,email,role,profile_image,avg_rating').in('id', senderIds);
  const senderMap = Object.fromEntries((senders.data || []).map(u => [u.id, u]));

  return (data || []).map((row) => toPublicMessage({ ...row, sender: senderMap[row.sender_id] || null }));
};

const markMessagesRead = async ({ userId, messageIds }) => {
  const rows = unique(messageIds).map((messageId) => ({ message_id: messageId, user_id: userId }));
  if (!rows.length) return true;
  const { error } = await supabase.from('message_reads').upsert(rows, { onConflict: 'message_id,user_id' });
  if (error) throw error;
  return true;
};

const uniqueSlug = async (table, baseValue) => {
  const baseSlug = slugify(baseValue);
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const { data } = await supabase.from(table).select('id').eq('slug', slug).maybeSingle();
    if (!data) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
};

module.exports = {
  supabase,
  crypto,
  slugify,
  toPublicUser,
  toPublicCompactUser,
  toPublicOrganisation,
  toPublicOrgRole,
  toPublicOrgMember,
  toPublicComplianceRules,
  toPublicCustomField,
  toPublicAuditLog,
  toPublicMeeting,
  toPublicSkill,
  toPublicUserSkill,
  toPublicListing,
  toPublicSession,
  toPublicRating,
  toPublicMessage,
  toPublicResource,
  getUserById,
  getUserByEmail,
  createUser,
  verifyUserPassword,
  updateUser,
  listSkills,
  addUserSkill,
  removeUserSkill,
  getUserSkills,
  getPeerMatches,
  createListing,
  listListings,
  getListingById,
  getListingRecordById,
  updateListing,
  deleteListing,
  createSessionBooking,
  getSessionById,
  getSessionRecordById,
  listUserSessions,
  updateSessionStatus,
  completeSession,
  createRating,
  getRatingsForUser,
  recalculateUserAverageRating,
  createMessage,
  listTeamMessages,
  listConversationMessages,
  markMessagesRead,
  uniqueSlug,
};

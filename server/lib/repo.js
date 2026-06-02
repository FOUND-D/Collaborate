const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabase = require('./supabase');

const SESSION_REQUEST_PREFIX = '__session_request__:';

const unique = (values) => [...new Set((values || []).filter(Boolean))];

const buildMap = (rows, key = 'id') => Object.fromEntries((rows || []).map((row) => [row[key], row]));

const levelWeight = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

const normalizeLevel = (value) => (typeof value === 'string' ? value.toLowerCase() : null);

const formatAvgRating = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : null;
};

const toPublicCompactUser = (user) => {
  if (!user) return null;
  return {
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
    _id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department || '',
    yearOfStudy: u.year_of_study ?? null,
    year_of_study: u.year_of_study ?? null,
    studentId: u.student_id || '',
    student_id: u.student_id || '',
    credits: u.credits ?? 50,
    avgRating: formatAvgRating(u.avg_rating),
    avg_rating: formatAvgRating(u.avg_rating),
    portfolioSlug: u.portfolio_slug || '',
    portfolio_slug: u.portfolio_slug || '',
    profileImage: u.profile_image || '',
    mobileNumber: u.mobile_number || '',
    bio: u.bio || '',
    designation: u.designation || '',
    customFields: u.custom_fields || {},
    techStack: u.tech_stack || [],
    reputationScore: u.reputation_score || 0,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  };
};

const toPublicOrganisation = (o) => {
  if (!o) return null;
  console.log(`[toPublicOrganisation] Mapping org: ${o.id}`);
  return {
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
    canInviteMembers: role.can_invite_members,
    canViewReports: role.can_view_reports,
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
  user: listing.user ? toPublicCompactUser(listing.user) : undefined,
  skill: listing.skill ? toPublicSkill(listing.skill) : undefined,
});

const toPublicSession = (session) => session && ({
  _id: session.id,
  listingId: session.listing_id || null,
  listing_id: session.listing_id || null,
  teacherId: session.teacher_id,
  teacher_id: session.teacher_id,
  learnerId: session.learner_id || null,
  learner_id: session.learner_id || null,
  scheduledAt: session.scheduled_at,
  scheduled_at: session.scheduled_at,
  durationMin: session.duration_min ?? 60,
  duration_min: session.duration_min ?? 60,
  status: session.status,
  creditsTransacted: session.credits_transacted ?? null,
  credits_transacted: session.credits_transacted ?? null,
  agenda: session.agenda || '',
  aiSummary: session.ai_summary || '',
  ai_summary: session.ai_summary || '',
  meetingId: session.meeting_id || null,
  meeting_id: session.meeting_id || null,
  listing: session.listing ? toPublicListing(session.listing) : undefined,
  teacher: session.teacher ? toPublicCompactUser(session.teacher) : undefined,
  learner: session.learner ? toPublicCompactUser(session.learner) : undefined,
  meeting: session.meeting ? toPublicMeeting(session.meeting) : undefined,
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

const decodeMessageContent = (rawContent) => {
  if (typeof rawContent !== 'string' || !rawContent.startsWith(SESSION_REQUEST_PREFIX)) {
    return { type: 'text', content: rawContent || '', sessionRequest: null };
  }

  try {
    const decoded = JSON.parse(rawContent.slice(SESSION_REQUEST_PREFIX.length));
    return {
      type: 'session_request',
      content: decoded.content || '',
      sessionRequest: decoded.payload || null,
    };
  } catch (error) {
    return { type: 'text', content: rawContent, sessionRequest: null };
  }
};

const buildSessionRequestContent = (payload) => {
  const skill = payload?.skill || 'Skill exchange';
  const proposedTime = payload?.proposed_time || 'TBD';
  return `Session request: ${skill} at ${proposedTime}`;
};

const encodeMessageContent = ({ content, messageType, sessionRequest }) => {
  if (messageType !== 'session_request') return content || '';
  return `${SESSION_REQUEST_PREFIX}${JSON.stringify({
    content: content || buildSessionRequestContent(sessionRequest),
    payload: sessionRequest || null,
  })}`;
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

const fetchUsersMap = async (userIds) => {
  const ids = unique(userIds);
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from('users')
    .select('id,name,email,role,department,avg_rating,profile_image,credits')
    .in('id', ids);
  if (error) throw error;
  return buildMap(data || []);
};

const fetchSkillsMap = async (skillIds) => {
  const ids = unique(skillIds);
  if (!ids.length) return {};
  const { data, error } = await supabase.from('skills').select('*').in('id', ids);
  if (error) throw error;
  return buildMap(data || []);
};

const fetchListingsMap = async (listingIds) => {
  const ids = unique(listingIds);
  if (!ids.length) return {};
  const { data, error } = await supabase.from('exchange_listings').select('*').in('id', ids);
  if (error) throw error;
  return buildMap(data || []);
};

const enrichListings = async (listings) => {
  const rows = listings || [];
  if (!rows.length) return [];

  const userMap = await fetchUsersMap(rows.map((row) => row.user_id));
  const skillMap = await fetchSkillsMap(rows.map((row) => row.skill_id));

  return rows.map((row) => ({
    ...row,
    user: userMap[row.user_id] || null,
    skill: skillMap[row.skill_id] || null,
  }));
};

const enrichSessions = async (sessions) => {
  const rows = sessions || [];
  if (!rows.length) return [];

  const listingMap = await fetchListingsMap(rows.map((row) => row.listing_id));
  const enrichedListings = await enrichListings(Object.values(listingMap));
  const hydratedListingMap = buildMap(enrichedListings);
  const userMap = await fetchUsersMap(rows.flatMap((row) => [row.teacher_id, row.learner_id]));

  return rows.map((row) => ({
    ...row,
    listing: hydratedListingMap[row.listing_id] || null,
    teacher: userMap[row.teacher_id] || null,
    learner: userMap[row.learner_id] || null,
  }));
};

const enrichRatings = async (ratings) => {
  const rows = ratings || [];
  if (!rows.length) return [];

  const sessionRows = await getSessionsByIds(rows.map((row) => row.session_id));
  const sessionMap = buildMap(sessionRows);
  const userMap = await fetchUsersMap(rows.flatMap((row) => [row.rater_id, row.ratee_id]));

  return rows.map((row) => ({
    ...row,
    session: sessionMap[row.session_id] || null,
    rater: userMap[row.rater_id] || null,
    ratee: userMap[row.ratee_id] || null,
  }));
};

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

const createUser = async ({ name, email, password, role, department, yearOfStudy, studentId, techStack, profileImage }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase.from('users').insert({
    name,
    email,
    password_hash: passwordHash,
    role: role || 'undergrad',
    department: department || null,
    year_of_study: yearOfStudy ?? null,
    student_id: studentId || null,
    credits: 50,
    tech_stack: techStack || [],
    profile_image: profileImage || '',
    mobile_number: '',
    bio: '',
    designation: '',
    custom_fields: {},
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
  if (patch.department !== undefined) updates.department = patch.department;
  if (patch.yearOfStudy !== undefined) updates.year_of_study = patch.yearOfStudy;
  if (patch.year_of_study !== undefined) updates.year_of_study = patch.year_of_study;
  if (patch.studentId !== undefined) updates.student_id = patch.studentId || null;
  if (patch.student_id !== undefined) updates.student_id = patch.student_id || null;
  if (patch.credits !== undefined) updates.credits = patch.credits;
  if (patch.avgRating !== undefined) updates.avg_rating = patch.avgRating;
  if (patch.avg_rating !== undefined) updates.avg_rating = patch.avg_rating;
  if (patch.portfolioSlug !== undefined) updates.portfolio_slug = patch.portfolioSlug;
  if (patch.portfolio_slug !== undefined) updates.portfolio_slug = patch.portfolio_slug;
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

const ensureSkillRecord = async ({ skillId, name, category }) => {
  if (skillId) {
    const skill = await getSkillRecordById(skillId);
    if (!skill) throw new Error('Skill not found');
    return skill;
  }

  if (!name) throw new Error('Skill name is required');

  const existing = await getSkillRecordByName(name.trim());
  if (existing) return existing;

  const { data, error } = await supabase
    .from('skills')
    .insert({ name: name.trim(), category: category || null })
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

const addUserSkill = async ({ userId, skillId, name, category, type, level }) => {
  const skill = await ensureSkillRecord({ skillId, name, category });
  const { data, error } = await supabase
    .from('user_skills')
    .upsert({
      user_id: userId,
      skill_id: skill.id,
      type,
      level: level || null,
    }, { onConflict: 'user_id,skill_id,type' })
    .select('*')
    .single();
  if (error) throw error;
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
  const { data, error } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_id', userId)
    .order('type', { ascending: true });
  if (error) throw error;

  const skillMap = await fetchSkillsMap((data || []).map((row) => row.skill_id));
  const endorsedMap = await fetchUsersMap((data || []).map((row) => row.endorsed_by));

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

  const { data: mySkills, error: mySkillsError } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_id', userId);
  if (mySkillsError) throw mySkillsError;

  const wantsToLearn = (mySkills || []).filter((row) => row.type === 'wants_to_learn');
  if (!wantsToLearn.length) return [];

  const canTeachIds = unique(wantsToLearn.map((row) => row.skill_id));
  const { data: candidateTeachRows, error: candidateTeachError } = await supabase
    .from('user_skills')
    .select('*')
    .eq('type', 'can_teach')
    .in('skill_id', canTeachIds)
    .neq('user_id', userId);
  if (candidateTeachError) throw candidateTeachError;

  const myTeachIds = unique((mySkills || []).filter((row) => row.type === 'can_teach').map((row) => row.skill_id));
  let candidateLearnRows = [];
  if (myTeachIds.length) {
    const { data, error } = await supabase
      .from('user_skills')
      .select('*')
      .eq('type', 'wants_to_learn')
      .in('skill_id', myTeachIds)
      .neq('user_id', userId);
    if (error) throw error;
    candidateLearnRows = data || [];
  }

  const userMap = await fetchUsersMap(unique((candidateTeachRows || []).map((row) => row.user_id).concat((candidateLearnRows || []).map((row) => row.user_id))));
  const skillMap = await fetchSkillsMap(unique(canTeachIds.concat(myTeachIds)));
  const wantedMap = Object.fromEntries(wantsToLearn.map((row) => [row.skill_id, row]));
  const reciprocalByUser = {};

  for (const row of candidateLearnRows) {
    if (!reciprocalByUser[row.user_id]) reciprocalByUser[row.user_id] = [];
    reciprocalByUser[row.user_id].push(row);
  }

  const scores = {};
  for (const row of candidateTeachRows || []) {
    const wanted = wantedMap[row.skill_id];
    const candidate = userMap[row.user_id];
    if (!wanted || !candidate) continue;

    const wantedLevel = levelWeight[normalizeLevel(wanted.level)] || 1;
    const candidateLevel = levelWeight[normalizeLevel(row.level)] || 1;
    const fitBonus = Math.max(0, 18 - Math.abs(candidateLevel - wantedLevel) * 6);
    const departmentBonus = me.department && candidate.department && me.department === candidate.department ? 10 : 0;
    const ratingBonus = (formatAvgRating(candidate.avg_rating) || 0) * 4;
    const reciprocalMatches = reciprocalByUser[row.user_id] || [];
    const reciprocalBonus = reciprocalMatches.length ? Math.min(20, reciprocalMatches.length * 10) : 0;

    if (!scores[row.user_id]) {
      scores[row.user_id] = {
        user: candidate,
        score: 0,
        matchedSkills: [],
        reciprocalSkills: reciprocalMatches.map((entry) => ({
          skillId: entry.skill_id,
          skillName: skillMap[entry.skill_id]?.name || '',
          level: entry.level || null,
        })),
      };
    }

    scores[row.user_id].score += 50 + (candidateLevel * 8) + fitBonus + departmentBonus + ratingBonus + reciprocalBonus;
    scores[row.user_id].matchedSkills.push({
      skillId: row.skill_id,
      skillName: skillMap[row.skill_id]?.name || '',
      candidateLevel: row.level || null,
      requestedLevel: wanted.level || null,
    });
  }

  return Object.values(scores)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => ({
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
  format: payload.format || null,
  max_group_size: payload.maxGroupSize ?? payload.max_group_size ?? null,
  description: payload.description || '',
  status: payload.status || 'active',
});

const createListing = async (userId, payload) => {
  const insertPayload = {
    user_id: userId,
    ...normalizeListingPayload(payload),
  };
  const { data, error } = await supabase.from('exchange_listings').insert(insertPayload).select('*').single();
  if (error) throw error;
  return toPublicListing((await enrichListings([data]))[0]);
};

const listListings = async (filters = {}) => {
  let query = supabase.from('exchange_listings').select('*').order('created_at', { ascending: false });

  if (filters.skill_id) query = query.eq('skill_id', filters.skill_id);
  if (filters.format) query = query.eq('format', filters.format);
  if (filters.listing_type) query = query.eq('listing_type', filters.listing_type);
  if (filters.status) {
    query = query.eq('status', filters.status);
  } else {
    query = query.eq('status', 'active');
  }

  if (filters.department) {
    const { data: departmentUsers, error: departmentError } = await supabase
      .from('users')
      .select('id')
      .eq('department', filters.department);
    if (departmentError) throw departmentError;
    const userIds = (departmentUsers || []).map((row) => row.id);
    if (!userIds.length) return [];
    query = query.in('user_id', userIds);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (await enrichListings(data || [])).map(toPublicListing);
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

const createSessionBooking = async ({ listingId, actorId, scheduledAt, durationMin, agenda }) => {
  const listing = await getListingRecordById(listingId);
  if (!listing) throw new Error('Listing not found');
  if (listing.status !== 'active') throw new Error('Listing is not active');
  if (listing.user_id === actorId) throw new Error('You cannot book your own listing');

  const teacherId = listing.listing_type === 'offer' ? listing.user_id : actorId;
  const learnerId = listing.listing_type === 'offer' ? actorId : listing.user_id;

  const { data, error } = await supabase
    .from('booking_sessions')
    .insert({
      listing_id: listing.id,
      teacher_id: teacherId,
      learner_id: learnerId,
      scheduled_at: scheduledAt,
      duration_min: durationMin ?? 60,
      status: 'pending',
      agenda: agenda || null,
    })
    .select('*')
    .single();
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

  if (creditRate > 0 && session.learner_id && session.teacher_id) {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id,credits')
      .in('id', [session.teacher_id, session.learner_id]);
    if (usersError) throw usersError;

    const userMap = buildMap(users || []);
    const learner = userMap[session.learner_id];
    const teacher = userMap[session.teacher_id];
    if (!learner || !teacher) throw new Error('Session participants could not be loaded');
    if ((learner.credits ?? 0) < creditRate) throw new Error('Learner does not have enough credits');

    const { error: learnerError } = await supabase
      .from('users')
      .update({ credits: (learner.credits ?? 0) - creditRate })
      .eq('id', learner.id);
    if (learnerError) throw learnerError;

    const { error: teacherError } = await supabase
      .from('users')
      .update({ credits: (teacher.credits ?? 0) + creditRate })
      .eq('id', teacher.id);
    if (teacherError) throw teacherError;
  }

  return updateSessionStatus({
    sessionId,
    updates: {
      status: 'completed',
      credits_transacted: creditRate,
    },
  });
};

const createRating = async ({ sessionId, raterId, rateeId, stars, review, isFlagged }) => {
  const { data, error } = await supabase
    .from('ratings')
    .insert({
      session_id: sessionId,
      rater_id: raterId,
      ratee_id: rateeId,
      stars,
      review: review || '',
      is_flagged: Boolean(isFlagged),
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

  const stars = (data || []).map((row) => Number(row.stars)).filter((value) => Number.isFinite(value));
  const avgRating = stars.length ? Number((stars.reduce((sum, value) => sum + value, 0) / stars.length).toFixed(2)) : null;

  const { error: updateError } = await supabase
    .from('users')
    .update({ avg_rating: avgRating })
    .eq('id', userId);
  if (updateError) throw updateError;

  return avgRating;
};

const findOrCreateConversation = async ({ senderId, recipientId, conversationId }) => {
  if (conversationId) return conversationId;
  if (!recipientId) return null;

  let { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('participant_a', senderId)
    .eq('participant_b', recipientId)
    .maybeSingle();
  if (error) throw error;

  if (!data) {
    const reverse = await supabase
      .from('conversations')
      .select('*')
      .eq('participant_a', recipientId)
      .eq('participant_b', senderId)
      .maybeSingle();
    if (reverse.error) throw reverse.error;
    data = reverse.data;
  }

  if (!data) {
    const created = await supabase
      .from('conversations')
      .insert({ participant_a: senderId, participant_b: recipientId })
      .select('*')
      .single();
    if (created.error) throw created.error;
    data = created.data;
  }

  return data.id;
};

const createMessage = async ({ senderId, content, teamId, conversationId, recipientId, messageType, sessionRequest }) => {
  const resolvedConversationId = await findOrCreateConversation({ senderId, recipientId, conversationId });
  const payload = {
    sender_id: senderId,
    content: encodeMessageContent({ content, messageType, sessionRequest }),
    team_id: teamId || null,
    conversation_id: resolvedConversationId,
  };

  const { data, error } = await supabase.from('messages').insert(payload).select('*').single();
  if (error) throw error;

  const senderMap = await fetchUsersMap([senderId]);
  return toPublicMessage({ ...data, sender: senderMap[senderId] || null });
};

const listTeamMessages = async (teamId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const senderMap = await fetchUsersMap((data || []).map((row) => row.sender_id));
  return (data || []).map((row) => toPublicMessage({ ...row, sender: senderMap[row.sender_id] || null }));
};

const listConversationMessages = async (conversationId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const senderMap = await fetchUsersMap((data || []).map((row) => row.sender_id));
  return (data || []).map((row) => toPublicMessage({ ...row, sender: senderMap[row.sender_id] || null }));
};

const markMessagesRead = async ({ userId, messageIds }) => {
  const rows = unique(messageIds).map((messageId) => ({ message_id: messageId, user_id: userId }));
  if (!rows.length) return true;
  const { error } = await supabase.from('message_reads').upsert(rows, { onConflict: 'message_id,user_id' });
  if (error) throw error;
  return true;
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

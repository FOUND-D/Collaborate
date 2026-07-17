const asyncHandler = require('../middleware/asyncHandler');
const { supabase } = require('../lib/repo');
const axios = require('axios');

const getOrgMembership = async (organisationId, userId) => {
  if (!organisationId || !userId) return null;
  const { data, error } = await supabase
    .from('organisation_members')
    .select('role, org_roles(slug,can_manage_teams)')
    .eq('organisation_id', organisationId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const hydrateTeam = async (team, viewerId = null) => {
  const [{ data: owner }, { data: members }, { data: requests }, { data: projects }] = await Promise.all([
    supabase.from('users').select('id,name,email').eq('id', team.owner_id).maybeSingle(),
    supabase.from('team_members').select('users(id,name,email)').eq('team_id', team.id),
    supabase.from('team_join_requests').select('users(id,name,email)').eq('team_id', team.id),
    supabase.from('projects').select('*').eq('team_id', team.id),
  ]);
  return {
    _id: team.id,
    name: team.name,
    type: team.type || 'study_group',
    subjectCode: team.subject_code || '',
    subject_code: team.subject_code || '',
    createdByRole: team.created_by_role || '',
    githubRepo: team.github_repo || null,
    github_repo: team.github_repo || null,
    owner: owner ? { _id: owner.id, name: owner.name, email: owner.email } : null,
    members: (members || []).map((r) => r.users).filter(Boolean).map((u) => ({ _id: u.id, name: u.name, email: u.email })),
    pendingJoinRequests: (requests || []).map((r) => r.users).filter(Boolean).map((u) => ({ _id: u.id, name: u.name, email: u.email })),
    projects: projects || [],
    organisation: team.organisation_id,
    permissions: {
      canManageMembers: Boolean(viewerId && team.owner_id === viewerId),
      canManageProjects: Boolean(viewerId && team.owner_id === viewerId),
    },
  };
};

const getTeamById = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('teams').select('*').eq('id', req.params.id).maybeSingle();
  if (error || !data) return res.status(404).json({ message: 'Team not found' });
  res.json(await hydrateTeam(data, req.user._id));
});

const createTeam = asyncHandler(async (req, res) => {
  const { name, organisation, type, subjectCode, subject_code } = req.body;
  if (!organisation) {
    return res.status(400).json({ message: 'Join or create an organisation before creating a team' });
  }
  if (req.body.type === 'course' && req.user.role !== 'faculty') {
    return res.status(403).json({ message: 'Only faculty can create course groups' });
  }

  const normalizedType = type || 'study_group';
  const normalizedSubjectCode = subjectCode || subject_code || null;
  const { data, error } = await supabase.from('teams').insert({
    name,
    owner_id: req.user._id,
    organisation_id: organisation || null,
    type: normalizedType,
    subject_code: normalizedSubjectCode,
    created_by_role: req.user.role || null,
  }).select('*').single();
  if (error) throw error;
  await supabase.from('team_members').insert({ team_id: data.id, user_id: req.user._id });
  req.io?.to(organisation).emit('teamCreated', { teamId: data.id, type: normalizedType });
  
  try {
    const { sendNotification } = require('../services/notificationService');
    sendNotification(req.app.get('io'), {
      userId: req.user._id,
      title: 'Team Created',
      message: `Created ${name} team.`,
      type: 'general',
      data: { teamId: data.id }
    });
  } catch (err) {
    console.error('Notification failed:', err);
  }

  res.status(201).json(await hydrateTeam(data, req.user._id));
});

const getTeams = asyncHandler(async (req, res) => {
  const [{ data: ownedTeams, error: ownedTeamsError }, { data: memberships, error: membershipsError }] = await Promise.all([
    supabase.from('teams').select('*').eq('owner_id', req.user._id),
    supabase.from('team_members').select('team_id').eq('user_id', req.user._id),
  ]);

  if (ownedTeamsError) throw ownedTeamsError;
  if (membershipsError) throw membershipsError;

  const memberTeamIds = [...new Set((memberships || []).map((membership) => membership.team_id).filter(Boolean))];
  let memberTeams = [];

  if (memberTeamIds.length) {
    const { data, error } = await supabase.from('teams').select('*').in('id', memberTeamIds);
    if (error) throw error;
    memberTeams = data || [];
  }

  const uniqueTeams = [...(ownedTeams || []), ...memberTeams].filter(
    (team, index, collection) => collection.findIndex((candidate) => candidate.id === team.id) === index
  );

  const teams = [];
  for (const team of uniqueTeams) teams.push(await hydrateTeam(team, req.user._id));
  res.json(teams);
});

const addMember = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const { data: team, error: teamError } = await supabase.from('teams').select('*').eq('id', req.params.id).single();
  if (teamError || !team) return res.status(404).json({ message: 'Team not found' });

  if (team.organisation_id) {
    const targetMembership = await getOrgMembership(team.organisation_id, userId);
    if (!targetMembership) {
      return res.status(400).json({ message: 'Only members of this organisation can be added to the team' });
    }
  }

  const { data: existingMember, error: existingError } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('team_id', team.id)
    .eq('user_id', userId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existingMember) {
    return res.status(400).json({ message: 'This user is already in the team' });
  }

  const { error: insertError } = await supabase.from('team_members').insert({ team_id: team.id, user_id: userId });
  if (insertError) throw insertError;

  await supabase.from('team_join_requests').delete().eq('team_id', team.id).eq('user_id', userId);

  try {
    const { sendNotification } = require('../services/notificationService');
    sendNotification(req.io, {
      userId: userId,
      title: 'Added to Team',
      message: `You have been added to the team: "${team.name}"`,
      type: 'team_join',
      data: { teamId: team.id }
    });
  } catch (notifErr) {
    console.error('Failed to trigger team add notification:', notifErr.message);
  }

  res.json(await hydrateTeam(team, req.user._id));
});

const joinTeam = asyncHandler(async (req, res) => {
  const { data: team, error: teamError } = await supabase.from('teams').select('*').eq('id', req.params.id).maybeSingle();
  if (teamError || !team) return res.status(404).json({ message: 'Team not found' });

  await supabase.from('team_join_requests').upsert({ team_id: req.params.id, user_id: req.user._id });
  res.json({ message: 'Join request sent successfully' });
});

const deleteTeam = asyncHandler(async (req, res) => {
  const { data: team, error: teamError } = await supabase.from('teams').select('*').eq('id', req.params.id).maybeSingle();
  if (teamError || !team) return res.status(404).json({ message: 'Team not found' });

  await supabase.from('task_dependencies').delete().in('task_id', []);
  await supabase.from('tasks').delete().eq('team_id', req.params.id);
  await supabase.from('team_members').delete().eq('team_id', req.params.id);
  await supabase.from('team_join_requests').delete().eq('team_id', req.params.id);
  await supabase.from('projects').update({ team_id: null }).eq('team_id', req.params.id);
  await supabase.from('teams').delete().eq('id', req.params.id);
  res.json({ message: 'Team removed' });
});

const updateTeamJoinRequest = asyncHandler(async (req, res) => {
  const { userId, action } = req.body;
  const { data: team, error: teamError } = await supabase.from('teams').select('*').eq('id', req.params.id).maybeSingle();
  if (teamError || !team) return res.status(404).json({ message: 'Team not found' });

  await supabase.from('team_join_requests').delete().eq('team_id', req.params.id).eq('user_id', userId);
  if (action === 'approve') {
    if (team.organisation_id) {
      const targetMembership = await getOrgMembership(team.organisation_id, userId);
      if (!targetMembership) {
        return res.status(400).json({ message: 'Only members of this organisation can join this team' });
      }
    }
    await supabase.from('team_members').insert({ team_id: req.params.id, user_id: userId });

    try {
      const { sendNotification } = require('../services/notificationService');
      sendNotification(req.io, {
        userId: userId,
        title: 'Team Join Request Approved',
        message: `Your request to join the team "${team.name}" has been approved!`,
        type: 'team_join',
        data: { teamId: team.id }
      });
    } catch (notifErr) {
      console.error('Failed to trigger team join approval notification:', notifErr.message);
    }
  } else {
    try {
      const { sendNotification } = require('../services/notificationService');
      sendNotification(req.io, {
        userId: userId,
        title: 'Team Join Request Declined',
        message: `Your request to join the team "${team.name}" was declined.`,
        type: 'team_join_declined',
        data: { teamId: team.id }
      });
    } catch (notifErr) {
      console.error('Failed to trigger team join decline notification:', notifErr.message);
    }
  }
  res.json({ message: `User join request ${action}d` });
});

// ---------------------------------------------------------------
// NEW: Link or update the GitHub repository for a team
// PUT /api/teams/:id/github
// Body: { repoPath: 'owner/repo-name' }
// ---------------------------------------------------------------
const linkGithubRepo = asyncHandler(async (req, res) => {
  const { repoPath } = req.body;

  // Fetch team to validate ownership
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (teamError || !team) return res.status(404).json({ message: 'Team not found' });
  if (team.owner_id !== req.user._id) {
    return res.status(403).json({ message: 'Only the team owner can link a GitHub repository' });
  }

  // Accept full GitHub URLs or shorthand 'owner/repo'
  let normalizedRepo = (repoPath || '').trim();
  const urlMatch = normalizedRepo.match(/github\.com\/([^/]+\/[^/]+)/);
  if (urlMatch) {
    normalizedRepo = urlMatch[1].replace(/\.git$/, '');
  }

  if (!normalizedRepo || !normalizedRepo.includes('/')) {
    return res.status(400).json({ message: 'Invalid repository format. Use owner/repo-name or a full GitHub URL.' });
  }

  // Validate repo exists on GitHub before saving
  try {
    const ghHeaders = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (process.env.GITHUB_TOKEN) ghHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    await axios.get(`https://api.github.com/repos/${normalizedRepo}`, { headers: ghHeaders });
  } catch (ghErr) {
    if (ghErr.response?.status === 404) {
      return res.status(400).json({ message: `Repository "${normalizedRepo}" not found on GitHub or is private.` });
    }
    // If rate limited or other GitHub error, still save but warn
    console.warn('GitHub validation warning:', ghErr.message);
  }

  const { error: updateError } = await supabase
    .from('teams')
    .update({ github_repo: normalizedRepo })
    .eq('id', req.params.id);

  if (updateError) throw updateError;

  const { data: updated } = await supabase.from('teams').select('*').eq('id', req.params.id).maybeSingle();
  res.json(await hydrateTeam(updated, req.user._id));
});

// ---------------------------------------------------------------
// NEW: Fetch latest commits with team member matching
// GET /api/teams/:id/commits?page=1&per_page=20
// ---------------------------------------------------------------
const getTeamCommits = asyncHandler(async (req, res) => {
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (teamError || !team) return res.status(404).json({ message: 'Team not found' });
  if (!team.github_repo) {
    return res.status(400).json({ message: 'No GitHub repository linked to this team yet.' });
  }

  const page = parseInt(req.query.page) || 1;
  const perPage = Math.min(parseInt(req.query.per_page) || 20, 50);

  // Fetch commits from GitHub API
  const ghHeaders = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  if (process.env.GITHUB_TOKEN) ghHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  let commits;
  try {
    const { data: ghData } = await axios.get(
      `https://api.github.com/repos/${team.github_repo}/commits`,
      { headers: ghHeaders, params: { page, per_page: perPage } }
    );
    commits = ghData;
  } catch (ghErr) {
    if (ghErr.response?.status === 404) {
      return res.status(404).json({ message: 'Repository not found on GitHub. It may have been deleted or made private.' });
    }
    if (ghErr.response?.status === 403) {
      return res.status(429).json({ message: 'GitHub API rate limit reached. Please try again later or add a GITHUB_TOKEN to the server.' });
    }
    throw ghErr;
  }

  if (!commits || commits.length === 0) {
    return res.json({ commits: [], repo: team.github_repo });
  }

  // Fetch all team members including their github_username and email
  const { data: memberRows } = await supabase
    .from('team_members')
    .select('users(id, name, email, profile_image, role, github_username)')
    .eq('team_id', team.id);

  const teamMembers = (memberRows || [])
    .map(r => r.users)
    .filter(Boolean);

  // Build lookup maps for fast matching
  const byGithubUsername = {};
  const byEmail = {};
  const byName = {};
  for (const member of teamMembers) {
    if (member.github_username) {
      byGithubUsername[member.github_username.toLowerCase()] = member;
    }
    if (member.email) {
      byEmail[member.email.toLowerCase()] = member;
    }
    if (member.name) {
      byName[member.name.toLowerCase()] = member;
    }
  }

  // Enrich each commit with matched Collaborate user profile
  const enrichedCommits = commits.map(commit => {
    const ghLogin = commit.author?.login?.toLowerCase() || '';
    const ghEmail = commit.commit?.author?.email?.toLowerCase() || '';
    const ghName = commit.commit?.author?.name?.toLowerCase() || '';

    // Match priority: github username > email > name
    const matchedUser =
      byGithubUsername[ghLogin] ||
      byEmail[ghEmail] ||
      byName[ghName] ||
      null;

    return {
      sha: commit.sha,
      shortSha: commit.sha.substring(0, 7),
      message: commit.commit.message,
      htmlUrl: commit.html_url,
      authoredAt: commit.commit.author.date,
      githubAuthor: {
        login: commit.author?.login || null,
        avatarUrl: commit.author?.avatar_url || null,
        name: commit.commit.author.name,
        email: commit.commit.author.email,
      },
      collaborateUser: matchedUser ? {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
        profileImage: matchedUser.profile_image || null,
        githubUsername: matchedUser.github_username || null,
      } : null,
    };
  });

  res.json({
    repo: team.github_repo,
    page,
    perPage,
    commits: enrichedCommits,
  });
});

module.exports = {
  createTeam,
  addMember,
  getTeams,
  joinTeam,
  deleteTeam,
  updateTeamJoinRequest,
  getTeamById,
  linkGithubRepo,
  getTeamCommits,
};

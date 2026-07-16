const asyncHandler = require('../middleware/asyncHandler');
const { supabase } = require('../lib/repo');

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

  // Trigger Notification to Added Member
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

    // Trigger Notification for approval
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
    // Notify about decline
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

module.exports = { createTeam, addMember, getTeams, joinTeam, deleteTeam, updateTeamJoinRequest, getTeamById };

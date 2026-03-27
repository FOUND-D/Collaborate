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

const canManageTeam = (team, userId, orgMembership) => {
  if (!team || !userId) return false;
  if (team.owner_id === userId) return true;
  return Boolean(
    team.organisation_id &&
    (
      orgMembership?.org_roles?.can_manage_teams ||
      ['owner', 'admin'].includes(String(orgMembership?.org_roles?.slug || orgMembership?.role || '').toLowerCase())
    )
  );
};

const hydrateTeam = async (team, viewerId = null) => {
  const [{ data: owner }, { data: members }, { data: requests }, { data: projects }] = await Promise.all([
    supabase.from('users').select('id,name,email').eq('id', team.owner_id).maybeSingle(),
    supabase.from('team_members').select('users(id,name,email)').eq('team_id', team.id),
    supabase.from('team_join_requests').select('users(id,name,email)').eq('team_id', team.id),
    supabase.from('projects').select('*').eq('team_id', team.id),
  ]);
  const viewerMembership = viewerId && team.organisation_id
    ? await getOrgMembership(team.organisation_id, viewerId)
    : null;
  return {
    _id: team.id,
    name: team.name,
    owner: owner ? { _id: owner.id, name: owner.name, email: owner.email } : null,
    members: (members || []).map((r) => r.users).filter(Boolean).map((u) => ({ _id: u.id, name: u.name, email: u.email })),
    pendingJoinRequests: (requests || []).map((r) => r.users).filter(Boolean).map((u) => ({ _id: u.id, name: u.name, email: u.email })),
    projects: projects || [],
    organisation: team.organisation_id,
    permissions: {
      canManageMembers: canManageTeam(team, viewerId, viewerMembership),
      canManageProjects: canManageTeam(team, viewerId, viewerMembership),
    },
  };
};

const getTeamById = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('teams').select('*').eq('id', req.params.id).maybeSingle();
  if (error || !data) return res.status(404).json({ message: 'Team not found' });
  res.json(await hydrateTeam(data, req.user._id));
});

const createTeam = asyncHandler(async (req, res) => {
  const { name, organisation } = req.body;
  if (!organisation) {
    return res.status(400).json({ message: 'Join or create an organisation before creating a team' });
  }

  const orgMembership = await getOrgMembership(organisation, req.user._id);
  if (!orgMembership) {
    return res.status(403).json({ message: 'You must be part of this organisation before creating a team' });
  }
  const canManageTeams = Boolean(
    orgMembership?.org_roles?.can_manage_teams ||
    ['owner', 'admin'].includes(String(orgMembership?.org_roles?.slug || orgMembership?.role || '').toLowerCase())
  );
  if (!canManageTeams) {
    return res.status(403).json({ message: 'Your organisation role does not allow team management' });
  }

  const { data, error } = await supabase.from('teams').insert({ name, owner_id: req.user._id, organisation_id: organisation || null }).select('*').single();
  if (error) throw error;
  await supabase.from('team_members').insert({ team_id: data.id, user_id: req.user._id });
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

  const orgMembership = await getOrgMembership(team.organisation_id, req.user._id);
  if (!canManageTeam(team, req.user._id, orgMembership)) {
    return res.status(403).json({ message: 'Only team managers can add members' });
  }

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
  res.json(await hydrateTeam(team, req.user._id));
});

const joinTeam = asyncHandler(async (req, res) => {
  const { data: team, error: teamError } = await supabase.from('teams').select('*').eq('id', req.params.id).maybeSingle();
  if (teamError || !team) return res.status(404).json({ message: 'Team not found' });

  if (team.organisation_id) {
    const orgMembership = await getOrgMembership(team.organisation_id, req.user._id);
    if (!orgMembership) {
      return res.status(403).json({ message: 'Join this organisation before requesting access to its teams' });
    }
  }

  await supabase.from('team_join_requests').upsert({ team_id: req.params.id, user_id: req.user._id });
  res.json({ message: 'Join request sent successfully' });
});

const deleteTeam = asyncHandler(async (req, res) => {
  const { data: team, error: teamError } = await supabase.from('teams').select('*').eq('id', req.params.id).maybeSingle();
  if (teamError || !team) return res.status(404).json({ message: 'Team not found' });

  const orgMembership = await getOrgMembership(team.organisation_id, req.user._id);
  if (!canManageTeam(team, req.user._id, orgMembership)) {
    return res.status(403).json({ message: 'Only team managers can delete this team' });
  }

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

  const orgMembership = await getOrgMembership(team.organisation_id, req.user._id);
  if (!canManageTeam(team, req.user._id, orgMembership)) {
    return res.status(403).json({ message: 'Only team managers can review join requests' });
  }

  await supabase.from('team_join_requests').delete().eq('team_id', req.params.id).eq('user_id', userId);
  if (action === 'approve') {
    if (team.organisation_id) {
      const targetMembership = await getOrgMembership(team.organisation_id, userId);
      if (!targetMembership) {
        return res.status(400).json({ message: 'Only members of this organisation can join this team' });
      }
    }
    await supabase.from('team_members').insert({ team_id: req.params.id, user_id: userId });
  }
  res.json({ message: `User join request ${action}d` });
});

module.exports = { createTeam, addMember, getTeams, joinTeam, deleteTeam, updateTeamJoinRequest, getTeamById };

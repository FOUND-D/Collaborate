const asyncHandler = require('../middleware/asyncHandler');
const { supabase } = require('../lib/repo');

const hydrateTeam = async (team) => {
  const [{ data: owner }, { data: members }, { data: requests }, { data: projects }] = await Promise.all([
    supabase.from('users').select('id,name,email').eq('id', team.owner_id).maybeSingle(),
    supabase.from('team_members').select('users(id,name,email)').eq('team_id', team.id),
    supabase.from('team_join_requests').select('users(id,name,email)').eq('team_id', team.id),
    supabase.from('projects').select('*').eq('team_id', team.id),
  ]);
  return {
    _id: team.id,
    name: team.name,
    owner: owner ? { _id: owner.id, name: owner.name, email: owner.email } : null,
    members: (members || []).map((r) => r.users).filter(Boolean).map((u) => ({ _id: u.id, name: u.name, email: u.email })),
    pendingJoinRequests: (requests || []).map((r) => r.users).filter(Boolean).map((u) => ({ _id: u.id, name: u.name, email: u.email })),
    projects: projects || [],
    organisation: team.organisation_id,
  };
};

const getTeamById = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('teams').select('*').eq('id', req.params.id).maybeSingle();
  if (error || !data) return res.status(404).json({ message: 'Team not found' });
  res.json(await hydrateTeam(data));
});

const createTeam = asyncHandler(async (req, res) => {
  const { name, organisation } = req.body;
  const { data, error } = await supabase.from('teams').insert({ name, owner_id: req.user._id, organisation_id: organisation || null }).select('*').single();
  if (error) throw error;
  await supabase.from('team_members').insert({ team_id: data.id, user_id: req.user._id });
  res.status(201).json(await hydrateTeam(data));
});

const getTeams = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('teams').select('*').or(`owner_id.eq.${req.user._id},team_members.user_id.eq.${req.user._id}`);
  if (error) throw error;
  const teams = [];
  for (const team of data || []) teams.push(await hydrateTeam(team));
  res.json(teams);
});

const addMember = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const { data: team } = await supabase.from('teams').select('*').eq('id', req.params.id).single();
  if (team.owner_id !== req.user._id) return res.status(401).json({ message: 'Only the team owner can add members' });
  await supabase.from('team_members').insert({ team_id: team.id, user_id: userId });
  res.json(await hydrateTeam(team));
});

const joinTeam = asyncHandler(async (req, res) => {
  await supabase.from('team_join_requests').upsert({ team_id: req.params.id, user_id: req.user._id });
  res.json({ message: 'Join request sent successfully' });
});

const deleteTeam = asyncHandler(async (req, res) => {
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
  await supabase.from('team_join_requests').delete().eq('team_id', req.params.id).eq('user_id', userId);
  if (action === 'approve') await supabase.from('team_members').insert({ team_id: req.params.id, user_id: userId });
  res.json({ message: `User join request ${action}d` });
});

module.exports = { createTeam, addMember, getTeams, joinTeam, deleteTeam, updateTeamJoinRequest, getTeamById };

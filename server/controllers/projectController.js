const asyncHandler = require('../middleware/asyncHandler');
const Groq = require('groq-sdk');
const { supabase } = require('../lib/repo');
const dotenv = require('dotenv');
dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

const canManageFromOrgMembership = (orgMembership) => Boolean(
  orgMembership?.org_roles?.can_manage_teams ||
  ['owner', 'admin'].includes(String(orgMembership?.org_roles?.slug || orgMembership?.role || '').toLowerCase())
);

const getManagedTeam = async (teamId, userId) => {
  if (!teamId) return { team: null, organisationId: null };
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .maybeSingle();
  if (teamError) throw teamError;
  if (!team) return { team: null, organisationId: null };

  const { data: membership, error: membershipError } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .maybeSingle();
  if (membershipError) throw membershipError;

  const orgMembership = await getOrgMembership(team.organisation_id, userId);
  const canManageFromOrg = canManageFromOrgMembership(orgMembership);

  return {
    team,
    organisationId: team.organisation_id || null,
    canAccess: Boolean(membership || canManageFromOrg || team.owner_id === userId),
    canManage: Boolean(canManageFromOrg || team.owner_id === userId),
  };
};

const resolveProjectContext = async (req) => {
  const teamContext = await getManagedTeam(req.body.teamId || null, req.user._id);
  const organisationId = teamContext.organisationId || req.body.organisationId || null;

  if (!organisationId) {
    return { error: { status: 400, message: 'Join or create an organisation before creating a project' } };
  }

  const orgMembership = await getOrgMembership(organisationId, req.user._id);
  if (!orgMembership) {
    return { error: { status: 403, message: 'You must be part of this organisation before creating a project' } };
  }

  if (req.body.teamId && !teamContext.team) {
    return { error: { status: 404, message: 'Selected team not found' } };
  }

  if (req.body.teamId && !teamContext.canAccess) {
    return { error: { status: 403, message: 'You do not have access to create projects for this team' } };
  }

  if (req.body.teamId && teamContext.organisationId && req.body.organisationId && teamContext.organisationId !== req.body.organisationId) {
    return { error: { status: 400, message: 'The selected team belongs to a different organisation' } };
  }

  return { organisationId, teamId: req.body.teamId || null };
};

const getProjects = asyncHandler(async (req, res) => {
  // Get teams user is member of
  const [{ data: teamMembers, error: teamError }, { data: orgMembers, error: orgError }] = await Promise.all([
    supabase.from('team_members').select('team_id').eq('user_id', req.user._id),
    supabase.from('organisation_members').select('organisation_id').eq('user_id', req.user._id),
  ]);

  if (teamError) throw teamError;
  if (orgError) throw orgError;

  const teamIds = (teamMembers || []).map((tm) => tm.team_id).filter(Boolean);
  const orgIds = (orgMembers || []).map((member) => member.organisation_id).filter(Boolean);

  const filters = [`owner_id.eq.${req.user._id}`];
  if (teamIds.length > 0) filters.push(`team_id.in.(${teamIds.join(',')})`);
  if (orgIds.length > 0) filters.push(`organisation_id.in.(${orgIds.join(',')})`);

  let query = supabase.from('projects').select('*').or(filters.join(','));

  const { data, error } = await query;
  if (error) throw error;
  res.json(data || []);
});

const createProject = asyncHandler(async (req, res) => {
  const context = await resolveProjectContext(req);
  if (context.error) {
    return res.status(context.error.status).json({ message: context.error.message });
  }

  const { data, error } = await supabase.from('projects').insert({
    name: req.body.name,
    goal: req.body.goal,
    due_date: req.body.dueDate || null,
    team_id: context.teamId,
    organisation_id: context.organisationId,
    owner_id: req.user._id,
  }).select('*').single();
  if (error) throw error;
  res.status(201).json(data);
});

const updateProject = asyncHandler(async (req, res) => {
  const { data: existing, error: existingError } = await supabase.from('projects').select('*').eq('id', req.params.id).maybeSingle();
  if (existingError) throw existingError;
  if (!existing) return res.status(404).json({ message: 'Project not found' });

  const teamContext = await getManagedTeam(existing.team_id, req.user._id);
  const orgMembership = await getOrgMembership(existing.organisation_id, req.user._id);
  const canManage = existing.owner_id === req.user._id || teamContext.canManage || canManageFromOrgMembership(orgMembership);
  if (!canManage) {
    return res.status(403).json({ message: 'You do not have permission to update this project' });
  }

  let nextTeamId = existing.team_id;
  let nextOrganisationId = existing.organisation_id;

  if (req.body.teamId !== undefined) {
    if (!req.body.teamId) {
      nextTeamId = null;
    } else {
      const nextTeamContext = await getManagedTeam(req.body.teamId, req.user._id);
      if (!nextTeamContext.team) {
        return res.status(404).json({ message: 'Selected team not found' });
      }
      if (!nextTeamContext.canAccess) {
        return res.status(403).json({ message: 'You do not have access to assign this team' });
      }
      if (nextOrganisationId && nextTeamContext.organisationId && nextOrganisationId !== nextTeamContext.organisationId) {
        return res.status(400).json({ message: 'The selected team belongs to a different organisation' });
      }
      nextTeamId = req.body.teamId;
      nextOrganisationId = nextTeamContext.organisationId || nextOrganisationId;
    }
  }

  const { data, error } = await supabase.from('projects').update({
    name: req.body.name,
    goal: req.body.goal,
    due_date: req.body.dueDate || null,
    team_id: nextTeamId,
    organisation_id: nextOrganisationId,
  }).eq('id', req.params.id).select('*').single();
  if (error) throw error;
  res.json(data);
});

const deleteProject = asyncHandler(async (req, res) => {
  const { data: existing, error: existingError } = await supabase.from('projects').select('*').eq('id', req.params.id).maybeSingle();
  if (existingError) throw existingError;
  if (!existing) return res.status(404).json({ message: 'Project not found' });

  const teamContext = await getManagedTeam(existing.team_id, req.user._id);
  const orgMembership = await getOrgMembership(existing.organisation_id, req.user._id);
  const canManage = existing.owner_id === req.user._id || teamContext.canManage || canManageFromOrgMembership(orgMembership);
  if (!canManage) {
    return res.status(403).json({ message: 'You do not have permission to delete this project' });
  }

  await supabase.from('tasks').delete().eq('project_id', req.params.id);
  await supabase.from('projects').delete().eq('id', req.params.id);
  res.json({ message: 'Project removed' });
});

const getProjectById = asyncHandler(async (req, res) => {
  const { data } = await supabase.from('projects').select('*').eq('id', req.params.id).maybeSingle();
  if (!data) return res.status(404).json({ message: 'Project not found' });
  const teamContext = await getManagedTeam(data.team_id, req.user._id);
  const orgMembership = await getOrgMembership(data.organisation_id, req.user._id);
  const canAccess = data.owner_id === req.user._id || teamContext.canAccess || Boolean(orgMembership);
  if (!canAccess) {
    return res.status(403).json({ message: 'You do not have access to this project' });
  }
  res.json(data);
});

const createProjectWithAI = asyncHandler(async (req, res) => {
  const { name, goal, dueDate, teamId, techStack } = req.body;
  const context = await resolveProjectContext(req);
  if (context.error) {
    return res.status(context.error.status).json({ message: context.error.message });
  }
  const chatCompletion = await groq.chat.completions.create({ messages: [{ role: 'user', content: `Generate JSON tasks for project: ${goal}` }], model: 'openai/gpt-oss-120b', response_format: { type: 'json_object' } });
  const roadmap = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
  const project = await supabase.from('projects').insert({
    name,
    goal,
    due_date: dueDate || null,
    team_id: context.teamId,
    organisation_id: context.organisationId,
    owner_id: req.user._id,
  }).select('*').single();
  if (project.error) throw project.error;
  res.status(201).json({ ...project.data, roadmap, techStack });
});

module.exports = { getProjects, createProjectWithAI, getProjectById, deleteProject, createProject, updateProject };

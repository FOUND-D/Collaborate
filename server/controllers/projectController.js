const asyncHandler = require('../middleware/asyncHandler');
const Groq = require('groq-sdk');
const { supabase } = require('../lib/repo');
const { sendNotification } = require('../services/notificationService');
const dotenv = require('dotenv');
const { toPublicTask } = require('./taskController');
dotenv.config();

const toPublicProject = (project) => {
  if (!project) return null;
  return {
    ...project,
    _id: project.id,
    dueDate: project.due_date || null,
  };
};
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

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
  console.log(`[resolveProjectContext] req.body:`, req.body);
  const teamContext = await getManagedTeam(req.body.teamId || null, req.user._id);
  const organisationId = teamContext.organisationId || req.body.organisationId || null;
  console.log(`[resolveProjectContext] organisationId resolved to:`, organisationId);

  if (!organisationId) {
    console.error(`[resolveProjectContext] ERROR 400: No organisationId provided. req.body.organisationId=${req.body.organisationId}`);
    return { error: { status: 400, message: 'Join or create an organisation before creating a project' } };
  }

  const orgMembership = await getOrgMembership(organisationId, req.user._id);
  if (!orgMembership) {
    console.error(`[resolveProjectContext] ERROR 403: User is not part of organisation ${organisationId}`);
    return { error: { status: 403, message: 'You must be part of this organisation before creating a project' } };
  }

  if (req.body.teamId && !teamContext.team) {
    console.error(`[resolveProjectContext] ERROR 404: Selected team not found ${req.body.teamId}`);
    return { error: { status: 404, message: 'Selected team not found' } };
  }

  if (req.body.teamId && !teamContext.canAccess) {
    return { error: { status: 403, message: 'You do not have access to create projects for this team' } };
  }

  if (req.body.teamId && teamContext.organisationId && req.body.organisationId && teamContext.organisationId !== req.body.organisationId) {
    console.error(`[resolveProjectContext] ERROR 400: Team belongs to different org. teamOrg=${teamContext.organisationId}, bodyOrg=${req.body.organisationId}`);
    return { error: { status: 400, message: 'The selected team belongs to a different organisation' } };
  }

  return { organisationId, teamId: req.body.teamId || null };
};

const getProjects = asyncHandler(async (req, res) => {
  console.log(`[getProjects] Fetching projects for user: ${req.user._id}`);
  
  // Get teams and organisations user is member of
  const [{ data: teamMembers, error: teamError }, { data: orgMembers, error: orgError }] = await Promise.all([
    supabase.from('team_members').select('team_id').eq('user_id', req.user._id),
    supabase.from('organisation_members').select('organisation_id').eq('user_id', req.user._id),
  ]);

  if (teamError) {
    console.error('[getProjects] team_members error:', teamError);
    throw teamError;
  }
  if (orgError) {
    console.error('[getProjects] organisation_members error:', orgError);
    throw orgError;
  }

  const teamIds = (teamMembers || []).map((tm) => tm.team_id).filter(Boolean);
  const orgIds = (orgMembers || []).map((member) => member.organisation_id).filter(Boolean);
  
  console.log(`[getProjects] User is in ${teamIds.length} teams and ${orgIds.length} organisations`);

  const filters = [`owner_id.eq.${req.user._id}`];
  if (teamIds.length > 0) filters.push(`team_id.in.(${teamIds.join(',')})`);
  if (orgIds.length > 0) filters.push(`organisation_id.in.(${orgIds.join(',')})`);

  const filterString = filters.join(',');
  console.log(`[getProjects] Applying OR filters: ${filterString}`);

  const { data, error } = await supabase.from('projects').select('*').or(filterString);
  
  if (error) {
    console.error('[getProjects] projects query error:', error);
    throw error;
  }
  
  console.log(`[getProjects] Found ${data?.length || 0} projects`);
  res.json((data || []).map(toPublicProject));
});

const createProject = asyncHandler(async (req, res) => {
  console.log(`[createProject] Started for user ${req.user._id}`);
  const context = await resolveProjectContext(req);
  if (context.error) {
    console.log(`[createProject] Context returned error:`, context.error);
    return res.status(context.error.status).json({ message: context.error.message });
  }

  const { data, error } = await supabase.from('projects').insert({
    name: req.body.name,
    goal: req.body.goal || '',
    due_date: req.body.dueDate || null,
    team_id: context.teamId,
    organisation_id: context.organisationId,
    owner_id: req.user._id,
  }).select('*').single();
  if (error) throw error;
  
  try {
    let userIdsToNotify = [];
    if (context.teamId) {
      const { data: members } = await supabase.from('team_members').select('user_id').eq('team_id', context.teamId);
      if (members) userIdsToNotify = members.map(m => m.user_id);
    } else {
      const { data: members } = await supabase.from('organisation_members').select('user_id').eq('organisation_id', context.organisationId);
      if (members) userIdsToNotify = members.map(m => m.user_id);
    }
    
    const creatorName = req.user.name || 'Someone';
    for (const uid of userIdsToNotify) {
      await sendNotification(req.app.get('io'), {
        userId: uid,
        title: 'New Project',
        message: `${creatorName} created a new project: ${req.body.name}`,
        type: 'general',
        data: { projectId: data.id }
      });
    }
  } catch (err) {
    console.error('Notification failed:', err);
  }

  res.status(201).json(toPublicProject(data));
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
  res.json(toPublicProject(data));
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
  const { data, error } = await supabase
    .from('projects')
    .select('*, owner:users(id, name, email), team:teams(id, name), tasks(*, assignee:users!tasks_assignee_id_fkey(id, name, email))')
    .eq('id', req.params.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return res.status(404).json({ message: 'Project not found' });

  const teamContext = await getManagedTeam(data.team_id, req.user._id);
  const orgMembership = await getOrgMembership(data.organisation_id, req.user._id);
  const canAccess = data.owner_id === req.user._id || teamContext.canAccess || Boolean(orgMembership);
  if (!canAccess) {
    return res.status(403).json({ message: 'You do not have access to this project' });
  }

  // Build task hierarchy
  if (data.tasks && data.tasks.length > 0) {
    const taskMap = {};
    const rootTasks = [];

    // First pass: create mapping and initialize subTasks array using formatted tasks
    data.tasks.forEach(task => {
      taskMap[task.id] = { ...toPublicTask(task), subTasks: [] };
    });

    // Second pass: associate child tasks with parents
    data.tasks.forEach(task => {
      const mappedTask = taskMap[task.id];
      if (mappedTask) {
        if (task.parent_id && taskMap[task.parent_id]) {
          taskMap[task.parent_id].subTasks.push(mappedTask);
        } else {
          rootTasks.push(mappedTask);
        }
      }
    });

    data.tasks = rootTasks;
  } else {
    data.tasks = [];
  }

  res.json(toPublicProject(data));
});

const createProjectWithAI = asyncHandler(async (req, res) => {
  const { name, goal, dueDate, teamId, techStack } = req.body;
  const context = await resolveProjectContext(req);
  if (context.error) {
    return res.status(context.error.status).json({ message: context.error.message });
  }

  if (!groq) {
    return res.status(503).json({ message: 'AI Project Creation is currently unavailable (Missing API Key)' });
  }

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an expert project manager. You generate detailed project roadmaps in structured JSON format.'
      },
      {
        role: 'user',
        content: `Generate a JSON object representing a project plan for the goal: "${goal}".
The JSON object MUST contain "challenge", "solution", and "tasks" fields at the root level.

Specifically:
1. "challenge": A concise description of the key problem/challenge that needs to be solved.
2. "solution": A concise explanation of the proposed solution and how it will work.
3. "tasks": An array of tasks. Each task should have:
   - name: string (short, clear name)
   - description: string (informative, action-oriented)
   - duration: number (integer representing duration in days, default to 1 if unsure)
   - priority: string (MUST be exactly "Low", "Medium", or "High")
   - subtasks: array of task objects with the same structure (optional, nesting up to 2-3 levels is fine)

Example format:
{
  "challenge": "Manual fee processing is time-consuming and error-prone for schools.",
  "solution": "An automated school website with fee integration.",
  "tasks": [
    {
      "name": "Database Setup",
      "description": "Create schema and initialize tables",
      "duration": 2,
      "priority": "High",
      "subtasks": [
        {
          "name": "Design Schema",
          "description": "Draft DB diagram and relational mappings",
          "duration": 1,
          "priority": "High"
        }
      ]
    }
  ]
}`
      }
    ],
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' }
  });

  let roadmap = {};
  try {
    roadmap = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
  } catch (parseErr) {
    console.error('Failed to parse Groq AI response as JSON:', parseErr);
    console.log('Raw output:', chatCompletion.choices[0]?.message?.content);
    return res.status(500).json({ message: 'Failed to generate a valid project roadmap. Please try again.' });
  }

  // Determine a structured goal description for the DB
  let projectGoal = goal;
  if (roadmap.challenge && roadmap.solution) {
    projectGoal = `Challenge: ${roadmap.challenge.trim()}\n\nSolution: ${roadmap.solution.trim()}`;
  } else {
    // Fallback if keys are missing
    projectGoal = `Challenge: ${goal}\n\nSolution: Plan to be developed based on goal.`;
  }

  const project = await supabase.from('projects').insert({
    name,
    goal: projectGoal,
    due_date: dueDate || null,
    team_id: context.teamId,
    organisation_id: context.organisationId,
    owner_id: req.user._id,
  }).select('*').single();

  if (project.error) throw project.error;

  // Extract tasks robustly from response structure
  let taskData = [];
  if (Array.isArray(roadmap.tasks)) {
    taskData = roadmap.tasks;
  } else if (roadmap.project && Array.isArray(roadmap.project.tasks)) {
    taskData = roadmap.project.tasks;
  } else if (Array.isArray(roadmap)) {
    taskData = roadmap;
  }

  // Helper to recursively insert tasks in Supabase
  const insertTasks = async (tasksList, projectId, teamId, ownerId, parentId = null) => {
    for (const task of tasksList) {
      const taskName = (task.name || 'Unnamed Task').trim();
      const taskDescription = (task.description || '').trim();
      
      // Ensure duration is a valid integer
      let duration = parseInt(task.duration, 10);
      if (isNaN(duration) || duration <= 0) {
        duration = 1;
      }

      // Map priority case-insensitively to match postgres Check Constraints
      const rawPriority = String(task.priority || 'Medium').trim().toLowerCase();
      let priority = 'Medium';
      if (rawPriority === 'high') {
        priority = 'High';
      } else if (rawPriority === 'low') {
        priority = 'Low';
      }

      const { data: createdTask, error: insertError } = await supabase
        .from('tasks')
        .insert({
          name: taskName,
          description: taskDescription,
          duration,
          status: 'pending',
          priority,
          project_id: projectId,
          team_id: teamId || null,
          parent_id: parentId,
          owner_id: ownerId,
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('Error inserting AI task in database:', insertError);
        console.error('Attempted task payload:', {
          name: taskName,
          duration,
          priority,
          project_id: projectId,
          parent_id: parentId
        });
        continue;
      }

      const subtasksList = task.subtasks || task.subTasks;
      if (Array.isArray(subtasksList) && subtasksList.length > 0) {
        await insertTasks(subtasksList, projectId, teamId, ownerId, createdTask.id);
      }
    }
  };

  if (Array.isArray(taskData) && taskData.length > 0) {
    await insertTasks(taskData, project.data.id, context.teamId, req.user._id);
  } else {
    console.warn('AI generated no tasks or tasks were in an unexpected format. Roadmap keys:', Object.keys(roadmap));
  }

  try {
    sendNotification(req.app.get('io'), {
      userId: req.user._id,
      title: 'AI Project Created',
      message: `Created ${projectName} project with AI roadmap.`,
      type: 'general',
      data: { projectId: project.data.id }
    });
  } catch (err) {
    console.error('Notification failed:', err);
  }

  res.status(201).json({ ...toPublicProject(project.data), roadmap, techStack });
});

module.exports = { getProjects, createProjectWithAI, getProjectById, deleteProject, createProject, updateProject };

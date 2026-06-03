const asyncHandler = require('../middleware/asyncHandler');
const { supabase } = require('../lib/repo');

const buildTaskPayload = (body, userId, { includeOwner = false, assignedBy = false } = {}) => {
  const payload = { ...body };
  if (includeOwner) payload.owner_id = userId;
  if (assignedBy) payload.assigned_by = userId;

  // Map client fields to database columns
  if (body.assignee !== undefined) {
    payload.assignee_id = body.assignee || null;
  }
  if (body.project !== undefined) {
    payload.project_id = body.project || null;
  }
  if (body.team !== undefined) {
    payload.team_id = body.team || null;
  }
  if (body.teamId !== undefined) {
    payload.team_id = body.teamId || null;
  }
  if (body.projectId !== undefined) {
    payload.project_id = body.projectId || null;
  }
  if (body.category !== undefined) {
    payload.category = body.category || null;
  }
  if (body.dueDate !== undefined || body.due_date !== undefined) {
    payload.due_date = body.dueDate || body.due_date || null;
  }

  // Explicitly delete all client-only/temporary keys to prevent PostgREST column schema cache errors
  const keysToDelete = [
    'assignee',
    'project',
    'team',
    'teamId',
    'projectId',
    'dueDate',
    'duedate',
    'dependencies',
    '_id',
    'subTasks',
    'subtasks'
  ];
  
  keysToDelete.forEach(key => {
    delete payload[key];
  });

  return payload;
};

const createTask = asyncHandler(async (req, res) => {
  const payload = buildTaskPayload(req.body, req.user._id, { includeOwner: true, assignedBy: true });
  const { data, error } = await supabase.from('tasks').insert(payload).select('*').single();
  if (error) throw error;
  if (Array.isArray(req.body.dependencies)) {
    await supabase.from('task_dependencies').insert(req.body.dependencies.map((dependencyId) => ({ task_id: data.id, depends_on_task_id: dependencyId })));
  }
  if (data.team_id) {
    req.io?.to(data.team_id).emit('taskCreated', data);
  }
  res.status(201).json(data);
});

const getTasks = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('tasks').select('*').or(`assignee_id.eq.${req.user._id},owner_id.eq.${req.user._id}`);
  if (error) throw error;
  res.json(data || []);
});

const getTaskById = asyncHandler(async (req, res) => {
  const { data } = await supabase.from('tasks').select('*').eq('id', req.params.id).maybeSingle();
  if (!data) return res.status(404).json({ message: 'Task not found' });
  res.json(data);
});

const updateTask = asyncHandler(async (req, res) => {
  const payload = buildTaskPayload(req.body, req.user._id);
  const { data, error } = await supabase.from('tasks').update(payload).eq('id', req.params.id).select('*').single();
  if (error) throw error;
  if (data.team_id) {
    req.io?.to(data.team_id).emit('taskUpdated', data);
  }
  res.json(data);
});

const assignTaskToTeam = asyncHandler(async (req, res) => {
  const { teamId, name } = req.body;
  if (!teamId || !name) {
    return res.status(400).json({ message: 'teamId and name are required' });
  }

  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('team_id', teamId);
  if (membersError) throw membersError;
  if (!members?.length) {
    return res.status(404).json({ message: 'No team members found' });
  }

  const basePayload = buildTaskPayload(req.body, req.user._id, { includeOwner: true, assignedBy: true });
  const rows = members.map((member) => ({
    ...basePayload,
    assignee_id: member.user_id,
    team_id: teamId,
  }));

  const { data, error } = await supabase.from('tasks').insert(rows).select('*');
  if (error) throw error;

  req.io?.to(teamId).emit('teamTasksAssigned', data || []);
  res.status(201).json(data || []);
});

const deleteTask = asyncHandler(async (req, res) => {
  await supabase.from('task_dependencies').delete().eq('task_id', req.params.id);
  await supabase.from('tasks').delete().eq('id', req.params.id);
  res.json({ message: 'Task removed' });
});

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask, assignTaskToTeam };

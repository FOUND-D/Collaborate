const asyncHandler = require('../middleware/asyncHandler');
const { supabase } = require('../lib/repo');
const { sendNotification } = require('../services/notificationService');

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

const toPublicTask = (task) => {
  if (!task) return null;
  return {
    ...task,
    _id: task.id,
    dueDate: task.due_date || task.commitment_timestamp || null,
    due_date: task.due_date || task.commitment_timestamp || null,
  };
};

const createTask = asyncHandler(async (req, res) => {
  const payload = buildTaskPayload(req.body, req.user._id, { includeOwner: true, assignedBy: true });
  const { data, error } = await supabase.from('tasks').insert(payload).select('*').single();
  if (error) throw error;
  if (Array.isArray(req.body.dependencies)) {
    await supabase.from('task_dependencies').insert(req.body.dependencies.map((dependencyId) => ({ task_id: data.id, depends_on_task_id: dependencyId })));
  }
  const publicTask = toPublicTask(data);
  if (data.team_id) {
    req.io?.to(data.team_id).emit('taskCreated', publicTask);
  }

  // Trigger Notification to Assignee
  const currentUserId = req.user.id || req.user._id;
  if (data.assignee_id && data.assignee_id !== currentUserId) {
    sendNotification(req.io, {
      userId: data.assignee_id,
      title: 'New Task Assigned',
      message: `You have been assigned the task: "${data.name}"`,
      type: 'task_assigned',
      data: { taskId: data.id, projectId: data.project_id, teamId: data.team_id }
    });
  }

  res.status(201).json(publicTask);
});

const getTasks = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('tasks').select('*').or(`assignee_id.eq.${req.user._id},owner_id.eq.${req.user._id}`);
  if (error) throw error;
  res.json((data || []).map(toPublicTask));
});

const getTaskById = asyncHandler(async (req, res) => {
  const { data } = await supabase.from('tasks').select('*').eq('id', req.params.id).maybeSingle();
  if (!data) return res.status(404).json({ message: 'Task not found' });
  res.json(toPublicTask(data));
});

const updateTask = asyncHandler(async (req, res) => {
  const payload = buildTaskPayload(req.body, req.user._id);
  const { data, error } = await supabase.from('tasks').update(payload).eq('id', req.params.id).select('*').single();
  if (error) throw error;
  const publicTask = toPublicTask(data);
  if (data.team_id) {
    req.io?.to(data.team_id).emit('taskUpdated', publicTask);
  }

  // Trigger Notification to Assignee on Update
  const currentUserId = req.user.id || req.user._id;
  if (data.assignee_id && data.assignee_id !== currentUserId) {
    sendNotification(req.io, {
      userId: data.assignee_id,
      title: 'Task Updated',
      message: `The task "${data.name}" assigned to you has been updated (Status: ${data.status}).`,
      type: 'task_updated',
      data: { taskId: data.id, projectId: data.project_id, teamId: data.team_id }
    });
  }

  res.json(publicTask);
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

  const publicTasks = (data || []).map(toPublicTask);
  req.io?.to(teamId).emit('teamTasksAssigned', publicTasks);
  res.status(201).json(publicTasks);
});

const deleteTask = asyncHandler(async (req, res) => {
  await supabase.from('task_dependencies').delete().eq('task_id', req.params.id);
  await supabase.from('tasks').delete().eq('id', req.params.id);
  res.json({ message: 'Task removed' });
});

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask, assignTaskToTeam, toPublicTask };

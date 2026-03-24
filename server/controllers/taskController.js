const asyncHandler = require('../middleware/asyncHandler');
const { supabase } = require('../lib/repo');

const createTask = asyncHandler(async (req, res) => {
  const payload = { ...req.body, owner_id: req.user._id };
  const { data, error } = await supabase.from('tasks').insert(payload).select('*').single();
  if (error) throw error;
  if (Array.isArray(req.body.dependencies)) {
    await supabase.from('task_dependencies').insert(req.body.dependencies.map((dependencyId) => ({ task_id: data.id, depends_on_task_id: dependencyId })));
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
  const { data, error } = await supabase.from('tasks').update(req.body).eq('id', req.params.id).select('*').single();
  if (error) throw error;
  res.json(data);
});

const deleteTask = asyncHandler(async (req, res) => {
  await supabase.from('task_dependencies').delete().eq('task_id', req.params.id);
  await supabase.from('tasks').delete().eq('id', req.params.id);
  res.json({ message: 'Task removed' });
});

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask };

const asyncHandler = require('../middleware/asyncHandler');
const Groq = require('groq-sdk');
const { supabase } = require('../lib/repo');
const dotenv = require('dotenv');
dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getProjects = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('projects').select('*').eq('owner_id', req.user._id);
  if (error) throw error;
  res.json(data || []);
});

const createProject = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('projects').insert({ name: req.body.name, goal: req.body.goal, due_date: req.body.dueDate || null, team_id: req.body.teamId || null, owner_id: req.user._id }).select('*').single();
  if (error) throw error;
  res.status(201).json(data);
});

const updateProject = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('projects').update({ name: req.body.name, goal: req.body.goal, due_date: req.body.dueDate || null, team_id: req.body.teamId || null }).eq('id', req.params.id).select('*').single();
  if (error) throw error;
  res.json(data);
});

const deleteProject = asyncHandler(async (req, res) => {
  await supabase.from('tasks').delete().eq('project_id', req.params.id);
  await supabase.from('projects').delete().eq('id', req.params.id);
  res.json({ message: 'Project removed' });
});

const getProjectById = asyncHandler(async (req, res) => {
  const { data } = await supabase.from('projects').select('*').eq('id', req.params.id).maybeSingle();
  if (!data) return res.status(404).json({ message: 'Project not found' });
  res.json(data);
});

const createProjectWithAI = asyncHandler(async (req, res) => {
  const { name, goal, dueDate, teamId, techStack } = req.body;
  const chatCompletion = await groq.chat.completions.create({ messages: [{ role: 'user', content: `Generate JSON tasks for project: ${goal}` }], model: 'openai/gpt-oss-120b', response_format: { type: 'json_object' } });
  const roadmap = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
  const project = await supabase.from('projects').insert({ name, goal, due_date: dueDate || null, team_id: teamId || null, owner_id: req.user._id }).select('*').single();
  if (project.error) throw project.error;
  res.status(201).json({ ...project.data, roadmap, techStack });
});

module.exports = { getProjects, createProjectWithAI, getProjectById, deleteProject, createProject, updateProject };

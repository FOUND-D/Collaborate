const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/repo');
const asyncHandler = require('../middleware/asyncHandler');
const { protect } = require('../middleware/authMiddleware');

// @desc    Global search
// @route   GET /api/search
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  const query = req.query.q || '';
  if (!query.trim()) {
    return res.json({ users: [], projects: [], tasks: [], resources: [], teams: [] });
  }

  const [usersRes, projectsRes, tasksRes, resourcesRes, teamsRes] = await Promise.all([
    // Users search (by name or student_id/roll number)
    supabase
      .from('users')
      .select('id, name, email, role, profile_image, student_id, department, dev_score')
      .or(`name.ilike.%${query}%,student_id.ilike.%${query}%`)
      .order('dev_score', { ascending: false })
      .limit(10),

    // Projects search (by name or goal)
    supabase
      .from('projects')
      .select('id, name, goal')
      .or(`name.ilike.%${query}%,goal.ilike.%${query}%`)
      .limit(10),

    // Tasks search (by name)
    supabase
      .from('tasks')
      .select('id, name, project_id, status')
      .ilike('name', `%${query}%`)
      .limit(10),

    // Resources search (by title or description)
    supabase
      .from('resources')
      .select('id, title, description')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10),

    // Teams search (by name)
    supabase
      .from('teams')
      .select('id, name')
      .ilike('name', `%${query}%`)
      .limit(10)
  ]);

  // Format responses to match expected frontend structure (e.g. including _id)
  const users = (usersRes.data || []).map(u => ({
    _id: u.id,
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    profileImage: u.profile_image,
    studentId: u.student_id,
    department: u.department,
    devScore: u.dev_score ?? 0
  }));

  const projects = (projectsRes.data || []).map(p => ({
    _id: p.id,
    id: p.id,
    name: p.name,
    goal: p.goal
  }));

  const tasks = (tasksRes.data || []).map(t => ({
    _id: t.id,
    id: t.id,
    name: t.name,
    projectId: t.project_id,
    status: t.status
  }));

  const resources = (resourcesRes.data || []).map(r => ({
    _id: r.id,
    id: r.id,
    title: r.title,
    description: r.description
  }));

  const teams = (teamsRes.data || []).map(tm => ({
    _id: tm.id,
    id: tm.id,
    name: tm.name
  }));

  res.json({
    users,
    projects,
    tasks,
    resources,
    teams
  });
}));

module.exports = router;

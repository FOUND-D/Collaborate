const { supabase, toPublicResource } = require('../lib/repo');
const asyncHandler = require('../middleware/asyncHandler');
const Groq = require('groq-sdk');
const dotenv = require('dotenv');
dotenv.config();

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// @desc    Get all resources
// @route   GET /api/resources
// @access  Private
const getResources = asyncHandler(async (req, res) => {
  const { team_id, tags, search, page = 1 } = req.query;
  const limit = 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('resources')
    .select('*, users(id, name, profile_image)', { count: 'exact' })
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (team_id) {
    query = query.eq('team_id', team_id);
  } else {
    // If no team_id, show university-wide (null team_id) or user's teams?
    // Requirement says "share with specific team or university-wide".
    // Let's assume university-wide means team_id is null.
    // However, usually we might want to see all public ones.
    // For now, let's just filter by team if provided, else all.
  }

  if (tags) {
    const tagArray = tags.split(',');
    query = query.contains('tags', tagArray);
  }

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) throw error;

  res.json({
    resources: (data || []).map(toPublicResource),
    total: count,
    page: Number(page),
    pages: Math.ceil(count / limit),
  });
});

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Private
const getResourceById = asyncHandler(async (req, res) => {
  // First get the resource
  const { data, error } = await supabase
    .from('resources')
    .select('*, users(id, name, profile_image)')
    .eq('id', req.params.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    res.status(404);
    throw new Error('Resource not found');
  }

  // Increment view_count
  await supabase
    .from('resources')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', req.params.id);

  res.json(toPublicResource(data));
});

// @desc    Create a resource
// @route   POST /api/resources
// @access  Private
const createResource = asyncHandler(async (req, res) => {
  const { title, description, file_url, file_type, tags, team_id } = req.body;

  const { data, error } = await supabase
    .from('resources')
    .insert({
      title,
      description,
      file_url,
      file_type,
      tags: tags || [],
      team_id: team_id || null,
      uploader_id: req.user._id || req.user.id,
    })
    .select('*, users(id, name, profile_image)')
    .single();

  if (error) throw error;

  // Award badge if earned (resource_sharer)
  try {
    const { awardBadgeIfEarned } = require('../services/badgeService');
    await awardBadgeIfEarned(req.user._id || req.user.id, 'resource_upload');
  } catch (err) {
    console.error('Error awarding badge:', err);
  }

  res.status(201).json(toPublicResource(data));
});

// @desc    Summarise resource with AI
// @route   POST /api/resources/:id/summarise
// @access  Private
const summariseResource = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('resources')
    .select('title, description')
    .eq('id', req.params.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    res.status(404);
    throw new Error('Resource not found');
  }

  if (!groq) {
    return res.json({ summary: 'AI summary unavailable (Missing API Key)' });
  }

  const prompt = `Summarise the following resource for a university collaboration platform:
Title: ${data.title}
Description: ${data.description || 'No description provided.'}

Provide a concise, helpful summary in 2-3 sentences.`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama3-8b-8192',
  });

  const summary = chatCompletion.choices[0]?.message?.content || 'Summary generation failed.';

  // Update resource with summary
  const { error: updateError } = await supabase
    .from('resources')
    .update({ ai_summary: summary })
    .eq('id', req.params.id);

  if (updateError) throw updateError;

  res.json({ summary });
});

// @desc    Toggle pin resource
// @route   PATCH /api/resources/:id/pin
// @access  Private/Faculty
const togglePinResource = asyncHandler(async (req, res) => {
  const { data: resource, error: getError } = await supabase
    .from('resources')
    .select('is_pinned')
    .eq('id', req.params.id)
    .maybeSingle();

  if (getError) throw getError;
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  const { data, error } = await supabase
    .from('resources')
    .update({ is_pinned: !resource.is_pinned })
    .eq('id', req.params.id)
    .select('*, users(id, name, profile_image)')
    .single();

  if (error) throw error;

  res.json(toPublicResource(data));
});

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private
const deleteResource = asyncHandler(async (req, res) => {
  const { data: resource, error: getError } = await supabase
    .from('resources')
    .select('uploader_id')
    .eq('id', req.params.id)
    .maybeSingle();

  if (getError) throw getError;
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  // Only uploader or admin can delete
  if (resource.uploader_id !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this resource');
  }

  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', req.params.id);

  if (error) throw error;

  res.json({ message: 'Resource removed' });
});

module.exports = {
  getResources,
  getResourceById,
  createResource,
  summariseResource,
  togglePinResource,
  deleteResource,
};

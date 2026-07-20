const asyncHandler = require('../middleware/asyncHandler');
const supabase = require('../lib/supabase');
const {
  listSkills,
  addUserSkill,
  removeUserSkill,
  getUserSkills,
  getPeerMatches,
} = require('../lib/repo');
const skillSharingService = require('../services/skillSharingService');

const getSkills = asyncHandler(async (req, res) => {
  res.json(await listSkills());
});

const createUserSkill = asyncHandler(async (req, res) => {
  const { skillId, skill_id, name, type = 'can_teach', level } = req.body;

  let finalSkillId = skillId || skill_id;

  if (!finalSkillId && name) {
    // 1. Case-insensitive search for existing skill
    const { data: existing } = await supabase
      .from('skills')
      .select('id, name, category')
      .ilike('name', name.trim())
      .maybeSingle();

    if (existing) {
      // skill exists — use it
      finalSkillId = existing.id;
    } else {
      // skill doesn't exist — create it
      const { data: newSkill, error: insertError } = await supabase
        .from('skills')
        .insert({ name: name.trim(), category: 'General', added_by: req.user.id })
        .select()
        .single();
      if (insertError) return res.status(400).json({ message: insertError.message });
      finalSkillId = newSkill.id;
    }
  }

  if (!finalSkillId) {
    return res.status(400).json({ message: 'skill_id or name is required' });
  }

  // 2. Now insert into user_skills using finalSkillId
  const { data: userSkill, error: upsertError } = await supabase
    .from('user_skills')
    .upsert({
      user_id: req.user._id || req.user.id,
      skill_id: finalSkillId,
      type: type || 'can_teach',
      level: level || null,
    }, { onConflict: 'user_id,skill_id,type' })
    .select('*, skill:skills(*)')
    .single();

  if (upsertError) return res.status(400).json({ message: upsertError.message });

  // Map to public format manually or fetch enriched
  res.status(201).json({
    userId: userSkill.user_id,
    skillId: userSkill.skill_id,
    type: userSkill.type,
    level: userSkill.level,
    skill: userSkill.skill ? {
      id: userSkill.skill.id,
      name: userSkill.skill.name,
      category: userSkill.skill.category
    } : null
  });
});

const deleteUserSkill = asyncHandler(async (req, res) => {
  await removeUserSkill({
    userId: req.user._id || req.user.id,
    skillId: req.params.skillId,
    type: req.query.type || null,
  });
  res.json({ message: 'Skill removed from user profile' });
});

const getSkillsForUser = asyncHandler(async (req, res) => {
  res.json(await getUserSkills(req.params.userId));
});

const getSkillMatches = asyncHandler(async (req, res) => {
  res.json(await getPeerMatches(req.user._id || req.user.id, 5));
});

// @desc    Delete a skill (Admin only)
// @route   DELETE /api/skills/:id
// @access  Private/Admin
const deleteSkill = asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('skills')
    .delete()
    .eq('id', req.params.id);

  if (error) throw error;
  res.json({ message: 'Skill deleted' });
});

const endorseSkill = asyncHandler(async (req, res) => {
  const { userId, skillId } = req.params;
  const { type } = req.body;

  const { data, error } = await supabase
    .from('user_skills')
    .update({ endorsed_by: req.user._id || req.user.id, endorsed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .eq('type', type || 'can_teach')
    .select('*')
    .single();

  if (error) throw error;

  try {
    const { awardBadgeIfEarned } = require('../services/badgeService');
    await awardBadgeIfEarned(userId, 'subject_expert');
  } catch (err) {
    console.error('Error awarding badge:', err);
  }

  res.json({ message: 'Skill endorsed', data });
});

// New skill sharing features
const getGroupedBySkill = asyncHandler(async (req, res) => {
  res.json(await skillSharingService.groupUsersBySkill());
});

const getGroupedByUser = asyncHandler(async (req, res) => {
  res.json(await skillSharingService.groupSkillsByUser());
});

const getMatchmaking = asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId || req.user.id || req.user._id;
  res.json(await skillSharingService.matchSkillsForUser(targetUserId));
});

const filterSkills = asyncHandler(async (req, res) => {
  const skills = req.query.skills ? req.query.skills.split(',') : [];
  const matchAll = req.query.matchAll === 'true';
  const type = req.query.type || null;
  res.json(await skillSharingService.filterUsersBySkills(skills, { matchAll, type }));
});

const getVennDiagram = asyncHandler(async (req, res) => {
  const skillIds = req.query.skillIds ? req.query.skillIds.split(',').filter(Boolean) : [];
  const skillNames = req.query.skills ? req.query.skills.split(',').filter(Boolean) : [];
  const type = req.query.type || null;
  res.json(await skillSharingService.getVennDiagramData({ skillIds, skillNames, type }));
});

module.exports = {
  getSkills,
  createUserSkill,
  deleteUserSkill,
  getSkillsForUser,
  getSkillMatches,
  deleteSkill,
  endorseSkill,
  getGroupedBySkill,
  getGroupedByUser,
  getMatchmaking,
  filterSkills,
  getVennDiagram,
};

const asyncHandler = require('../middleware/asyncHandler');
const {
  listSkills,
  addUserSkill,
  removeUserSkill,
  getUserSkills,
  getPeerMatches,
} = require('../lib/repo');

const getSkills = asyncHandler(async (req, res) => {
  res.json(await listSkills());
});

const createUserSkill = asyncHandler(async (req, res) => {
  const { skillId, skill_id, name, category, type, level } = req.body;

  if (!type || !['can_teach', 'wants_to_learn'].includes(type)) {
    return res.status(400).json({ message: 'type must be can_teach or wants_to_learn' });
  }

  const userSkill = await addUserSkill({
    userId: req.user._id,
    skillId: skillId || skill_id,
    name,
    category,
    type,
    level,
  });

  res.status(201).json(userSkill);
});

const deleteUserSkill = asyncHandler(async (req, res) => {
  await removeUserSkill({
    userId: req.user._id,
    skillId: req.params.skillId,
    type: req.query.type || null,
  });
  res.json({ message: 'Skill removed from user profile' });
});

const getSkillsForUser = asyncHandler(async (req, res) => {
  res.json(await getUserSkills(req.params.userId));
});

const getSkillMatches = asyncHandler(async (req, res) => {
  res.json(await getPeerMatches(req.user._id, 5));
});

module.exports = {
  getSkills,
  createUserSkill,
  deleteUserSkill,
  getSkillsForUser,
  getSkillMatches,
};

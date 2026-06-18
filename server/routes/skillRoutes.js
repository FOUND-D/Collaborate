const express = require('express');
const {
  getSkills,
  createUserSkill,
  deleteUserSkill,
  getSkillsForUser,
  getSkillMatches,
  deleteSkill,
  endorseSkill,
} = require('../controllers/skillController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/orgMiddleware');

const router = express.Router();

router.route('/').get(protect, getSkills);
router.route('/matches').get(protect, getSkillMatches);
router.route('/user').post(protect, createUserSkill);
router.route('/user/:skillId').delete(protect, deleteUserSkill);
router.route('/user/:userId').get(protect, getSkillsForUser);
router.route('/user/:userId/endorse/:skillId').patch(protect, requireRole(['faculty', 'admin']), endorseSkill);
router.route('/:id').delete(protect, requireRole(['admin']), deleteSkill);

module.exports = router;

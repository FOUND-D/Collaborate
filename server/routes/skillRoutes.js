const express = require('express');
const {
  getSkills,
  createUserSkill,
  deleteUserSkill,
  getSkillsForUser,
  getSkillMatches,
} = require('../controllers/skillController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getSkills);
router.route('/matches').get(protect, getSkillMatches);
router.route('/user').post(protect, createUserSkill);
router.route('/user/:skillId').delete(protect, deleteUserSkill);
router.route('/user/:userId').get(protect, getSkillsForUser);

module.exports = router;

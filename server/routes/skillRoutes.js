const express = require('express');
const {
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
} = require('../controllers/skillController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/orgMiddleware');

const router = express.Router();

router.route('/').get(protect, getSkills);
router.route('/group-by-skill').get(protect, getGroupedBySkill);
router.route('/group-by-user').get(protect, getGroupedByUser);
router.route('/venn').get(protect, getVennDiagram);
router.route('/filter').get(protect, filterSkills);
router.route('/match').get(protect, getMatchmaking);
router.route('/match/:userId').get(protect, getMatchmaking);
router.route('/matches').get(protect, getSkillMatches);
router.route('/user').post(protect, createUserSkill);
router.route('/user/:skillId').delete(protect, deleteUserSkill);
router.route('/user/:userId').get(protect, getSkillsForUser);
router.route('/user/:userId/endorse/:skillId').patch(protect, requireRole(['faculty', 'admin']), endorseSkill);
router.route('/:id').delete(protect, requireRole(['admin']), deleteSkill);

module.exports = router;

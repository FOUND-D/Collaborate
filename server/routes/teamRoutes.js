const express = require('express');
const router = express.Router();
const {
  createTeam,
  addMember,
  getTeams,
  joinTeam,
  deleteTeam,
  updateTeamJoinRequest,
  getTeamById,
  linkGithubRepo,
  getTeamCommits,
} = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

const meetingRoutes = require('./meetingRoutes');

router.route('/').post(protect, createTeam).get(protect, getTeams);
router.route('/:id/members').put(protect, addMember);
router.route('/:id/join').post(protect, joinTeam).put(protect, updateTeamJoinRequest);
router.route('/:id/github').put(protect, linkGithubRepo);
router.route('/:id/commits').get(protect, getTeamCommits);
router.use('/:teamId/sessions', meetingRoutes);
router.route('/:id').get(protect, getTeamById).delete(protect, deleteTeam);

module.exports = router;

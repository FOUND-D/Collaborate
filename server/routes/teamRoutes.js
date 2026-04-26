const express = require('express');
const router = express.Router();
const {
  createTeam,
  addMember,
  getTeams,
  joinTeam, // Import joinTeam
  deleteTeam, // Import deleteTeam
  updateTeamJoinRequest, // Import updateTeamJoinRequest
  getTeamById,
} = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/orgMiddleware');

const meetingRoutes = require('./meetingRoutes');

router.route('/').post(protect, requireRole(['faculty', 'admin']), createTeam).get(protect, getTeams);
router.route('/:id/members').put(protect, addMember);
router.route('/:id/join').post(protect, joinTeam).put(protect, updateTeamJoinRequest); // Add PUT route for updating join requests
router.route('/:id').get(protect, getTeamById).delete(protect, deleteTeam); // New route for deleting a team

router.use('/:teamId/sessions', meetingRoutes);
router.use('/:teamId/meetings', meetingRoutes);

module.exports = router;

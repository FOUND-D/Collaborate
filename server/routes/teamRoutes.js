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

router.route('/').post(protect, createTeam).get(protect, getTeams);
router.route('/:id/members').put(protect, addMember);
router.route('/:id/join').post(protect, joinTeam).put(protect, updateTeamJoinRequest); // Add PUT route for updating join requests
router.route('/:id').get(protect, getTeamById).delete(protect, deleteTeam); // New route for deleting a team

module.exports = router;
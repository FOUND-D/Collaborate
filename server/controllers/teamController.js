const Team = require('../models/Team');
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get a team by its ID
// @route   GET /api/teams/:id
// @access  Private
const getTeamById = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('owner', 'name email profileImage')
    .populate('members', 'name email profileImage')
    .populate({
      path: 'projects',
      model: 'Project',
    });

  if (team) {
    res.json(team);
  } else {
    res.status(404);
    throw new Error('Team not found');
  }
});

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
const createTeam = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const team = new Team({
    name,
    owner: req.user._id,
    members: [req.user._id],
  });

  const createdTeam = await team.save();

  // Update the user's teams array to include the newly created team using findByIdAndUpdate with $addToSet
  await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { teams: createdTeam._id } },
    { new: true } // Return the updated document
  );

  res.status(201).json(createdTeam);
});

// @desc    Get all teams for a user
// @route   GET /api/teams
// @access  Private
const getTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find({
    $or: [{ owner: req.user._id }, { members: req.user._id }],
  })
    .populate('owner', 'name email profileImage')
    .populate('members', 'name email profileImage')
    .populate('pendingJoinRequests', 'name email profileImage');

  res.status(200).json(teams);
});

// @desc    Add a member to a team
// @route   PUT /api/teams/:id/members
// @access  Private
const addMember = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    const team = await Team.findById(req.params.id);

    if (team) {
        if (team.owner.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Only the team owner can add members');
        }

        const user = await User.findById(userId);

        if (user) {
            if (team.members.includes(userId)) {
                res.status(400);
                throw new Error('User is already in the team');
            }

            team.members.push(userId);
            await team.save();

            // Also add the team to the user's list of teams
            await User.findByIdAndUpdate(
                userId,
                { $addToSet: { teams: team._id } },
                { new: true }
            );

            res.json(team);
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } else {
        res.status(404);
        throw new Error('Team not found');
    }
});


// @desc    Request to join a team
// @route   POST /api/teams/:id/join
// @access  Private
const joinTeam = asyncHandler(async (req, res) => {
  const teamId = req.params.id;
  const userId = req.user._id;

  const team = await Team.findById(teamId);

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  if (team.members.includes(userId)) {
    res.status(400);
    throw new Error('User is already a member of this team');
  }

  if (team.pendingJoinRequests.includes(userId)) {
    res.status(400);
    throw new Error('Join request already pending for this team');
  }

  team.pendingJoinRequests.push(userId);
  await team.save();

  // For now, log the request. In a real app, this would trigger a notification.
  console.log(`User ${req.user.name} (ID: ${userId}) requested to join team ${team.name} (ID: ${teamId}). Team owner: ${team.owner}`);

  return res.status(200).json({ message: 'Join request sent successfully' });
});

// @desc    Delete a team
// @route   DELETE /api/teams/:id
// @access  Private
const deleteTeam = asyncHandler(async (req, res) => {
  console.log('Attempting to delete team:', req.params.id);
  const team = await Team.findById(req.params.id);

  if (team) {
    console.log('Team found:', team._id);
    if (team.owner.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized as team owner');
    }

    console.log('User is authorized. Removing team from members...');
    // Remove team from all members' team list
    await User.updateMany(
      { _id: { $in: team.members } },
      { $pull: { teams: team._id } }
    );
    console.log('Team removed from members. Deleting associated tasks...');

    // Delete all tasks associated with this team
    await Task.deleteMany({ team: team._id });
    console.log('Associated tasks deleted. Removing team...');

    await team.deleteOne(); // Use deleteOne instead of deprecated remove()
    console.log('Team removed successfully.');
    res.json({ message: 'Team removed' });
  } else {
    res.status(404);
    throw new Error('Team not found');
  }
});

// @desc    Update a team join request (approve/reject)
// @route   PUT /api/teams/:id/join
// @access  Private (Team Owner)
const updateTeamJoinRequest = asyncHandler(async (req, res) => {
  const teamId = req.params.id;
  const { userId, action } = req.body; // 'approve' or 'reject'

  const team = await Team.findById(teamId);

  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  // Check if the logged-in user is the team owner
  if (team.owner.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to manage join requests for this team');
  }

  // Check if the user is in pending requests
  const userRequestIndex = team.pendingJoinRequests.indexOf(userId);
  if (userRequestIndex === -1) {
    res.status(404);
    throw new Error('User not found in pending join requests');
  }

  if (action === 'approve') {
    // Remove from pending requests
    team.pendingJoinRequests.splice(userRequestIndex, 1);
    // Add to members
    team.members.push(userId);
    await team.save();

    // Add team to user's teams list
    const user = await User.findById(userId);
    if (user) {
      if (!user.teams.includes(teamId)) {
        // Add team to user's teams list
        // Use findByIdAndUpdate with $addToSet to ensure the teamId is added uniquely and saved
        // Use findByIdAndUpdate with $addToSet to ensure the teamId is added uniquely and saved
        await User.findByIdAndUpdate(
          userId,
          { $addToSet: { teams: teamId } },
          { new: true } // Return the updated document
        );
      }
    } else {
      console.warn(`Approved user (ID: ${userId}) not found for team ${teamId}.`);
    }

    res.json({ message: 'User approved and added to the team' });

  } else if (action === 'reject') {
    // Remove from pending requests
    team.pendingJoinRequests.splice(userRequestIndex, 1);
    await team.save();
    res.json({ message: 'User join request rejected' });

  } else {
    res.status(400);
    throw new Error('Invalid action specified. Must be "approve" or "reject"');
  }
});

module.exports = {
  createTeam,
  addMember,
  getTeams,
  joinTeam,
  deleteTeam,
  updateTeamJoinRequest,
  getTeamById,
};
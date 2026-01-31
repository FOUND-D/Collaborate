const asyncHandler = require('../middleware/asyncHandler');
const Meeting = require('../models/Meeting');
const Team = require('../models/Team');

const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 15);
}

// @desc    Start a new meeting for a team
// @route   POST /api/teams/:teamId/meetings
// @access  Private
const startMeeting = asyncHandler(async (req, res) => {
    const { teamId } = req.params;


    if (!teamId) {
        res.status(400);
        throw new Error('Team ID is required.');
    }

    const team = await Team.findById(teamId);

    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }

    // Check if the requesting user is a member of the team
    const isMember = team.members.some(memberId => memberId.equals(req.user._id));
    if (!isMember) {
        res.status(403);
        throw new Error('User is not a member of this team');
    }

    const activeMeeting = await Meeting.findOne({ team: teamId, status: 'active' });

    if (activeMeeting) {
        res.status(400);
        throw new Error('A meeting is already active for this team');
    }

    const meeting = new Meeting({
        team: teamId,
        roomId: generateRoomId(),
        status: 'active',
        startedBy: req.user._id,
    });


    try {
        const createdMeeting = await meeting.save();
        req.io.to(teamId).emit('meetingStarted', createdMeeting);
        res.status(201).json(createdMeeting);
    } catch (error) {
        res.status(500);
        throw new Error('Could not create meeting due to a database error.');
    }
});

// @desc    Get the current meeting for a team
// @route   GET /api/teams/:teamId/meetings
// @access  Private
const getMeeting = asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const team = await Team.findById(teamId);

    if (!team) {
        res.status(404);
        throw new Error('Team not found');
    }

    const meeting = await Meeting.findOne({ team: teamId, status: 'active' });

    if (meeting) {
        res.json(meeting);
    } else {
        res.status(404);
        throw new Error('No active meeting found');
    }
});

// @desc    End a meeting for a team
// @route   PUT /api/teams/:teamId/meetings/:meetingId
// @access  Private
const endMeeting = asyncHandler(async (req, res) => {
    const { meetingId } = req.params;
    const meeting = await Meeting.findById(meetingId);

    if (meeting) {
        meeting.status = 'inactive';
        const updatedMeeting = await meeting.save();
        res.json(updatedMeeting);
    } else {
        res.status(404);
        throw new Error('Meeting not found');
    }
});

module.exports = {
  startMeeting,
  getMeeting,
  endMeeting,
};

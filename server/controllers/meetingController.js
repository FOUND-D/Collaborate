const asyncHandler = require('../middleware/asyncHandler');
const { supabase, toPublicMeeting } = require('../lib/repo');

const generateRoomId = () => Math.random().toString(36).substring(2, 15);

const startMeeting = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('meetings').insert({ team_id: req.params.teamId, room_id: generateRoomId(), status: 'active', started_by: req.user._id }).select('*').single();
  if (error) throw error;
  const meeting = toPublicMeeting(data);
  req.io.to(req.params.teamId).emit('meetingStarted', meeting);
  res.status(201).json(meeting);
});

const getMeeting = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('meetings').select('*').eq('team_id', req.params.teamId).eq('status', 'active').maybeSingle();
  if (error || !data) return res.status(404).json({ message: 'No active meeting found' });
  res.json(toPublicMeeting(data));
});

const endMeeting = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('meetings').update({ status: 'inactive' }).eq('id', req.params.meetingId).select('*').single();
  if (error) throw error;
  res.json(toPublicMeeting(data));
});

module.exports = { startMeeting, getMeeting, endMeeting };

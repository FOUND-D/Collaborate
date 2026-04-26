const asyncHandler = require('../middleware/asyncHandler');
const { supabase, toPublicMeeting } = require('../lib/repo');

const generateRoomId = () => Math.random().toString(36).substring(2, 15);

const startMeeting = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('sessions').insert({
    team_id: req.params.teamId,
    room_id: generateRoomId(),
    status: 'active',
    started_by: req.user._id,
    agenda: req.body.agenda || '',
  }).select('*').single();
  if (error) throw error;
  const session = toPublicMeeting(data);
  req.io.to(req.params.teamId).emit('sessionStarted', session);
  req.io.to(req.params.teamId).emit('meetingStarted', session);
  res.status(201).json(session);
});

const getMeeting = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('sessions').select('*').eq('team_id', req.params.teamId).eq('status', 'active').maybeSingle();
  if (error || !data) return res.status(404).json({ message: 'No active session found' });
  res.json(toPublicMeeting(data));
});

const updateMeetingAgenda = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('sessions')
    .update({ agenda: req.body.agenda || '' })
    .eq('id', req.params.meetingId)
    .select('*')
    .single();
  if (error) throw error;
  res.json(toPublicMeeting(data));
});

const endMeeting = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('sessions').update({ status: 'inactive' }).eq('id', req.params.meetingId).select('*').single();
  if (error) throw error;
  const session = toPublicMeeting(data);
  req.io.to(req.params.teamId).emit('sessionEnded', session);
  req.io.to(req.params.teamId).emit('meetingEnded', session);
  res.json(session);
});

module.exports = { startMeeting, getMeeting, updateMeetingAgenda, endMeeting };

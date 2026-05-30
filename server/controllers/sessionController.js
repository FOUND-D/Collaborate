const asyncHandler = require('../middleware/asyncHandler');
const {
  createSessionBooking,
  listUserSessions,
  getSessionRecordById,
  updateSessionStatus,
  completeSession,
  supabase,
  toPublicSession,
} = require('../lib/repo');

const isParticipant = (session, userId) => session && (session.teacher_id === userId || session.learner_id === userId);

const createBookingSession = asyncHandler(async (req, res) => {
  const { skill_id, team_id, scheduled_at, duration_min, agenda, status } = req.body;

  const { data, error } = await supabase.from('booking_sessions').insert({
    skill_id,
    team_id,
    scheduled_at,
    duration_min: duration_min || 60,
    agenda: agenda || '',
    status: status || 'pending',
    teacher_id: req.user._id,
  }).select('*, skill:skills(*), team:teams(*)').single();

  if (error) throw error;

  req.io.to(team_id).emit('sessionBooked', data);
  res.status(201).json(data);
});

const getBookingSessions = asyncHandler(async (req, res) => {
  const { team_id } = req.query;
  let query = supabase.from('booking_sessions').select('*, skill:skills(*), teacher:users!booking_sessions_teacher_id_fkey(id,name,email), learner:users!booking_sessions_learner_id_fkey(id,name,email), team:teams(*)');

  if (team_id) {
    query = query.eq('team_id', team_id);
  } else {
    // If no team_id is provided, get sessions where user is teacher or the session belongs to a team the user is in.
    const { data: memberships } = await supabase.from('team_members').select('team_id').eq('user_id', req.user._id);
    const teamIds = (memberships || []).map(m => m.team_id);
    if (teamIds.length > 0) {
      query = query.or(`teacher_id.eq.${req.user._id},team_id.in.(${teamIds.join(',')})`);
    } else {
      query = query.eq('teacher_id', req.user._id);
    }
  }

  const { data, error } = await query.order('scheduled_at', { ascending: true });
  if (error) throw error;
  
  if (team_id) {
    return res.json(data || []);
  }

  const now = new Date();
  const upcoming = [];
  const past = [];

  (data || []).forEach(session => {
    const scheduled = new Date(session.scheduled_at);
    const isPast = session.status === 'completed' || session.status === 'cancelled' || scheduled < now;
    if (isPast) {
      past.push(session);
    } else {
      upcoming.push(session);
    }
  });

  res.json({ upcoming, past });
});

const cancelBookingSession = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('booking_sessions').update({ status: 'cancelled' }).eq('id', req.params.id).select('*').single();
  if (error) throw error;
  res.json(data);
});

const createSession = asyncHandler(async (req, res) => {
  const listingId = req.body.listingId || req.body.listing_id;
  const scheduledAt = req.body.scheduledAt || req.body.scheduled_at;

  if (!listingId) return res.status(400).json({ message: 'listingId is required' });
  if (!scheduledAt) return res.status(400).json({ message: 'scheduledAt is required' });

  const session = await createSessionBooking({
    listingId,
    actorId: req.user._id,
    scheduledAt,
    durationMin: req.body.durationMin || req.body.duration_min,
    agenda: req.body.agenda,
  });

  res.status(201).json(session);
});

const getSessions = asyncHandler(async (req, res) => {
  res.json(await listUserSessions(req.user._id));
});

const confirmSession = asyncHandler(async (req, res) => {
  const session = await getSessionRecordById(req.params.id);
  if (!session) return res.status(404).json({ message: 'Session not found' });
  if (!isParticipant(session, req.user._id)) return res.status(403).json({ message: 'Not authorized for this session' });
  if (session.status === 'cancelled') return res.status(400).json({ message: 'Cancelled sessions cannot be confirmed' });

  res.json(await updateSessionStatus({
    sessionId: req.params.id,
    updates: { status: 'confirmed' },
  }));
});

const cancelSession = asyncHandler(async (req, res) => {
  const session = await getSessionRecordById(req.params.id);
  if (!session) return res.status(404).json({ message: 'Session not found' });
  if (!isParticipant(session, req.user._id)) return res.status(403).json({ message: 'Not authorized for this session' });
  if (session.status === 'completed') return res.status(400).json({ message: 'Completed sessions cannot be cancelled' });

  res.json(await updateSessionStatus({
    sessionId: req.params.id,
    updates: { status: 'cancelled' },
  }));
});

const completeSessionBooking = asyncHandler(async (req, res) => {
  const session = await getSessionRecordById(req.params.id);
  if (!session) return res.status(404).json({ message: 'Session not found' });
  if (!isParticipant(session, req.user._id)) return res.status(403).json({ message: 'Not authorized for this session' });

  res.json(await completeSession({ sessionId: req.params.id }));
});

module.exports = {
  createSession,
  getSessions,
  confirmSession,
  cancelSession,
  completeSessionBooking,
  createBookingSession,
  getBookingSessions,
  cancelBookingSession,
};

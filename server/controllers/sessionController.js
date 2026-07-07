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
const { sendNotification } = require('../services/notificationService');

const isParticipant = (session, userId) => session && (session.teacher_id === userId || session.learner_id === userId);

const createBookingSession = asyncHandler(async (req, res) => {
  const { skill_id, team_id, scheduled_at, duration_min, agenda, status } = req.body;

  if (!skill_id) return res.status(400).json({ message: 'skill_id is required' });
  if (!team_id) return res.status(400).json({ message: 'team_id is required' });
  if (!scheduled_at) return res.status(400).json({ message: 'scheduled_at is required' });

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

  const publicData = toPublicSession(data);
  if (team_id) req.io.to(team_id).emit('sessionBooked', publicData);
  req.io.to(req.user._id).emit('sessionCreated', publicData);
  res.status(201).json(publicData);
});

const getBookingSessions = asyncHandler(async (req, res) => {
  const { team_id } = req.query;
  let query = supabase.from('booking_sessions').select('*, skill:skills(*), teacher:users!booking_sessions_teacher_id_fkey(id,name,email), learner:users!booking_sessions_learner_id_fkey(id,name,email), team:teams(*)');

  if (team_id) {
    query = query.eq('team_id', team_id);
  } else {
    // If no team_id is provided, get sessions where user is teacher, learner, or the session belongs to a team the user is in.
    const { data: memberships } = await supabase.from('team_members').select('team_id').eq('user_id', req.user._id);
    const teamIds = (memberships || []).map(m => m.team_id);
    if (teamIds.length > 0) {
      query = query.or(`teacher_id.eq.${req.user._id},learner_id.eq.${req.user._id},team_id.in.(${teamIds.join(',')})`);
    } else {
      query = query.or(`teacher_id.eq.${req.user._id},learner_id.eq.${req.user._id}`);
    }
  }

  const { data, error } = await query.order('scheduled_at', { ascending: true });
  if (error) throw error;
  
  const sessions = (data || []).map(toPublicSession);

  if (team_id) {
    return res.json(sessions);
  }

  const now = new Date();
  const upcoming = [];
  const past = [];

  sessions.forEach(session => {
    const scheduled = new Date(session.scheduledAt);
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
  const session = await getSessionRecordById(req.params.id);
  if (!session) return res.status(404).json({ message: 'Session not found' });

  // Check if user is teacher or learner
  const isUserParticipant = isParticipant(session, req.user._id);

  // Check if session belongs to a team the user is in
  let isTeamMember = false;
  if (session.team_id) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('team_id', session.team_id)
      .eq('user_id', req.user._id)
      .maybeSingle();
    if (membership) isTeamMember = true;
  }

  if (!isUserParticipant && !isTeamMember) {
    return res.status(403).json({ message: 'Not authorized to cancel this session' });
  }

  if (session.status === 'completed') {
    return res.status(400).json({ message: 'Completed sessions cannot be cancelled' });
  }

  const { data, error } = await supabase
    .from('booking_sessions')
    .update({ status: 'cancelled' })
    .eq('id', req.params.id)
    .select('*')
    .single();

  if (error) throw error;
  res.json(toPublicSession(data));
});

const createSession = asyncHandler(async (req, res) => {
  const listingId = req.body.listingId || req.body.listing_id;
  const scheduledAt = req.body.scheduledAt || req.body.scheduled_at;

  if (!listingId && (req.body.skill_id || req.body.team_id)) {
    return createBookingSession(req, res);
  }

  if (!listingId) return res.status(400).json({ message: 'listingId is required' });
  if (!scheduledAt) return res.status(400).json({ message: 'scheduledAt is required' });

  const session = await createSessionBooking({
    listingId,
    actorId: req.user._id,
    scheduledAt,
    durationMin: req.body.durationMin || req.body.duration_min,
    agenda: req.body.agenda,
  });

  // Trigger Notification to Teacher
  if (session && session.teacher_id && session.teacher_id !== req.user._id) {
    sendNotification(req.io, {
      userId: session.teacher_id,
      title: 'New Session Requested',
      message: `${req.user.name || 'A student'} has requested a peer session with you.`,
      type: 'session_booked',
      data: { sessionId: session.id }
    });
  }

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

  const updated = await updateSessionStatus({
    sessionId: req.params.id,
    updates: { status: 'confirmed' },
  });

  // Notify learner that the teacher confirmed
  if (updated && session.learner_id) {
    sendNotification(req.io, {
      userId: session.learner_id,
      title: 'Session Booking Confirmed',
      message: `Your session booking request has been accepted/confirmed.`,
      type: 'session_status_changed',
      data: { sessionId: session.id, status: 'confirmed' }
    });
  }

  res.json(updated);
});

const cancelSession = asyncHandler(async (req, res) => {
  const session = await getSessionRecordById(req.params.id);
  if (!session) return res.status(404).json({ message: 'Session not found' });
  if (!isParticipant(session, req.user._id)) return res.status(403).json({ message: 'Not authorized for this session' });
  if (session.status === 'completed') return res.status(400).json({ message: 'Completed sessions cannot be cancelled' });

  const updated = await updateSessionStatus({
    sessionId: req.params.id,
    updates: { status: 'cancelled' },
  });

  // Notify the other participant about cancellation
  const otherPartyId = req.user._id === session.teacher_id ? session.learner_id : session.teacher_id;
  if (updated && otherPartyId) {
    sendNotification(req.io, {
      userId: otherPartyId,
      title: 'Session Cancelled',
      message: `Your session booking has been cancelled.`,
      type: 'session_status_changed',
      data: { sessionId: session.id, status: 'cancelled' }
    });
  }

  res.json(updated);
});

const completeSessionBooking = asyncHandler(async (req, res) => {
  const session = await getSessionRecordById(req.params.id);
  if (!session) return res.status(404).json({ message: 'Session not found' });
  if (!isParticipant(session, req.user._id)) return res.status(403).json({ message: 'Not authorized for this session' });

  const completedSession = await completeSession({ sessionId: req.params.id });

  // Award badges
  try {
    const { awardBadgeIfEarned, recalculateTopTeachers } = require('../services/badgeService');
    if (session.teacher_id) {
      await awardBadgeIfEarned(session.teacher_id, 'session_complete');
      await awardBadgeIfEarned(session.teacher_id, 'peer_mentor');
      await awardBadgeIfEarned(session.teacher_id, 'rising_star');
    }
    if (session.learner_id) {
      await awardBadgeIfEarned(session.learner_id, 'rising_star');
    }
    await recalculateTopTeachers();
  } catch (err) {
    console.error('Error awarding badge:', err);
  }

  // Notify the other participant about completion
  const otherPartyId = req.user._id === session.teacher_id ? session.learner_id : session.teacher_id;
  if (completedSession && otherPartyId) {
    sendNotification(req.io, {
      userId: otherPartyId,
      title: 'Session Marked Completed',
      message: `Your peer session has been marked as completed.`,
      type: 'session_status_changed',
      data: { sessionId: session.id, status: 'completed' }
    });
  }

  res.json(completedSession);
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

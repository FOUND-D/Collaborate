const asyncHandler = require('../middleware/asyncHandler');
const {
  createSessionBooking,
  listUserSessions,
  getSessionRecordById,
  updateSessionStatus,
  completeSession,
} = require('../lib/repo');

const isParticipant = (session, userId) => session && (session.teacher_id === userId || session.learner_id === userId);

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
};

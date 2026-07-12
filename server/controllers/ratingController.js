const asyncHandler = require('../middleware/asyncHandler');
const {
  createRating,
  getRatingsForUser,
  getSessionRecordById,
} = require('../lib/repo');

const createSessionRating = asyncHandler(async (req, res) => {
  const sessionId = req.body.sessionId || req.body.session_id;
  const rateeId = req.body.rateeId || req.body.ratee_id;

  if (!rateeId) return res.status(400).json({ message: 'rateeId is required' });
  if (Number(req.body.stars) < 1 || Number(req.body.stars) > 5) {
    return res.status(400).json({ message: 'stars must be between 1 and 5' });
  }

  if (sessionId) {
    const session = await getSessionRecordById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.status !== 'completed') return res.status(400).json({ message: 'Only completed sessions can be rated' });

    const isParticipant = [session.teacher_id, session.learner_id].includes(req.user._id);
    if (!isParticipant) return res.status(403).json({ message: 'Not authorized to rate this session' });
    if (![session.teacher_id, session.learner_id].includes(rateeId)) {
      return res.status(400).json({ message: 'rateeId must be one of the session participants' });
    }
  }

  if (rateeId === req.user._id) return res.status(400).json({ message: 'You cannot rate yourself' });

  const rating = await createRating({
    sessionId,
    raterId: req.user._id,
    rateeId,
    stars: Number(req.body.stars),
    review: req.body.review,
    isFlagged: req.body.isFlagged || req.body.is_flagged,
  });

  try {
    const { awardBadgeIfEarned } = require('../services/badgeService');
    await awardBadgeIfEarned(rateeId, 'highly_rated');
  } catch (err) {
    console.error('Error awarding badge:', err);
  }

  res.status(201).json(rating);
});

const getRatings = asyncHandler(async (req, res) => {
  const ratingsData = await getRatingsForUser(req.params.userId);
  const isOwner = req.user && req.user._id === req.params.userId;

  if (!isOwner) {
    ratingsData.ratings = ratingsData.ratings.map((r) => ({
      ...r,
      review: null, // Hide comments from public
    }));
  }

  res.json(ratingsData);
});

module.exports = {
  createSessionRating,
  getRatings,
};

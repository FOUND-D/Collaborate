const asyncHandler = require('../middleware/asyncHandler');
const { getTopUsersByDevScore } = require('../lib/repo');

const getLeaderboard = asyncHandler(async (req, res) => {
  const { department } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const users = await getTopUsersByDevScore({ limit, department: department || null });
  res.json({ type: 'devscore', users });
});

module.exports = { getLeaderboard };

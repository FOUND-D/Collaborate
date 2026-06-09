const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/repo');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get badges for a user
// @route   GET /api/badges/user/:userId
// @access  Public
router.get('/user/:userId', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('badges')
    .select('*, skills(name)')
    .eq('user_id', req.params.userId)
    .order('awarded_at', { ascending: false });

  if (error) throw error;

  const badges = (data || []).map(b => ({
    id: b.id,
    _id: b.id,
    type: b.type,
    skillName: b.skills ? b.skills.name : null,
    awardedAt: b.awarded_at,
  }));

  res.json({ badges });
}));

module.exports = router;

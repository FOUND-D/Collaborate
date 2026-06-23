const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/repo');
const asyncHandler = require('../middleware/asyncHandler');
const { protect } = require('../middleware/authMiddleware');

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

// @desc    Toggle badge visibility
// @route   PUT /api/badges/:id/visibility
// @access  Private
router.put('/:id/visibility', protect, asyncHandler(async (req, res) => {
  // 1. Fetch the badge
  const { data: badge, error: fetchError } = await supabase
    .from('badges')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!badge) {
    return res.status(404).json({ message: 'Badge not found' });
  }

  // 2. Authorization check: must belong to the user
  const userId = req.user._id || req.user.id;
  if (badge.user_id !== userId) {
    return res.status(403).json({ message: 'Not authorized to toggle this badge' });
  }

  // 3. Determine new type
  let newType;
  if (badge.type.endsWith('_hidden')) {
    newType = badge.type.replace('_hidden', '');
  } else {
    newType = badge.type + '_hidden';
  }

  // 4. Update the badge in the DB
  const { data: updatedBadge, error: updateError } = await supabase
    .from('badges')
    .update({ type: newType })
    .eq('id', req.params.id)
    .select('*')
    .single();

  if (updateError) throw updateError;

  res.json({
    id: updatedBadge.id,
    _id: updatedBadge.id,
    type: updatedBadge.type,
    skillName: badge.skills ? badge.skills.name : null,
    awardedAt: updatedBadge.awarded_at,
  });
}));

module.exports = router;

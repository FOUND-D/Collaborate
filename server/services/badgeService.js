const { supabase } = require('../lib/repo');

/**
 * Award a badge to a user if they meet the threshold for a specific trigger.
 * @param {string} userId 
 * @param {string} trigger - 'session_complete' or 'resource_upload'
 */
const awardBadgeIfEarned = async (userId, trigger) => {
  try {
    let type = null;
    let threshold = 0;
    let count = 0;

    if (trigger === 'session_complete') {
      // Count completed sessions where user is teacher
      const { count: sessionCount, error: sessionError } = await supabase
        .from('booking_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', userId)
        .eq('status', 'completed');

      if (sessionError) throw sessionError;
      count = sessionCount || 0;

      if (count >= 30) {
        type = 'gold_expert';
        threshold = 30;
      } else if (count >= 15) {
        type = 'silver_mentor';
        threshold = 15;
      } else if (count >= 5) {
        type = 'bronze_teacher';
        threshold = 5;
      } else if (count >= 1) {
        type = 'first_session';
        threshold = 1;
      }
    } else if (trigger === 'resource_upload') {
      // Count uploaded resources
      const { count: resourceCount, error: resourceError } = await supabase
        .from('resources')
        .select('*', { count: 'exact', head: true })
        .eq('uploader_id', userId);

      if (resourceError) throw resourceError;
      count = resourceCount || 0;

      if (count >= 3) {
        type = 'resource_sharer';
        threshold = 3;
      }
    }

    if (!type) return { awarded: false };

    // Check if user already has this badge
    const { data: existingBadge, error: badgeError } = await supabase
      .from('badges')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .maybeSingle();

    if (badgeError) throw badgeError;

    if (!existingBadge) {
      const { data: newBadge, error: insertError } = await supabase
        .from('badges')
        .insert({
          user_id: userId,
          type: type,
        })
        .select('*')
        .single();

      if (insertError) throw insertError;
      return { awarded: true, badge: newBadge };
    }

    return { awarded: false };
  } catch (error) {
    console.error('awardBadgeIfEarned error:', error);
    return { awarded: false, error: error.message };
  }
};

module.exports = {
  awardBadgeIfEarned,
};

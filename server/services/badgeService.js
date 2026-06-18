const { supabase } = require('../lib/repo');

/**
 * Award a badge to a user if they meet the threshold for a specific trigger.
 * @param {string} userId 
 * @param {string} trigger - 'session_complete', 'resource_upload', 'highly_rated', 'subject_expert', 'active_contributor', 'peer_mentor', 'rising_star'
 */
const awardBadgeIfEarned = async (userId, trigger) => {
  try {
    let typesToAward = [];
    let count = 0;

    if (trigger === 'session_complete' || trigger === 'peer_mentor' || trigger === 'rising_star') {
      // Count completed sessions where user is teacher
      const { count: sessionCount, error: sessionError } = await supabase
        .from('booking_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', userId)
        .eq('status', 'completed');

      if (sessionError) throw sessionError;
      count = sessionCount || 0;

      if (count >= 30) typesToAward.push('gold_expert');
      if (count >= 20) typesToAward.push('peer_mentor');
      if (count >= 15) typesToAward.push('silver_mentor');
      if (count >= 5) typesToAward.push('bronze_teacher');
      if (count >= 1) typesToAward.push('first_session');

      // Check rising star for teacher
      const { data: user, error: userError } = await supabase.from('users').select('created_at').eq('id', userId).maybeSingle();
      if (!userError && user) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (new Date(user.created_at) >= thirtyDaysAgo) {
          // Count total sessions (teacher or learner)
          const { count: totalSessions } = await supabase
            .from('booking_sessions')
            .select('*', { count: 'exact', head: true })
            .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`)
            .eq('status', 'completed');
            
          if ((totalSessions || 0) >= 5) {
            typesToAward.push('rising_star');
          }
        }
      }
    } 
    
    if (trigger === 'resource_upload' || trigger === 'active_contributor') {
      // Count uploaded resources
      const { count: resourceCount, error: resourceError } = await supabase
        .from('resources')
        .select('*', { count: 'exact', head: true })
        .eq('uploader_id', userId);

      if (resourceError) throw resourceError;
      count = resourceCount || 0;

      if (count >= 10) typesToAward.push('active_contributor');
      if (count >= 3) typesToAward.push('resource_sharer');
    }

    if (trigger === 'highly_rated') {
      const { data: user, error } = await supabase.from('users').select('avg_rating').eq('id', userId).maybeSingle();
      if (!error && user && user.avg_rating >= 4.5) {
        const { count: ratingCount } = await supabase.from('ratings').select('*', { count: 'exact', head: true }).eq('ratee_id', userId);
        if ((ratingCount || 0) >= 3) {
          typesToAward.push('highly_rated');
        }
      }
    }

    if (trigger === 'subject_expert') {
      const { count: endorsedCount } = await supabase.from('user_skills').select('*', { count: 'exact', head: true }).eq('user_id', userId).not('endorsed_by', 'is', null);
      if ((endorsedCount || 0) >= 3) {
        typesToAward.push('subject_expert');
      }
    }

    if (typesToAward.length === 0) return { awarded: false };

    // Fetch existing badges
    const { data: existingBadges, error: badgeError } = await supabase
      .from('badges')
      .select('type')
      .eq('user_id', userId);

    if (badgeError) throw badgeError;
    const existingTypes = (existingBadges || []).map(b => b.type);

    const newlyAwarded = [];
    for (const type of typesToAward) {
      if (!existingTypes.includes(type)) {
        const { error: insertError } = await supabase.from('badges').insert({ user_id: userId, type });
        if (!insertError) newlyAwarded.push(type);
      }
    }

    return { awarded: newlyAwarded.length > 0, types: newlyAwarded };
  } catch (error) {
    console.error('awardBadgeIfEarned error:', error);
    return { awarded: false, error: error.message };
  }
};

const recalculateTopTeachers = async () => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data: sessions, error } = await supabase
      .from('booking_sessions')
      .select('teacher_id')
      .eq('status', 'completed')
      .gte('completed_at', startOfMonth)
      .lte('completed_at', endOfMonth);

    if (error) throw error;

    const teacherCounts = (sessions || []).reduce((acc, curr) => {
      acc[curr.teacher_id] = (acc[curr.teacher_id] || 0) + 1;
      return acc;
    }, {});

    const sortedTeachers = Object.entries(teacherCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 3); // top 3

    // Delete top_teacher badges from those not in top 3
    if (sortedTeachers.length > 0) {
      await supabase.from('badges').delete().eq('type', 'top_teacher').not('user_id', 'in', `(${sortedTeachers.join(',')})`);
    } else {
      await supabase.from('badges').delete().eq('type', 'top_teacher');
    }

    // Award to top 3
    for (const teacherId of sortedTeachers) {
      const { data: existing } = await supabase.from('badges').select('id').eq('user_id', teacherId).eq('type', 'top_teacher').maybeSingle();
      if (!existing) {
        await supabase.from('badges').insert({ user_id: teacherId, type: 'top_teacher' });
      }
    }
  } catch (error) {
    console.error('recalculateTopTeachers error:', error);
  }
};

module.exports = {
  awardBadgeIfEarned,
  recalculateTopTeachers,
};

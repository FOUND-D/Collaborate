const cron = require('node-cron');
const { supabase } = require('../lib/repo');
const { computeDevScore } = require('../services/devScoreService');

async function refreshAllDevScores() {
  console.log('Running Dev Score update for all users...');
  try {
    // Fetch users who have either GitHub or LeetCode connected
    const { data: users, error } = await supabase
      .from('users')
      .select('id, github_username, leetcode_username, github_show_private, github_score, leetcode_score')
      .or('github_username.neq.,leetcode_username.neq.');

    if (error) {
      console.error('Error fetching users for dev score update:', error);
      return;
    }

    const validUsers = users.filter(u => u.github_username || u.leetcode_username);
    console.log(`Found ${validUsers.length} users to update.`);

    for (const user of validUsers) {
      try {
        const result = await computeDevScore(user);
        console.log(`Updated score for ${user.id}: devScore=${result.devScore} (GH=${result.githubScore}, LC=${result.leetcodeScore})`);
      } catch (err) {
        console.error(`Failed to update score for ${user.id}:`, err.message);
      }
    }

    console.log('Dev Score update completed.');
  } catch (err) {
    console.error('Dev score update error:', err.message);
  }
}

// Run on server startup (with a small delay to let the server finish booting)
setTimeout(() => {
  refreshAllDevScores();
}, 3000);

// Schedule a daily refresh at 6:00 AM (server time)
cron.schedule('0 6 * * *', () => {
  refreshAllDevScores();
});

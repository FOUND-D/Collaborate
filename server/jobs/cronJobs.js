const cron = require('node-cron');
const { supabase } = require('../lib/repo');
const { computeDevScore } = require('../services/devScoreService');

// Schedule a task to run every day at 6:00 AM (server time)
cron.schedule('0 6 * * *', async () => {
  console.log('Running daily Dev Score and Leaderboard update job...');
  try {
    // Fetch users who have either GitHub or LeetCode connected
    const { data: users, error } = await supabase
      .from('users')
      .select('id, github_username, leetcode_username, github_show_private')
      .or('github_username.neq.null,leetcode_username.neq.null');

    if (error) {
      console.error('Error fetching users for cron job:', error);
      return;
    }

    const validUsers = users.filter(u => u.github_username || u.leetcode_username);
    console.log(`Found ${validUsers.length} users to update.`);

    for (const user of validUsers) {
      try {
        await computeDevScore(user);
      } catch (err) {
        console.error(`Failed to update score for ${user.id}:`, err.message);
      }
    }

    console.log('Daily Dev Score update job completed.');
  } catch (err) {
    console.error('Cron job error:', err.message);
  }
});

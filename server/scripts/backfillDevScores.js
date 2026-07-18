require('dotenv').config();
const { supabase } = require('../lib/repo');
const { computeDevScore } = require('../services/devScoreService');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function backfill() {
  console.log("Fetching users with GitHub or LeetCode connected...");
  const { data: users, error } = await supabase
    .from('users')
    .select('id, github_username, leetcode_username, github_show_private')
    .or('github_username.neq.null,leetcode_username.neq.null');

  if (error) {
    console.error("Error fetching users:", error);
    process.exit(1);
  }

  // Filter out those with empty strings
  const validUsers = users.filter(u => u.github_username || u.leetcode_username);
  console.log(`Found ${validUsers.length} users to update.`);

  for (const user of validUsers) {
    console.log(`Computing score for user ${user.id} (${user.github_username || ''} / ${user.leetcode_username || ''})...`);
    try {
      const result = await computeDevScore(user);
      console.log(`  -> Dev Score: ${result.devScore} (gh=${result.githubScore} lc=${result.leetcodeScore})`);
    } catch (err) {
      console.error(`  -> Failed for ${user.id}:`, err.message);
    }
    // Wait 4 seconds between users to avoid GitHub (60 req/hr) and LeetCode rate limits
    if (validUsers.indexOf(user) < validUsers.length - 1) {
      console.log('  Waiting 4s to avoid rate limits...');
      await sleep(4000);
    }
  }

  console.log("Done backfilling!");
  process.exit(0);
}

backfill();

/**
 * Directly patches dev scores in DB using values from a known-good test run.
 * Run: node server/scripts/patchDevScores.js
 */
require('dotenv').config();
const { supabase } = require('../lib/repo');

// These values came from the successful test run (before rate limit kicked in)
const patches = [
  {
    // Arin Dixit - 1233456789@gmail.com (has both GitHub ArinDixit06 + LeetCode arindixit1)
    // GitHub: 78.87 (10 followers, 34 repos, 1 star, 0 forks, 618 commits)
    // LeetCode: 11.14 (32 easy, 24 medium, 0 hard)
    email: '1233456789@gmail.com',
    dev_score: 45.01,
    github_score: 78.87,
    leetcode_score: 11.14,
    dev_score_updated_at: new Date().toISOString(),
  },
  {
    // Arin Dixit - id2013663@gmail.com (GitHub only: ArinDixit06)
    // Same GitHub stats, no LeetCode
    email: 'id2013663@gmail.com',
    dev_score: 78.87,
    github_score: 78.87,
    leetcode_score: 0,
    dev_score_updated_at: new Date().toISOString(),
  },
];

async function main() {
  console.log('Patching dev scores...');
  for (const patch of patches) {
    const { error } = await supabase
      .from('users')
      .update({
        dev_score: patch.dev_score,
        github_score: patch.github_score,
        leetcode_score: patch.leetcode_score,
        dev_score_updated_at: patch.dev_score_updated_at,
      })
      .eq('email', patch.email);

    if (error) {
      console.error(`  FAILED for ${patch.email}:`, error.message);
    } else {
      console.log(`  OK: ${patch.email} → devScore=${patch.dev_score}`);
    }
  }
  console.log('Done.');
}

main().catch(console.error).finally(() => process.exit(0));

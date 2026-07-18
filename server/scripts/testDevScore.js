/**
 * Quick standalone test for devScoreService
 * Run: node server/scripts/testDevScore.js <githubUsername> <leetcodeUsername>
 * Example: node server/scripts/testDevScore.js torvalds neal_wu
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { computeGithubScore, computeLeetcodeScore, computeDevScore } = require('../services/devScoreService');

const githubUser   = process.argv[2] || '';
const leetcodeUser = process.argv[3] || '';

async function main() {
  console.log('=== DevScore Standalone Test ===');
  console.log(`GitHub  username: "${githubUser}"`);
  console.log(`LeetCode username: "${leetcodeUser}"`);
  console.log('');

  if (githubUser) {
    console.log('--- Testing GitHub Score ---');
    const gh = await computeGithubScore(githubUser, false);
    console.log(`\nGitHub Score result: ${gh}`);
  }

  if (leetcodeUser) {
    console.log('\n--- Testing LeetCode Score ---');
    const lc = await computeLeetcodeScore(leetcodeUser);
    console.log(`\nLeetCode Score result: ${lc}`);
  }

  if (githubUser || leetcodeUser) {
    console.log('\n--- Testing Combined Dev Score ---');
    const fakeUser = {
      id: 'test-user',
      github_username: githubUser,
      leetcode_username: leetcodeUser,
      github_show_private: false,
    };
    // Override supabase update to be a no-op for testing
    const result = await computeDevScore(fakeUser);
    console.log('\n=== FINAL RESULT ===');
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch(console.error);

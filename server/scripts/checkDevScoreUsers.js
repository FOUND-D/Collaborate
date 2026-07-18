/**
 * Check what's stored in the users table for dev score fields
 * Run: node server/scripts/checkDevScoreUsers.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { supabase } = require('../lib/repo');

async function main() {
  console.log('Fetching users with github or leetcode connected...');
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email, github_username, leetcode_username, github_show_private, dev_score, github_score, leetcode_score, dev_score_updated_at')
    .or('github_username.neq.,leetcode_username.neq.');

  if (error) {
    console.error('Supabase error:', error);
    return;
  }

  if (!users || users.length === 0) {
    console.log('No users found with github/leetcode connected.');
    
    // Also fetch all users to show what is there
    const { data: all } = await supabase.from('users').select('id, name, email, github_username, leetcode_username, dev_score').limit(10);
    console.log('\nAll users (first 10):');
    (all || []).forEach(u => console.log(` - ${u.name} | gh="${u.github_username}" lc="${u.leetcode_username}" score=${u.dev_score}`));
    return;
  }

  console.log(`\nFound ${users.length} users:\n`);
  users.forEach(u => {
    console.log(`Name: ${u.name} (${u.email})`);
    console.log(`  github_username  : "${u.github_username}"`);
    console.log(`  leetcode_username: "${u.leetcode_username}"`);
    console.log(`  dev_score        : ${u.dev_score}`);
    console.log(`  github_score     : ${u.github_score}`);
    console.log(`  leetcode_score   : ${u.leetcode_score}`);
    console.log(`  updated_at       : ${u.dev_score_updated_at}`);
    console.log('');
  });
}

main().catch(console.error);

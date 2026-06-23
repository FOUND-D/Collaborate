const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const supabase = require('./lib/supabase');
const { getPeerMatches, getUserSkills } = require('./lib/repo');

async function run() {
  try {
    const { data: users } = await supabase
      .from('users')
      .select('id, name, email, department')
      .ilike('name', '%bhavya%');
    
    console.log("Matching users found:", users);

    for (const u of users) {
      console.log(`\n-----------------------------------------`);
      console.log(`User: ${u.name} (ID: ${u.id})`);
      const mySkills = await getUserSkills(u.id);
      console.log("Own skills:", mySkills);
      const matches = await getPeerMatches(u.id, 5);
      console.log(`Computed Matches for ${u.name}:`, JSON.stringify(matches, null, 2));
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

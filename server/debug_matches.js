const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const supabase = require('./lib/supabase');
const { getPeerMatches, getUserSkills } = require('./lib/repo');

async function run() {
  try {
    console.log("=== USERS IN DATABASE ===");
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, email, department');
    if (userError) throw userError;
    console.log(users);

    console.log("\n=== ALL USER SKILLS ===");
    const { data: userSkills, error: skillsError } = await supabase
      .from('user_skills')
      .select('user_id, skill_id, type, level, skills(id, name)');
    if (skillsError) throw skillsError;
    console.log(userSkills);

    console.log("\n=== RUNNING getPeerMatches FOR EACH USER ===");
    for (const u of users) {
      console.log(`\nMatches for User: ${u.name} (ID: ${u.id})`);
      const mySkills = await getUserSkills(u.id);
      console.log("Own skills:", mySkills);
      const matches = await getPeerMatches(u.id, 5);
      console.log("Computed Matches:", JSON.stringify(matches, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error("Error during debug run:", err);
    process.exit(1);
  }
}

run();

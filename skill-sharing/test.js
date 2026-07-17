const {
  groupUsersBySkill,
  groupSkillsByUser,
  fetchRawData
} = require('./skillGrouper');

async function runTests() {
  console.log('--- STARTING SKILL SHARING UTILITY TESTS ---');
  try {
    console.log('Testing fetchRawData()...');
    const raw = await fetchRawData();
    console.log(`Success! Fetched ${raw.users.length} users, ${raw.skills.length} skills, and ${raw.userSkills.length} user-skill relationships.`);

    console.log('\nTesting groupUsersBySkill()...');
    const groupedBySkill = await groupUsersBySkill();
    console.log(`Success! Grouped users into ${groupedBySkill.length} skills.`);
    if (groupedBySkill.length > 0) {
      console.log(`Sample Skill: "${groupedBySkill[0].name}" has ${groupedBySkill[0].people.length} users.`);
    }

    console.log('\nTesting groupSkillsByUser()...');
    const groupedByUser = await groupSkillsByUser();
    console.log(`Success! Grouped skills for ${groupedByUser.length} users.`);
    if (groupedByUser.length > 0) {
      console.log(`Sample User: "${groupedByUser[0].name}" has ${groupedByUser[0].canTeach.length} teach skills and ${groupedByUser[0].wantToLearn.length} learn skills.`);
    }

    console.log('\n--- ALL TESTS COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('\nTest execution failed:', error);
    process.exit(1);
  }
}

runTests();

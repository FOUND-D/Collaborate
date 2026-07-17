const {
  groupUsersBySkill,
  groupSkillsByUser,
  matchSkillsForUser,
  filterUsersBySkills,
  fetchRawData
} = require('./skillGrouper');

function printHelp() {
  console.log(`
Skill-Sharing Backend CLI Utility
=================================
Usage: node cli.js [options]

Options:
  --group-by-skill           List skills and show people grouped under each skill.
  --group-by-user            List users and show their tech stack / teach/learn skills.
  --match <userId>           Find peer matches (mentors & learners) for a specific user ID.
  --search <skills>          Find users matching a comma-separated list of skills (e.g., Python,React).
  --match-all                Used with --search. Require matching ALL specified skills (AND condition).
  --type <can_teach|learn>   Used with --search. Filter by skill relationship type.
  --stats                    Show general stats about skills and users in the database.
  --help                     Show this help message.

Examples:
  node cli.js --group-by-skill
  node cli.js --match a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6
  node cli.js --search "Python, JavaScript" --match-all
  node cli.js --stats
`);
}

async function run() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  try {
    if (args.includes('--stats')) {
      console.log('Fetching database stats...');
      const { users, skills, userSkills } = await fetchRawData();
      console.log('\n--- Database Stats ---');
      console.log(`Total registered users: ${users.length}`);
      console.log(`Total registered skills: ${skills.length}`);
      console.log(`Total user-skill associations: ${userSkills.length}`);
      
      const teachCount = userSkills.filter(us => us.type === 'can_teach').length;
      const learnCount = userSkills.filter(us => us.type !== 'can_teach').length;
      console.log(`  - Can Teach entries: ${teachCount}`);
      console.log(`  - Want to Learn / other entries: ${learnCount}`);
      console.log('----------------------\n');
      return;
    }

    if (args.includes('--group-by-skill')) {
      console.log('Grouping people by skills...');
      const grouped = await groupUsersBySkill();
      console.log('\n======================================================');
      console.log('PEOPLE GROUPED BY SKILLS');
      console.log('======================================================');
      for (const skill of grouped) {
        console.log(`\n• Skill: ${skill.name} (${skill.category || 'General'})`);
        if (skill.people.length === 0) {
          console.log('  (No users registered this skill)');
        } else {
          skill.people.forEach(p => {
            console.log(`  - [${p.type}] ${p.name} (${p.email}) - Level: ${p.level || 'Unspecified'} | Dept: ${p.department || 'N/A'}`);
          });
        }
      }
      console.log('\n======================================================\n');
      return;
    }

    if (args.includes('--group-by-user')) {
      console.log('Grouping skills by users...');
      const grouped = await groupSkillsByUser();
      console.log('\n======================================================');
      console.log('SKILLS GROUPED BY USER');
      console.log('======================================================');
      for (const user of grouped) {
        console.log(`\n• User: ${user.name} (${user.email}) | Role: ${user.role}`);
        if (user.department) console.log(`  Department: ${user.department}`);
        
        console.log('  Can Teach:');
        if (user.canTeach.length === 0) {
          console.log('    (None)');
        } else {
          user.canTeach.forEach(s => console.log(`    - ${s.name} (Level: ${s.level || 'Unspecified'})`));
        }

        console.log('  Wants to Learn:');
        if (user.wantToLearn.length === 0) {
          console.log('    (None)');
        } else {
          user.wantToLearn.forEach(s => console.log(`    - ${s.name} (Level: ${s.level || 'Unspecified'})`));
        }
      }
      console.log('\n======================================================\n');
      return;
    }

    const matchIdx = args.indexOf('--match');
    if (matchIdx !== -1) {
      const userId = args[matchIdx + 1];
      if (!userId) {
        console.error('Error: Please specify a user ID after --match.');
        return;
      }
      console.log(`Finding matches for user ID: ${userId}...`);
      const matches = await matchSkillsForUser(userId);
      console.log('\n======================================================');
      console.log(`MATCHING RESULTS FOR: ${matches.user.name} (${matches.user.email})`);
      console.log('======================================================');
      
      console.log(`\nYour skills:`);
      console.log(`  - Can Teach: ${matches.canTeach.join(', ') || '(None)'}`);
      console.log(`  - Wants to Learn: ${matches.wantsToLearn.join(', ') || '(None)'}`);

      console.log(`\n--- Potential Mentors (People who teach what you want to learn) ---`);
      if (matches.potentialMentors.length === 0) {
        console.log('  No direct mentor matches found.');
      } else {
        matches.potentialMentors.forEach(m => {
          console.log(`  - ${m.mentor.name} (${m.mentor.email}) can teach [${m.skill.name}] (Level: ${m.level || 'Unspecified'}) | Dept: ${m.mentor.department || 'N/A'}`);
        });
      }

      console.log(`\n--- Potential Learners (People who want to learn what you can teach) ---`);
      if (matches.potentialLearners.length === 0) {
        console.log('  No direct learner matches found.');
      } else {
        matches.potentialLearners.forEach(l => {
          console.log(`  - ${l.learner.name} (${l.learner.email}) wants to learn [${l.skill.name}] (Level: ${l.level || 'Unspecified'}) | Dept: ${l.learner.department || 'N/A'}`);
        });
      }
      console.log('\n======================================================\n');
      return;
    }

    const searchIdx = args.indexOf('--search');
    if (searchIdx !== -1) {
      const skillsStr = args[searchIdx + 1];
      if (!skillsStr) {
        console.error('Error: Please specify skills to search for.');
        return;
      }

      const skillNames = skillsStr.split(',').map(s => s.trim());
      const matchAll = args.includes('--match-all');
      
      let type = null;
      const typeIdx = args.indexOf('--type');
      if (typeIdx !== -1) {
        const val = args[typeIdx + 1];
        if (val === 'can_teach') type = 'can_teach';
        else if (val === 'learn' || val === 'want_to_learn') type = 'want_to_learn';
      }

      console.log(`Searching for users with skills: [${skillNames.join(', ')}] (Condition: ${matchAll ? 'AND' : 'OR'}, Type: ${type || 'All'})...`);
      const results = await filterUsersBySkills(skillNames, { matchAll, type });

      console.log('\n======================================================');
      console.log('SEARCH RESULTS');
      console.log('======================================================');
      if (results.length === 0) {
        console.log('No users found matching the criteria.');
      } else {
        results.forEach(r => {
          console.log(`\n• User: ${r.name} (${r.email}) - Dept: ${r.department || 'N/A'}`);
          console.log('  Matched Skills:');
          r.matchedSkills.forEach(s => {
            console.log(`    - [${s.type}] ${s.name} (Level: ${s.level || 'Unspecified'})`);
          });
        });
      }
      console.log('\n======================================================\n');
      return;
    }

    console.log('Unknown options. Use --help to see usage.');
  } catch (error) {
    console.error('\nAn error occurred:', error.message);
  }
}

run();

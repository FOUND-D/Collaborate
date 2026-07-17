const supabase = require('./db');

/**
 * Fetch all necessary raw data from the database.
 * We fetch users, skills, and user_skills separately and join them in memory
 * to ensure robustness against relationship-naming differences.
 */
async function fetchRawData() {
  const [usersResponse, skillsResponse, userSkillsResponse] = await Promise.all([
    supabase.from('users').select('id, name, email, role, department, profile_image'),
    supabase.from('skills').select('id, name, category'),
    supabase.from('user_skills').select('user_id, skill_id, type, level')
  ]);

  if (usersResponse.error) throw new Error(`Failed to fetch users: ${usersResponse.error.message}`);
  if (skillsResponse.error) throw new Error(`Failed to fetch skills: ${skillsResponse.error.message}`);
  if (userSkillsResponse.error) throw new Error(`Failed to fetch user_skills: ${userSkillsResponse.error.message}`);

  return {
    users: usersResponse.data,
    skills: skillsResponse.data,
    userSkills: userSkillsResponse.data
  };
}

/**
 * Group users by each skill.
 * Returns a map/dictionary where the key is the skill ID (and details),
 * and the value is a list of users associated with that skill.
 */
async function groupUsersBySkill() {
  const { users, skills, userSkills } = await fetchRawData();

  const usersMap = new Map(users.map(u => [u.id, u]));
  const skillsMap = new Map(skills.map(s => [s.id, s]));

  const grouped = {};

  // Initialize grouped structure for all skills
  for (const skill of skills) {
    grouped[skill.id] = {
      id: skill.id,
      name: skill.name,
      category: skill.category,
      people: []
    };
  }

  // Populate people under each skill
  for (const us of userSkills) {
    const skill = grouped[us.skill_id];
    const user = usersMap.get(us.user_id);

    if (skill && user) {
      skill.people.push({
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        type: us.type, // e.g., 'can_teach', 'want_to_learn'
        level: us.level // e.g., 'Beginner', 'Intermediate', 'Advanced'
      });
    }
  }

  // Convert map to array format sorted by skill name
  return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Group skills by each user.
 * Returns a list of users, each containing their profile details and nested lists
 * of the skills they "can teach" and skills they "want to learn".
 */
async function groupSkillsByUser() {
  const { users, skills, userSkills } = await fetchRawData();

  const skillsMap = new Map(skills.map(s => [s.id, s]));

  const userSkillsGrouped = {};
  for (const u of users) {
    userSkillsGrouped[u.id] = {
      userId: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      profileImage: u.profile_image,
      canTeach: [],
      wantToLearn: []
    };
  }

  for (const us of userSkills) {
    const userRecord = userSkillsGrouped[us.user_id];
    const skill = skillsMap.get(us.skill_id);

    if (userRecord && skill) {
      const skillDetail = {
        id: skill.id,
        name: skill.name,
        category: skill.category,
        level: us.level
      };

      if (us.type === 'can_teach') {
        userRecord.canTeach.push(skillDetail);
      } else {
        // Any other type (like want_to_learn / looking_for)
        userRecord.wantToLearn.push(skillDetail);
      }
    }
  }

  return Object.values(userSkillsGrouped).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Find other users who match a user's skills.
 * Specifically, it looks for:
 * 1. Mentors: People who "can_teach" the skills the target user "wants_to_learn".
 * 2. Learners: People who "want_to_learn" the skills the target user "can_teach".
 */
async function matchSkillsForUser(targetUserId) {
  const { users, skills, userSkills } = await fetchRawData();

  const targetUser = users.find(u => u.id === targetUserId);
  if (!targetUser) {
    throw new Error(`User with ID ${targetUserId} not found.`);
  }

  const skillsMap = new Map(skills.map(s => [s.id, s]));
  const usersMap = new Map(users.map(u => [u.id, u]));

  // Get target user's skill categories
  const targetCanTeachIds = userSkills
    .filter(us => us.user_id === targetUserId && us.type === 'can_teach')
    .map(us => us.skill_id);

  const targetWantToLearnIds = userSkills
    .filter(us => us.user_id === targetUserId && us.type !== 'can_teach')
    .map(us => us.skill_id);

  const potentialMentors = [];
  const potentialLearners = [];

  // Iterate all user skills to find overlap
  for (const us of userSkills) {
    if (us.user_id === targetUserId) continue;

    const otherUser = usersMap.get(us.user_id);
    const skill = skillsMap.get(us.skill_id);
    if (!otherUser || !skill) continue;

    // Is this person a mentor for our target?
    // (i.e. they teach what we want to learn)
    if (us.type === 'can_teach' && targetWantToLearnIds.includes(us.skill_id)) {
      potentialMentors.push({
        mentor: {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          role: otherUser.role,
          department: otherUser.department
        },
        skill: {
          id: skill.id,
          name: skill.name,
          category: skill.category
        },
        level: us.level
      });
    }

    // Is this person a learner from our target?
    // (i.e. they want to learn what we can teach)
    if (us.type !== 'can_teach' && targetCanTeachIds.includes(us.skill_id)) {
      potentialLearners.push({
        learner: {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          role: otherUser.role,
          department: otherUser.department
        },
        skill: {
          id: skill.id,
          name: skill.name,
          category: skill.category
        },
        level: us.level
      });
    }
  }

  return {
    user: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email
    },
    wantsToLearn: targetWantToLearnIds.map(id => skillsMap.get(id)?.name).filter(Boolean),
    canTeach: targetCanTeachIds.map(id => skillsMap.get(id)?.name).filter(Boolean),
    potentialMentors,
    potentialLearners
  };
}

/**
 * Filter users by specific skills.
 * Options:
 * - skillNames: array of skill names to search for (case-insensitive)
 * - matchAll: boolean, if true, the user must have ALL specified skills (AND condition).
 *             if false, the user can have ANY of the specified skills (OR condition).
 * - type: filter by 'can_teach' or 'want_to_learn'
 */
async function filterUsersBySkills(skillNames, { matchAll = false, type = null } = {}) {
  if (!skillNames || skillNames.length === 0) {
    return [];
  }

  const { users, skills, userSkills } = await fetchRawData();

  // Normalize search skill names
  const searchNames = skillNames.map(s => s.trim().toLowerCase());

  // Find corresponding skill records
  const matchedSkillIds = skills
    .filter(s => searchNames.includes(s.name.trim().toLowerCase()))
    .map(s => s.id);

  if (matchedSkillIds.length === 0) {
    return [];
  }

  const usersMap = new Map(users.map(u => [u.id, u]));
  const skillsMap = new Map(skills.map(s => [s.id, s]));

  // Group user skills by user_id
  const userMap = {};

  for (const us of userSkills) {
    // Apply type filter if specified
    if (type && us.type !== type) continue;

    if (!matchedSkillIds.includes(us.skill_id)) continue;

    if (!userMap[us.user_id]) {
      userMap[us.user_id] = {
        user: usersMap.get(us.user_id),
        matchedSkills: []
      };
    }

    userMap[us.user_id].matchedSkills.push({
      id: us.skill_id,
      name: skillsMap.get(us.skill_id)?.name,
      type: us.type,
      level: us.level
    });
  }

  const results = Object.values(userMap).filter(item => {
    if (!item.user) return false;

    if (matchAll) {
      // Must match every search skill ID that we resolved
      const userMatchedSkillIds = item.matchedSkills.map(ms => ms.id);
      return matchedSkillIds.every(id => userMatchedSkillIds.includes(id));
    }

    return true; // OR condition
  });

  return results.map(r => ({
    userId: r.user.id,
    name: r.user.name,
    email: r.user.email,
    role: r.user.role,
    department: r.user.department,
    matchedSkills: r.matchedSkills
  }));
}

module.exports = {
  fetchRawData,
  groupUsersBySkill,
  groupSkillsByUser,
  matchSkillsForUser,
  filterUsersBySkills
};

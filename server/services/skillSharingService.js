const supabase = require('../lib/supabase');

/**
 * Fetch raw data for users, skills, and user_skills
 */
async function fetchRawData() {
  const [usersResponse, skillsResponse, userSkillsResponse] = await Promise.all([
    supabase.from('users').select('id, name, email, role, department, profile_image, avg_rating'),
    supabase.from('skills').select('id, name, category'),
    supabase.from('user_skills').select('user_id, skill_id, type, level')
  ]);

  if (usersResponse.error) throw new Error(`Failed to fetch users: ${usersResponse.error.message}`);
  if (skillsResponse.error) throw new Error(`Failed to fetch skills: ${skillsResponse.error.message}`);
  if (userSkillsResponse.error) throw new Error(`Failed to fetch user_skills: ${userSkillsResponse.error.message}`);

  return {
    users: usersResponse.data || [],
    skills: skillsResponse.data || [],
    userSkills: userSkillsResponse.data || []
  };
}

/**
 * Group users by skill
 */
async function groupUsersBySkill() {
  const { users, skills, userSkills } = await fetchRawData();

  const usersMap = new Map(users.map(u => [u.id, u]));
  const grouped = {};

  for (const skill of skills) {
    grouped[skill.id] = {
      id: skill.id,
      name: skill.name,
      category: skill.category,
      people: []
    };
  }

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
        profileImage: user.profile_image,
        avgRating: user.avg_rating,
        type: us.type,
        level: us.level
      });
    }
  }

  return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Group skills by user
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
      avgRating: u.avg_rating,
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
        userRecord.wantToLearn.push(skillDetail);
      }
    }
  }

  return Object.values(userSkillsGrouped).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Match mentorship / learners for target user
 */
async function matchSkillsForUser(targetUserId) {
  const { users, skills, userSkills } = await fetchRawData();

  const targetUser = users.find(u => u.id === targetUserId);
  if (!targetUser) {
    throw new Error(`User with ID ${targetUserId} not found.`);
  }

  const skillsMap = new Map(skills.map(s => [s.id, s]));
  const usersMap = new Map(users.map(u => [u.id, u]));

  const targetCanTeachIds = userSkills
    .filter(us => us.user_id === targetUserId && us.type === 'can_teach')
    .map(us => us.skill_id);

  const targetWantToLearnIds = userSkills
    .filter(us => us.user_id === targetUserId && us.type !== 'can_teach')
    .map(us => us.skill_id);

  const potentialMentors = [];
  const potentialLearners = [];

  for (const us of userSkills) {
    if (us.user_id === targetUserId) continue;

    const otherUser = usersMap.get(us.user_id);
    const skill = skillsMap.get(us.skill_id);
    if (!otherUser || !skill) continue;

    if (us.type === 'can_teach' && targetWantToLearnIds.includes(us.skill_id)) {
      potentialMentors.push({
        mentor: {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          role: otherUser.role,
          department: otherUser.department,
          profileImage: otherUser.profile_image
        },
        skill: {
          id: skill.id,
          name: skill.name,
          category: skill.category
        },
        level: us.level
      });
    }

    if (us.type !== 'can_teach' && targetCanTeachIds.includes(us.skill_id)) {
      potentialLearners.push({
        learner: {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          role: otherUser.role,
          department: otherUser.department,
          profileImage: otherUser.profile_image
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
 * Filter users by specific skills (AND/OR logic)
 */
async function filterUsersBySkills(skillNames, { matchAll = false, type = null } = {}) {
  if (!skillNames || skillNames.length === 0) {
    return [];
  }

  const { users, skills, userSkills } = await fetchRawData();

  const searchNames = skillNames.map(s => s.trim().toLowerCase());
  const matchedSkillIds = skills
    .filter(s => searchNames.includes(s.name.trim().toLowerCase()))
    .map(s => s.id);

  if (matchedSkillIds.length === 0) {
    return [];
  }

  const usersMap = new Map(users.map(u => [u.id, u]));
  const skillsMap = new Map(skills.map(s => [s.id, s]));

  const userMap = {};

  for (const us of userSkills) {
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
      const userMatchedSkillIds = item.matchedSkills.map(ms => ms.id);
      return matchedSkillIds.every(id => userMatchedSkillIds.includes(id));
    }
    return true;
  });

  return results.map(r => ({
    userId: r.user.id,
    name: r.user.name,
    email: r.user.email,
    role: r.user.role,
    department: r.user.department,
    profileImage: r.user.profile_image,
    matchedSkills: r.matchedSkills
  }));
}

/**
 * Compute Venn Diagram subsets for selected skills (2 or 3 skills)
 */
async function getVennDiagramData({ skillIds = [], skillNames = [], type = null }) {
  const { users, skills, userSkills } = await fetchRawData();

  let targetSkills = [];

  if (skillIds && skillIds.length > 0) {
    targetSkills = skills.filter(s => skillIds.includes(s.id));
  } else if (skillNames && skillNames.length > 0) {
    const searchNames = skillNames.map(s => s.trim().toLowerCase());
    targetSkills = skills.filter(s => searchNames.includes(s.name.trim().toLowerCase()));
  }

  // If less than 2 skills requested, pick top 2 or 3 skills with highest user count
  if (targetSkills.length < 2) {
    const skillCounts = {};
    for (const us of userSkills) {
      if (type && us.type !== type) continue;
      skillCounts[us.skill_id] = (skillCounts[us.skill_id] || 0) + 1;
    }

    const sortedSkillIds = Object.keys(skillCounts).sort((a, b) => skillCounts[b] - skillCounts[a]);
    const topIds = sortedSkillIds.slice(0, 3);
    targetSkills = skills.filter(s => topIds.includes(s.id));

    // Fallback if database has fewer than 2 skills with users: take first 2 skills
    if (targetSkills.length < 2 && skills.length >= 2) {
      targetSkills = skills.slice(0, 2);
    }
  }

  // Limit to maximum 3 skills for Venn diagram visualization
  targetSkills = targetSkills.slice(0, 3);

  const usersMap = new Map(users.map(u => [u.id, u]));
  const skillsMap = new Map(skills.map(s => [s.id, s]));

  // Build a map of userId -> Set of skill_ids possessed by user (filtered by type if specified)
  const userSkillSets = new Map();
  const userSkillDetails = new Map();

  for (const us of userSkills) {
    if (type && us.type !== type) continue;
    if (!userSkillSets.has(us.user_id)) {
      userSkillSets.set(us.user_id, new Set());
      userSkillDetails.set(us.user_id, []);
    }
    userSkillSets.get(us.user_id).add(us.skill_id);
    userSkillDetails.get(us.user_id).push({
      skillId: us.skill_id,
      name: skillsMap.get(us.skill_id)?.name || 'Unknown',
      type: us.type,
      level: us.level
    });
  }

  const formatUser = (userId) => {
    const u = usersMap.get(userId);
    if (!u) return null;
    return {
      userId: u.id,
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      profileImage: u.profile_image,
      avgRating: u.avg_rating,
      skills: userSkillDetails.get(u.id) || []
    };
  };

  const skillA = targetSkills[0];
  const skillB = targetSkills[1];
  const skillC = targetSkills[2] || null;

  const sets = {};

  if (targetSkills.length === 2) {
    const onlyA = [];
    const onlyB = [];
    const intersectionAB = [];

    for (const [userId, userSkillsSet] of userSkillSets.entries()) {
      const hasA = userSkillsSet.has(skillA.id);
      const hasB = userSkillsSet.has(skillB.id);

      const formatted = formatUser(userId);
      if (!formatted) continue;

      if (hasA && hasB) {
        intersectionAB.push(formatted);
      } else if (hasA) {
        onlyA.push(formatted);
      } else if (hasB) {
        onlyB.push(formatted);
      }
    }

    sets.onlyA = { skill: skillA, users: onlyA, count: onlyA.length };
    sets.onlyB = { skill: skillB, users: onlyB, count: onlyB.length };
    sets.intersectionAB = { skills: [skillA, skillB], users: intersectionAB, count: intersectionAB.length };

  } else if (targetSkills.length === 3) {
    const onlyA = [];
    const onlyB = [];
    const onlyC = [];
    const intersectionAB = [];
    const intersectionAC = [];
    const intersectionBC = [];
    const intersectionABC = [];

    for (const [userId, userSkillsSet] of userSkillSets.entries()) {
      const hasA = userSkillsSet.has(skillA.id);
      const hasB = userSkillsSet.has(skillB.id);
      const hasC = userSkillsSet.has(skillC.id);

      const formatted = formatUser(userId);
      if (!formatted) continue;

      if (hasA && hasB && hasC) {
        intersectionABC.push(formatted);
      } else if (hasA && hasB) {
        intersectionAB.push(formatted);
      } else if (hasA && hasC) {
        intersectionAC.push(formatted);
      } else if (hasB && hasC) {
        intersectionBC.push(formatted);
      } else if (hasA) {
        onlyA.push(formatted);
      } else if (hasB) {
        onlyB.push(formatted);
      } else if (hasC) {
        onlyC.push(formatted);
      }
    }

    sets.onlyA = { skill: skillA, users: onlyA, count: onlyA.length };
    sets.onlyB = { skill: skillB, users: onlyB, count: onlyB.length };
    sets.onlyC = { skill: skillC, users: onlyC, count: onlyC.length };
    sets.intersectionAB = { skills: [skillA, skillB], users: intersectionAB, count: intersectionAB.length };
    sets.intersectionAC = { skills: [skillA, skillC], users: intersectionAC, count: intersectionAC.length };
    sets.intersectionBC = { skills: [skillB, skillC], users: intersectionBC, count: intersectionBC.length };
    sets.intersectionABC = { skills: [skillA, skillB, skillC], users: intersectionABC, count: intersectionABC.length };
  }

  return {
    targetSkills,
    skillsCount: targetSkills.length,
    typeFilter: type || 'all',
    sets
  };
}

module.exports = {
  fetchRawData,
  groupUsersBySkill,
  groupSkillsByUser,
  matchSkillsForUser,
  filterUsersBySkills,
  getVennDiagramData
};

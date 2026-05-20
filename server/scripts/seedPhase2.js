const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabase = require('../lib/supabase');

const SEED_PREFIX = '[phase2-seed]';

const usersSeed = [
  {
    name: 'Aarav Mehta',
    email: 'aarav.mehta.phase2@collaborate.local',
    role: 'undergrad',
    department: 'Computer Science',
    year_of_study: 2,
    student_id: 'UG-CS-2201',
    credits: 85,
    tech_stack: ['C++', 'React', 'Node.js'],
  },
  {
    name: 'Priya Nair',
    email: 'priya.nair.phase2@collaborate.local',
    role: 'undergrad',
    department: 'Information Technology',
    year_of_study: 3,
    student_id: 'UG-IT-2307',
    credits: 70,
    tech_stack: ['React', 'Next.js', 'Tailwind CSS'],
  },
  {
    name: 'Rohan Kulkarni',
    email: 'rohan.kulkarni.phase2@collaborate.local',
    role: 'undergrad',
    department: 'Cybersecurity',
    year_of_study: 4,
    student_id: 'UG-CY-2410',
    credits: 92,
    tech_stack: ['Python', 'Forensics', 'Linux'],
  },
  {
    name: 'Meera Iyer',
    email: 'meera.iyer.phase2@collaborate.local',
    role: 'postgrad',
    department: 'Artificial Intelligence',
    year_of_study: 5,
    student_id: 'PG-AI-5102',
    credits: 110,
    tech_stack: ['Python', 'PyTorch', 'NLP'],
  },
  {
    name: 'Prof. Vikram Sethi',
    email: 'vikram.sethi.phase2@collaborate.local',
    role: 'faculty',
    department: 'Computer Science',
    year_of_study: 7,
    student_id: 'FAC-CS-001',
    credits: 150,
    tech_stack: ['Algorithms', 'Systems Design', 'Research Mentoring'],
  },
];

const skillsSeed = [
  { name: 'Data Structures in C++', category: 'Core CS' },
  { name: 'React/Next.js', category: 'Frontend' },
  { name: 'Python for AI/ML', category: 'AI/ML' },
  { name: 'Cybersecurity Forensics', category: 'Security' },
  { name: 'System Design for Student Products', category: 'Architecture' },
  { name: 'Prompt Engineering for Research', category: 'AI Productivity' },
];

const userSkillSeed = [
  ['Aarav Mehta', 'Data Structures in C++', 'can_teach', 'advanced'],
  ['Aarav Mehta', 'React/Next.js', 'wants_to_learn', 'intermediate'],
  ['Aarav Mehta', 'System Design for Student Products', 'wants_to_learn', 'beginner'],

  ['Priya Nair', 'React/Next.js', 'can_teach', 'advanced'],
  ['Priya Nair', 'Python for AI/ML', 'wants_to_learn', 'beginner'],
  ['Priya Nair', 'Prompt Engineering for Research', 'wants_to_learn', 'intermediate'],

  ['Rohan Kulkarni', 'Cybersecurity Forensics', 'can_teach', 'advanced'],
  ['Rohan Kulkarni', 'Python for AI/ML', 'wants_to_learn', 'intermediate'],
  ['Rohan Kulkarni', 'React/Next.js', 'wants_to_learn', 'beginner'],

  ['Meera Iyer', 'Python for AI/ML', 'can_teach', 'advanced'],
  ['Meera Iyer', 'Prompt Engineering for Research', 'can_teach', 'advanced'],
  ['Meera Iyer', 'Cybersecurity Forensics', 'wants_to_learn', 'beginner'],

  ['Prof. Vikram Sethi', 'System Design for Student Products', 'can_teach', 'advanced'],
  ['Prof. Vikram Sethi', 'Data Structures in C++', 'can_teach', 'advanced'],
  ['Prof. Vikram Sethi', 'Prompt Engineering for Research', 'wants_to_learn', 'intermediate'],
];

const listingSeed = [
  {
    owner: 'Priya Nair',
    skill: 'React/Next.js',
    listing_type: 'offer',
    level: 'advanced',
    credit_rate: 18,
    format: 'one_on_one',
    max_group_size: null,
    description: `${SEED_PREFIX} Guided React/Next.js mentoring for project architecture, routing, and UI state.`,
    status: 'active',
  },
  {
    owner: 'Meera Iyer',
    skill: 'Python for AI/ML',
    listing_type: 'offer',
    level: 'advanced',
    credit_rate: 24,
    format: 'group',
    max_group_size: 4,
    description: `${SEED_PREFIX} Weekly AI/ML office hour for model pipelines, notebooks, and experiment structure.`,
    status: 'active',
  },
  {
    owner: 'Aarav Mehta',
    skill: 'System Design for Student Products',
    listing_type: 'request',
    level: 'beginner',
    credit_rate: 20,
    format: 'one_on_one',
    max_group_size: null,
    description: `${SEED_PREFIX} Looking for help translating hackathon prototypes into maintainable student product architecture.`,
    status: 'active',
  },
  {
    owner: 'Rohan Kulkarni',
    skill: 'Cybersecurity Forensics',
    listing_type: 'offer',
    level: 'advanced',
    credit_rate: 22,
    format: 'group',
    max_group_size: 3,
    description: `${SEED_PREFIX} Incident-response walkthroughs with log analysis and forensic investigation basics.`,
    status: 'active',
  },
  {
    owner: 'Prof. Vikram Sethi',
    skill: 'Data Structures in C++',
    listing_type: 'offer',
    level: 'advanced',
    credit_rate: 12,
    format: 'group',
    max_group_size: 5,
    description: `${SEED_PREFIX} Faculty-led review sessions covering graph problems, trees, and interview-oriented complexity analysis.`,
    status: 'active',
  },
];

const completedSessionSeed = [
  {
    listingOwner: 'Priya Nair',
    listingSkill: 'React/Next.js',
    teacher: 'Priya Nair',
    learner: 'Aarav Mehta',
    scheduled_at: '2026-05-06T14:00:00.000Z',
    duration_min: 75,
    credits_transacted: 18,
    agenda: `${SEED_PREFIX} Review dynamic routing, shared layout composition, and UI state management.`,
    rating: {
      rater: 'Aarav Mehta',
      ratee: 'Priya Nair',
      stars: 5,
      review: `${SEED_PREFIX} Clear explanations, strong frontend instincts, and practical feedback on component boundaries.`,
    },
  },
  {
    listingOwner: 'Meera Iyer',
    listingSkill: 'Python for AI/ML',
    teacher: 'Meera Iyer',
    learner: 'Rohan Kulkarni',
    scheduled_at: '2026-05-09T10:30:00.000Z',
    duration_min: 90,
    credits_transacted: 24,
    agenda: `${SEED_PREFIX} Build a small classification workflow and discuss feature engineering for student research projects.`,
    rating: {
      rater: 'Rohan Kulkarni',
      ratee: 'Meera Iyer',
      stars: 4,
      review: `${SEED_PREFIX} Strong ML grounding and good pacing. Would have liked a bit more time on dataset debugging.`,
    },
  },
];

const failIfError = (error, context) => {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
};

const average = (values) => {
  const nums = values.map(Number).filter((n) => Number.isFinite(n));
  if (!nums.length) return null;
  return Number((nums.reduce((sum, n) => sum + n, 0) / nums.length).toFixed(2));
};

async function ensureUsers() {
  const passwordHash = await bcrypt.hash('phase2seed123', 10);
  const rows = usersSeed.map((user) => ({
    name: user.name,
    email: user.email,
    password_hash: passwordHash,
    role: user.role,
    department: user.department,
    year_of_study: user.year_of_study,
    student_id: user.student_id,
    credits: user.credits,
    avg_rating: null,
    tech_stack: user.tech_stack,
    profile_image: '',
    mobile_number: '',
    bio: `${SEED_PREFIX} Seeded academic profile for Phase 2 verification.`,
    designation: user.role === 'faculty' ? 'Faculty Mentor' : '',
    custom_fields: {},
  }));

  const { error } = await supabase.from('users').upsert(rows, { onConflict: 'email' });
  failIfError(error, 'upserting users');

  const emails = usersSeed.map((user) => user.email);
  const { data, error: fetchError } = await supabase
    .from('users')
    .select('id,name,email,department,role,credits')
    .in('email', emails);
  failIfError(fetchError, 'fetching seeded users');

  const userMap = Object.fromEntries((data || []).map((user) => [user.name, user]));
  console.log(`Seeded users: ${Object.keys(userMap).length}`);
  return userMap;
}

async function ensureSkills() {
  const { error } = await supabase.from('skills').upsert(skillsSeed, { onConflict: 'name' });
  failIfError(error, 'upserting skills');

  const { data, error: fetchError } = await supabase
    .from('skills')
    .select('id,name,category')
    .in('name', skillsSeed.map((skill) => skill.name));
  failIfError(fetchError, 'fetching seeded skills');

  const skillMap = Object.fromEntries((data || []).map((skill) => [skill.name, skill]));
  console.log(`Seeded skills: ${Object.keys(skillMap).length}`);
  return skillMap;
}

async function ensureUserSkills(userMap, skillMap) {
  const facultyId = userMap['Prof. Vikram Sethi']?.id || null;
  const rows = userSkillSeed.map(([userName, skillName, type, level]) => ({
    user_id: userMap[userName].id,
    skill_id: skillMap[skillName].id,
    type,
    level,
    endorsed_by: type === 'can_teach' && userName !== 'Prof. Vikram Sethi' ? facultyId : null,
    endorsed_at: type === 'can_teach' && userName !== 'Prof. Vikram Sethi' ? new Date().toISOString() : null,
  }));

  const { error } = await supabase
    .from('user_skills')
    .upsert(rows, { onConflict: 'user_id,skill_id,type' });
  failIfError(error, 'upserting user skills');
  console.log(`Seeded user skills: ${rows.length}`);
}

async function replaceSeedListings(userMap, skillMap) {
  const ownerIds = [...new Set(listingSeed.map((listing) => userMap[listing.owner].id))];

  const { data: existing, error: existingError } = await supabase
    .from('exchange_listings')
    .select('id')
    .in('user_id', ownerIds)
    .ilike('description', `${SEED_PREFIX}%`);
  failIfError(existingError, 'finding prior seeded listings');

  const existingIds = (existing || []).map((row) => row.id);
  if (existingIds.length) {
    const { error: deleteSessionsError } = await supabase
      .from('sessions')
      .delete()
      .in('listing_id', existingIds);
    failIfError(deleteSessionsError, 'deleting prior seeded sessions');

    const { error: deleteListingsError } = await supabase
      .from('exchange_listings')
      .delete()
      .in('id', existingIds);
    failIfError(deleteListingsError, 'deleting prior seeded listings');
  }

  const rows = listingSeed.map((listing) => ({
    user_id: userMap[listing.owner].id,
    skill_id: skillMap[listing.skill].id,
    listing_type: listing.listing_type,
    level: listing.level,
    credit_rate: listing.credit_rate,
    format: listing.format,
    max_group_size: listing.max_group_size,
    description: listing.description,
    status: listing.status,
  }));

  const { data, error } = await supabase
    .from('exchange_listings')
    .insert(rows)
    .select('id,user_id,skill_id,listing_type');
  failIfError(error, 'inserting exchange listings');

  console.log(`Seeded listings: ${(data || []).length}`);
  return data || [];
}

async function replaceSeedSessionsAndRatings(userMap, skillMap, listings) {
  const seededListingMap = Object.fromEntries(
    listings.map((listing) => [`${listing.user_id}:${listing.skill_id}:${listing.listing_type}`, listing])
  );

  const sessionRows = completedSessionSeed.map((item) => {
    const listingKey = `${userMap[item.listingOwner].id}:${skillMap[item.listingSkill].id}:offer`;
    const listing = seededListingMap[listingKey];
    if (!listing) {
      throw new Error(`Missing seeded listing for session seed: ${item.listingOwner} / ${item.listingSkill}`);
    }

    return {
      listing_id: listing.id,
      teacher_id: userMap[item.teacher].id,
      learner_id: userMap[item.learner].id,
      scheduled_at: item.scheduled_at,
      duration_min: item.duration_min,
      status: 'completed',
      credits_transacted: item.credits_transacted,
      agenda: item.agenda,
      ai_summary: `${SEED_PREFIX} Completed seed session for Phase 2 UI validation.`,
      meeting_id: null,
    };
  });

  const { data: insertedSessions, error: sessionError } = await supabase
    .from('sessions')
    .insert(sessionRows)
    .select('id,teacher_id,learner_id');
  failIfError(sessionError, 'inserting completed sessions');

  const ratingRows = insertedSessions.map((session, index) => {
    const seed = completedSessionSeed[index];
    return {
      session_id: session.id,
      rater_id: userMap[seed.rating.rater].id,
      ratee_id: userMap[seed.rating.ratee].id,
      stars: seed.rating.stars,
      review: seed.rating.review,
      is_flagged: false,
    };
  });

  const { error: ratingError } = await supabase.from('ratings').insert(ratingRows);
  failIfError(ratingError, 'inserting ratings');

  const rateeIds = [...new Set(ratingRows.map((row) => row.ratee_id))];
  for (const rateeId of rateeIds) {
    const stars = ratingRows.filter((row) => row.ratee_id === rateeId).map((row) => row.stars);
    const { error: updateError } = await supabase
      .from('users')
      .update({ avg_rating: average(stars) })
      .eq('id', rateeId);
    failIfError(updateError, `updating avg_rating for ${rateeId}`);
  }

  console.log(`Seeded completed sessions: ${(insertedSessions || []).length}`);
  console.log(`Seeded ratings: ${ratingRows.length}`);
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  }

  console.log('Seeding Phase 2 dataset...');

  const userMap = await ensureUsers();
  const skillMap = await ensureSkills();
  await ensureUserSkills(userMap, skillMap);
  const listings = await replaceSeedListings(userMap, skillMap);
  await replaceSeedSessionsAndRatings(userMap, skillMap, listings);

  console.log('Phase 2 seed completed successfully.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Phase 2 seed failed:', error.message);
    process.exit(1);
  });

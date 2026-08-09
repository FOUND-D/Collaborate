/**
 * Simulates how the Flutter Android app registers, logs in, and prefetches data.
 *
 * Flutter flow:
 *   RegisterScreen → POST /api/users/register
 *   AuthProvider.login → POST /api/users/login → save token
 *   WorkspaceProvider.prefetchEssentials → parallel GETs (projects, tasks, teams, orgs, stats, matches)
 *
 * Usage:
 *   node server/scripts/flutterLoginFetch.js
 *   node server/scripts/flutterLoginFetch.js --register
 *   API_BASE_URL=http://localhost:3002 node server/scripts/flutterLoginFetch.js --register
 */

const axios = require('axios');

const DEFAULT_BASE_URL = 'https://collaborate-1.onrender.com';
const REQUEST_TIMEOUT_MS = 30_000;

const EMAIL = process.env.LOGIN_EMAIL || 'id978900@gmail.com';
const PASSWORD = process.env.LOGIN_PASSWORD || 'ggfhggfh';
const BASE_URL = (process.env.API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
const SHOULD_REGISTER = process.argv.includes('--register') || process.env.REGISTER === '1';

const REGISTER_PAYLOAD = {
  name: process.env.REGISTER_NAME || 'Test User',
  email: EMAIL,
  password: PASSWORD,
  department: process.env.REGISTER_DEPARTMENT || 'Computer Science',
  role: 'student',
  yearOfStudy: 1,
  studentId: process.env.REGISTER_STUDENT_ID || 'TEST978900',
  profileImage: process.env.REGISTER_PROFILE_IMAGE || 'https://ui-avatars.com/api/?name=Test+User',
};

function createClient(token) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return axios.create({
    baseURL: BASE_URL,
    timeout: REQUEST_TIMEOUT_MS,
    headers,
    validateStatus: (status) => status >= 200 && status < 300,
  });
}

function redactUser(user) {
  if (!user || typeof user !== 'object') return user;
  const { password, password_hash, ...safe } = user;
  return safe;
}

async function register(client) {
  const { data } = await client.post('/api/users/register', REGISTER_PAYLOAD, {
    headers: { 'Content-Type': 'application/json' },
  });
  return data;
}

async function login(client) {
  const { data } = await client.post(
    '/api/users/login',
    { email: EMAIL, password: PASSWORD },
    { headers: { 'Content-Type': 'application/json' } },
  );
  return data;
}

async function get(client, path, label) {
  const { data } = await client.get(path);
  const count = Array.isArray(data) ? data.length : (data && typeof data === 'object' ? Object.keys(data).length : 0);
  console.log(`  ✓ ${label} — ${Array.isArray(data) ? `${count} item(s)` : 'OK'}`);
  return data;
}

async function runPrefetch(client) {
  console.log('→ Workspace prefetch (parallel, like WorkspaceProvider.prefetchEssentials)');

  const results = await Promise.allSettled([
    get(client, '/api/projects', 'GET /api/projects'),
    get(client, '/api/tasks', 'GET /api/tasks'),
    get(client, '/api/teams', 'GET /api/teams'),
    get(client, '/api/organisations', 'GET /api/organisations'),
    get(client, '/api/users/me/stats', 'GET /api/users/me/stats'),
    get(client, '/api/skills/matches', 'GET /api/skills/matches'),
  ]);

  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length) {
    for (const f of failed) {
      const err = f.reason;
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message;
      console.error(`  ✗ ${status ? `(${status})` : ''} ${message}`);
    }
    throw new Error(`${failed.length} prefetch request(s) failed`);
  }

  return {
    projects: results[0].value,
    tasks: results[1].value,
    teams: results[2].value,
    organisations: results[3].value,
    stats: results[4].value,
    skillMatches: results[5].value,
  };
}

async function main() {
  console.log('Flutter Android API end-to-end test');
  console.log(`  Base URL : ${BASE_URL}`);
  console.log(`  Email    : ${EMAIL}`);
  console.log(`  Register : ${SHOULD_REGISTER ? 'yes (create if needed)' : 'no (login only)'}`);
  console.log('');

  const client = createClient();
  let loginResponse;

  if (SHOULD_REGISTER) {
    console.log('→ POST /api/users/register');
    try {
      loginResponse = await register(client);
      console.log('✓ Account created');
      console.log(`  User ID : ${loginResponse._id || loginResponse.id}`);
      console.log(`  Token   : ${String(loginResponse.token).slice(0, 20)}…`);
      console.log('');
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message;
      if (status === 400 && message === 'User already exists') {
        console.log('  (account already exists — will log in instead)');
        console.log('');
      } else {
        console.error(`✗ Register failed${status ? ` (${status})` : ''}: ${message}`);
        process.exit(1);
      }
    }
  }

  if (!loginResponse?.token) {
    console.log('→ POST /api/users/login');
    try {
      loginResponse = await login(client);
      console.log('✓ Login OK');
      console.log(`  User ID : ${loginResponse._id || loginResponse.id}`);
      console.log(`  Name    : ${loginResponse.name}`);
      console.log(`  Role    : ${loginResponse.role}`);
      console.log(`  Token   : ${String(loginResponse.token).slice(0, 20)}…`);
      console.log('');
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message;
      console.error(`✗ Login failed${status ? ` (${status})` : ''}: ${message}`);
      if (!SHOULD_REGISTER) {
        console.error('  Tip: run with --register to create the account first.');
      }
      process.exit(1);
    }
  }

  const token = loginResponse.token;
  const authed = createClient(token);

  console.log('→ GET /api/users/profile');
  const profile = await get(authed, '/api/users/profile', 'profile');
  console.log(JSON.stringify(redactUser(profile), null, 2));
  console.log('');

  const prefetch = await runPrefetch(authed);
  console.log('');
  console.log('Summary');
  console.log(`  Projects      : ${prefetch.projects.length}`);
  console.log(`  Tasks         : ${prefetch.tasks.length}`);
  console.log(`  Teams         : ${prefetch.teams.length}`);
  console.log(`  Organisations : ${prefetch.organisations.length}`);
  console.log(`  Skill matches : ${prefetch.skillMatches.length}`);
  console.log(`  Stats keys    : ${Object.keys(prefetch.stats || {}).join(', ') || 'none'}`);
  console.log('');
  console.log('All Flutter-style API calls succeeded.');
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});

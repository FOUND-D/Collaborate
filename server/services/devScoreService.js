const axios = require('axios');
const { supabase } = require('../lib/repo');

// ---------------------------------------------------------------------------
// Pure scoring functions (no I/O)
// ---------------------------------------------------------------------------

// GitHub score: out of 100
// Factors: followers, repos, stars, forks, total commits (all log-scaled)
function computeGithubScoreObj({ followers = 0, publicRepos = 0, totalStars = 0, totalForks = 0, totalCommits = 0 }) {
  const score =
    Math.log10(totalStars + 1) * 18 +
    Math.log10(followers + 1) * 14 +
    Math.min(publicRepos, 50) * 0.5 +
    Math.log10(totalForks + 1) * 9 +
    Math.log10(totalCommits + 1) * 15;
  const result = Math.min(100, Math.round(score * 100) / 100);
  console.log(`[DevScore][GitHub] scoreObj inputs → followers=${followers} repos=${publicRepos} stars=${totalStars} forks=${totalForks} commits=${totalCommits} → raw=${score.toFixed(4)} → result=${result}`);
  return result;
}

// LeetCode score: out of 100
// Weighted ratio (easy 25%, medium 35%, hard 40%) using sqrt curve
// so early solves are rewarded visibly (e.g. 56 solved ≈ 11–15 pts)
function computeLeetcodeScoreObj({ easySolved = 0, totalEasy = 954, mediumSolved = 0, totalMedium = 2084, hardSolved = 0, totalHard = 953 }) {
  const easyRatio   = totalEasy   > 0 ? easySolved   / totalEasy   : 0;
  const mediumRatio = totalMedium > 0 ? mediumSolved / totalMedium : 0;
  const hardRatio   = totalHard   > 0 ? hardSolved   / totalHard   : 0;

  // raw is on 0–1 scale (weights sum to 1.0, not 100)
  const raw = easyRatio * 0.25 + mediumRatio * 0.35 + hardRatio * 0.40;
  const score = Math.sqrt(raw) * 100;
  const result = Math.min(100, Math.round(score * 100) / 100);
  console.log(`[DevScore][LeetCode] scoreObj inputs → easy=${easySolved}/${totalEasy} med=${mediumSolved}/${totalMedium} hard=${hardSolved}/${totalHard} → raw=${raw.toFixed(6)} sqrt=${Math.sqrt(raw).toFixed(6)} → result=${result}`);
  return result;
}

// ---------------------------------------------------------------------------
// Data-fetching functions
// ---------------------------------------------------------------------------

async function computeGithubScore(githubUsername, showPrivate) {
  console.log(`[DevScore][GitHub] computeGithubScore called → username="${githubUsername}" showPrivate=${showPrivate}`);
  if (!githubUsername) {
    console.log('[DevScore][GitHub] No username provided, returning 0');
    return 0;
  }

  try {
    const headers = { 'User-Agent': 'collaborate-app' };
    // Always use PAT when available — raises rate limit from 60/hr to 5000/hr
    if (process.env.GITHUB_PAT) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_PAT}`;
    }

    let reposUrl = `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=100`;

    if (showPrivate && process.env.GITHUB_PAT) {
      reposUrl = `https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator`;
      console.log('[DevScore][GitHub] Using PAT for private repos');
    } else {
      console.log(`[DevScore][GitHub] Fetching public repos (PAT=${process.env.GITHUB_PAT ? 'yes' : 'NO - rate limited to 60/hr!'})`);
    }

    console.log(`[DevScore][GitHub] Fetching user profile + repos...`);
    const [userRes, reposRes] = await Promise.all([
      axios.get(`https://api.github.com/users/${githubUsername}`, { headers }),
      axios.get(reposUrl, { headers })
    ]);

    const ghUser = userRes.data;
    let repos = reposRes.data;

    console.log(`[DevScore][GitHub] API success → followers=${ghUser.followers} public_repos=${ghUser.public_repos} repos_returned=${repos.length}`);

    if (showPrivate && process.env.GITHUB_PAT) {
      repos = repos.filter(repo => repo.owner.login.toLowerCase() === githubUsername.toLowerCase());
      console.log(`[DevScore][GitHub] After owner-filter: ${repos.length} repos`);
    }

    let totalStars = 0;
    let totalForks = 0;
    let totalCommits = 0;

    for (const repo of repos) {
      totalStars += (repo.stargazers_count || 0);
      totalForks += (repo.forks_count || 0);
    }
    console.log(`[DevScore][GitHub] totalStars=${totalStars} totalForks=${totalForks}`);

    // Fetch commit counts per repo (best-effort, top 30 repos)
    try {
      console.log(`[DevScore][GitHub] Fetching commit counts for ${Math.min(repos.length, 30)} repos...`);
      const commitCounts = await Promise.all(
        repos.slice(0, 30).map(repo =>
          axios.get(
            `https://api.github.com/repos/${repo.full_name}/commits?per_page=1`,
            { headers }
          ).then(r => {
            const link = r.headers['link'] || '';
            const match = link.match(/page=(\d+)>; rel="last"/);
            const count = match ? parseInt(match[1], 10) : (r.data?.length || 0);
            return count;
          }).catch(err => {
            console.warn(`[DevScore][GitHub] commit fetch failed for ${repo.full_name}: ${err.message}`);
            return 0;
          })
        )
      );
      totalCommits = commitCounts.reduce((a, b) => a + b, 0);
      console.log(`[DevScore][GitHub] totalCommits across top-30 repos = ${totalCommits}`);
    } catch (commitErr) {
      console.warn('[DevScore][GitHub] Commit count fetch block failed:', commitErr.message);
    }

    return computeGithubScoreObj({
      followers:   ghUser.followers,
      publicRepos: ghUser.public_repos,
      totalStars,
      totalForks,
      totalCommits,
    });
  } catch (error) {
    console.error('[DevScore][GitHub] FETCH FAILED:', error.message);
    if (error.response) {
      console.error(`[DevScore][GitHub] HTTP ${error.response.status}:`, JSON.stringify(error.response.data));
    }
    return null;
  }
}

async function computeLeetcodeScore(leetcodeUsername) {
  console.log(`[DevScore][LeetCode] computeLeetcodeScore called → username="${leetcodeUsername}"`);
  if (!leetcodeUsername) {
    console.log('[DevScore][LeetCode] No username provided, returning 0');
    return 0;
  }

  // Try alfa-leetcode-api first (Render-hosted → reliable from server IPs, won't block like Vercel free tier)
  // Fallback to faisalshohag if alfa is down
  const apis = [
    {
      name: 'alfa-leetcode-api',
      url: `https://alfa-leetcode-api.onrender.com/${leetcodeUsername}/solved`,
      parse: (data) => ({
        easySolved:   data.easySolved   ?? 0,
        mediumSolved: data.mediumSolved ?? 0,
        hardSolved:   data.hardSolved   ?? 0,
        totalEasy:    954,
        totalMedium:  2084,
        totalHard:    953,
      }),
      isError: (data) => !data || data.errors || data.message === 'Not Found',
    },
    {
      name: 'faisalshohag',
      url: `https://leetcode-api-faisalshohag.vercel.app/${leetcodeUsername}`,
      parse: (data) => ({
        easySolved:   data.easySolved   ?? data.easy   ?? 0,
        mediumSolved: data.mediumSolved ?? data.medium ?? 0,
        hardSolved:   data.hardSolved   ?? data.hard   ?? 0,
        totalEasy:    data.totalEasy    ?? 954,
        totalMedium:  data.totalMedium  ?? 2084,
        totalHard:    data.totalHard    ?? 953,
      }),
      isError: (data) => !data || data.errors || data.message === 'Not Found',
    },
  ];

  for (const api of apis) {
    console.log(`[DevScore][LeetCode] Trying ${api.name}: ${api.url}`);
    try {
      const res = await axios.get(api.url, { timeout: 12000 });
      const data = res.data;
      console.log(`[DevScore][LeetCode] ${api.name} response:`, JSON.stringify(data));

      if (api.isError(data)) {
        throw new Error(`LeetCode user not found or error response from ${api.name}`);
      }

      const parsed = api.parse(data);
      console.log(`[DevScore][LeetCode] Parsed → easy=${parsed.easySolved}/${parsed.totalEasy} med=${parsed.mediumSolved}/${parsed.totalMedium} hard=${parsed.hardSolved}/${parsed.totalHard}`);
      return computeLeetcodeScoreObj(parsed);
    } catch (error) {
      console.error(`[DevScore][LeetCode] ${api.name} FAILED: ${error.message}`);
      if (error.response) {
        console.error(`[DevScore][LeetCode] HTTP ${error.response.status}:`, JSON.stringify(error.response.data));
      }
      // Continue to next API
    }
  }

  console.error('[DevScore][LeetCode] All APIs failed, returning null');
  return null;
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

async function computeDevScore(user) {
  console.log('[DevScore] ========== computeDevScore START ==========');
  console.log('[DevScore] user.id =', user.id || user._id);
  console.log('[DevScore] user keys =', Object.keys(user).join(', '));

  // Support both camelCase (from getUserById/updateUser) and snake_case (raw Supabase rows)
  const githubUsername     = user.github_username   || user.githubUsername   || '';
  const leetcodeUsername   = user.leetcode_username || user.leetcodeUsername || '';
  const githubShowPrivate  = user.github_show_private ?? user.githubShowPrivate ?? false;
  const fallbackGithubScore   = user.github_score  ?? user.githubScore   ?? 0;
  const fallbackLeetcodeScore = user.leetcode_score ?? user.leetcodeScore ?? 0;

  console.log(`[DevScore] githubUsername="${githubUsername}" leetcodeUsername="${leetcodeUsername}" showPrivate=${githubShowPrivate}`);
  console.log(`[DevScore] fallbackGithubScore=${fallbackGithubScore} fallbackLeetcodeScore=${fallbackLeetcodeScore}`);

  const hasGithub   = !!githubUsername;
  const hasLeetcode = !!leetcodeUsername;
  console.log(`[DevScore] hasGithub=${hasGithub} hasLeetcode=${hasLeetcode}`);

  let githubScore = 0;
  if (hasGithub) {
    const freshScore = await computeGithubScore(githubUsername, githubShowPrivate);
    console.log(`[DevScore] freshGithubScore=${freshScore}`);
    githubScore = freshScore !== null ? freshScore : fallbackGithubScore;
    console.log(`[DevScore] githubScore used=${githubScore} (${freshScore !== null ? 'fresh' : 'fallback'})`);
  }

  let leetcodeScore = 0;
  if (hasLeetcode) {
    const freshScore = await computeLeetcodeScore(leetcodeUsername);
    console.log(`[DevScore] freshLeetcodeScore=${freshScore}`);
    leetcodeScore = freshScore !== null ? freshScore : fallbackLeetcodeScore;
    console.log(`[DevScore] leetcodeScore used=${leetcodeScore} (${freshScore !== null ? 'fresh' : 'fallback'})`);
  }

  let devScore;
  if (hasGithub && hasLeetcode) {
    devScore = (githubScore + leetcodeScore) / 2;
    console.log(`[DevScore] Combined (both): (${githubScore} + ${leetcodeScore}) / 2 = ${devScore}`);
  } else if (hasGithub) {
    devScore = githubScore;
    console.log(`[DevScore] GitHub only: ${devScore}`);
  } else if (hasLeetcode) {
    devScore = leetcodeScore;
    console.log(`[DevScore] LeetCode only: ${devScore}`);
  } else {
    devScore = 0;
    console.log('[DevScore] No accounts connected → devScore=0');
  }

  devScore = Math.round(devScore * 100) / 100;
  console.log(`[DevScore] Final devScore=${devScore}`);

  const devScoreUpdatedAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('users')
    .update({
      dev_score: devScore,
      github_score: githubScore,
      leetcode_score: leetcodeScore,
      dev_score_updated_at: devScoreUpdatedAt,
    })
    .eq('id', user.id || user._id);

  if (updateError) {
    console.error('[DevScore] Supabase update FAILED:', updateError.message);
  } else {
    console.log('[DevScore] Supabase update SUCCESS');
  }

  console.log('[DevScore] ========== computeDevScore END ==========');

  return { devScore, githubScore, leetcodeScore, devScoreUpdatedAt };
}

module.exports = {
  computeDevScore,
  computeGithubScore,
  computeLeetcodeScore,
};

const axios = require('axios');
const { supabase } = require('../lib/repo');

function computeGithubScoreObj({ followers = 0, publicRepos = 0, totalStars = 0, totalForks = 0 }) {
  const score =
    Math.log10(totalStars + 1) * 20 +
    Math.log10(followers + 1) * 15 +
    Math.min(publicRepos, 50) * 0.6 +
    Math.log10(totalForks + 1) * 10;
  return Math.min(100, Math.round(score * 100) / 100);
}

function computeLeetcodeScoreObj({ easySolved = 0, mediumSolved = 0, hardSolved = 0, contributionPoint = 0 }) {
  const raw = easySolved * 1 + mediumSolved * 3 + hardSolved * 6;
  const score = raw * 0.15 + Math.log10(contributionPoint + 1) * 5;
  return Math.min(100, Math.round(score * 100) / 100);
}

async function computeGithubScore(githubUsername, showPrivate) {
  if (!githubUsername) return 0;
  try {
    const headers = {};
    let reposUrl = `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=100`;

    if (showPrivate && process.env.GITHUB_PAT) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_PAT}`;
      reposUrl = `https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator`;
    }

    const [userRes, reposRes] = await Promise.all([
      axios.get(`https://api.github.com/users/${githubUsername}`, { headers }),
      axios.get(reposUrl, { headers })
    ]);

    const user = userRes.data;
    let repos = reposRes.data;

    if (showPrivate && process.env.GITHUB_PAT) {
      repos = repos.filter(repo => repo.owner.login.toLowerCase() === githubUsername.toLowerCase());
    }

    let totalStars = 0;
    let totalForks = 0;

    for (const repo of repos) {
      totalStars += (repo.stargazers_count || 0);
      totalForks += (repo.forks_count || 0);
    }

    return computeGithubScoreObj({
      followers: user.followers,
      publicRepos: user.public_repos,
      totalStars,
      totalForks
    });
  } catch (error) {
    console.error('Error fetching Github stats for Dev Score:', error.message);
    return null; // Return null to indicate fetch failure, so we can use last known score
  }
}

async function computeLeetcodeScore(leetcodeUsername) {
  if (!leetcodeUsername) return 0;
  try {
    const res = await axios.get(`https://leetcode-api-faisalshohag.vercel.app/${leetcodeUsername}`);
    const data = res.data;
    
    // The API might return an error structure if not found
    if (data.errors || data.message === "Not Found") {
      throw new Error("Leetcode user not found");
    }

    return computeLeetcodeScoreObj({
      easySolved: data.totalEasy || data.easySolved || 0,
      mediumSolved: data.totalMedium || data.mediumSolved || 0,
      hardSolved: data.totalHard || data.hardSolved || 0,
      contributionPoint: data.contributionPoint || 0
    });
  } catch (error) {
    console.error('Error fetching Leetcode stats for Dev Score:', error.message);
    return null; // Return null to indicate fetch failure
  }
}

async function computeDevScore(user) {
  const githubUsername = user.github_username || user.githubUsername;
  const leetcodeUsername = user.leetcode_username || user.leetcodeUsername;
  const githubShowPrivate = user.github_show_private || user.githubShowPrivate;

  const hasGithub = !!githubUsername;
  const hasLeetcode = !!leetcodeUsername;

  let githubScore = 0;
  if (hasGithub) {
    const freshScore = await computeGithubScore(githubUsername, githubShowPrivate);
    githubScore = freshScore !== null ? freshScore : (user.github_score || user.githubScore || 0);
  }

  let leetcodeScore = 0;
  if (hasLeetcode) {
    const freshScore = await computeLeetcodeScore(leetcodeUsername);
    leetcodeScore = freshScore !== null ? freshScore : (user.leetcode_score || user.leetcodeScore || 0);
  }

  let devScore;
  if (hasGithub && hasLeetcode) {
    devScore = (githubScore + leetcodeScore) / 2;
  } else if (hasGithub) {
    devScore = githubScore;
  } else if (hasLeetcode) {
    devScore = leetcodeScore;
  } else {
    devScore = 0;
  }

  devScore = Math.round(devScore * 100) / 100;

  const devScoreUpdatedAt = new Date().toISOString();

  await supabase
    .from('users')
    .update({ 
      dev_score: devScore, 
      github_score: githubScore, 
      leetcode_score: leetcodeScore, 
      dev_score_updated_at: devScoreUpdatedAt 
    })
    .eq('id', user.id || user._id);

  return {
    devScore,
    githubScore,
    leetcodeScore,
    devScoreUpdatedAt
  };
}

module.exports = {
  computeDevScore,
  computeGithubScore,
  computeLeetcodeScore
};

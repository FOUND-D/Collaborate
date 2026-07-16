-- Dev Score: a verifiable reputation score computed from GitHub + LeetCode activity.
-- Replaces the credits currency for ranking/search/leaderboard purposes.
-- Credits column is left in place (unused going forward) but no longer spent on sessions.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS dev_score NUMERIC(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS github_score NUMERIC(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leetcode_score NUMERIC(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dev_score_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_dev_score ON users (dev_score DESC);


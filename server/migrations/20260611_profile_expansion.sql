-- Migration: Add social and profile expansion fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS github_username TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS leetcode_username TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
  ADD COLUMN IF NOT EXISTS showcased_project_ids UUID[],
  ADD COLUMN IF NOT EXISTS bio TEXT;

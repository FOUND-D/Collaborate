-- Migration: Add GitHub repository field to teams table
-- Stores the repo as 'owner/repo-name' (e.g. 'facebook/react') or full GitHub URL

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS github_repo TEXT;

CREATE INDEX IF NOT EXISTS idx_teams_github_repo ON public.teams(github_repo);

-- Team membership is scoped to teams + users only (no organisation constraint).
-- Users may belong to a team without sharing the team's organisation.
-- Run in Supabase SQL editor or via psql against your Postgres database.

COMMENT ON TABLE public.team_members IS
  'Links users to teams. Membership does not require organisation_members membership.';

CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members (user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members (team_id);

-- Optional: verify no org-enforcing constraint exists on team_members
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.team_members'::regclass;

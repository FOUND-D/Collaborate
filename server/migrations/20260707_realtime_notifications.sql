-- =============================================================================
-- Migration: Real-Time Notifications
-- Created: 2026-07-07
-- Description: Creates the notifications table for real-time and persistent alerts.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL, -- 'task_assigned', 'task_status_changed', 'team_invite', 'org_invite', 'general'
  data jsonb NOT NULL DEFAULT '{}'::jsonb, -- metadata (e.g. task_id, project_id, team_id)
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast user notification lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
-- Index for unread notifications filter
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read) WHERE is_read = false;

-- Adds video-room columns only. Requires booking_sessions to exist.
-- If you see: relation "public.booking_sessions" does not exist
-- run 20260813_exchange_booking_video_bootstrap.sql instead (one-shot setup).

alter table public.booking_sessions
  add column if not exists meeting_id uuid;

alter table public.sessions
  add column if not exists booking_session_id uuid references public.booking_sessions(id) on delete set null;

create index if not exists idx_sessions_booking_session_id on public.sessions(booking_session_id);
create index if not exists idx_booking_sessions_meeting_id on public.booking_sessions(meeting_id);

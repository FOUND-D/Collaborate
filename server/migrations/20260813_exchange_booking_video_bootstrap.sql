-- Exchange booking + video rooms bootstrap
-- Run this in Supabase SQL Editor if booking_sessions does not exist yet.
-- Safe to re-run: uses IF NOT EXISTS / IF NOT EXISTS column adds only.

-- ---------------------------------------------------------------------------
-- Phase 2 prerequisites (skipped when tables already exist)
-- ---------------------------------------------------------------------------

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_skills (
  user_id uuid not null references public.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  type text not null,
  level text,
  endorsed_by uuid references public.users(id) on delete set null,
  endorsed_at timestamptz,
  primary key (user_id, skill_id, type)
);

create table if not exists public.exchange_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  listing_type text,
  level text,
  credit_rate integer not null default 0,
  format text,
  max_group_size integer,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.booking_sessions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.exchange_listings(id) on delete set null,
  skill_id uuid references public.skills(id) on delete set null,
  team_id uuid references public.teams(id) on delete set null,
  teacher_id uuid not null references public.users(id) on delete cascade,
  learner_id uuid references public.users(id) on delete set null,
  scheduled_at timestamptz not null,
  duration_min integer not null default 60,
  status text not null default 'pending',
  credits_transacted integer,
  agenda text,
  ai_summary text
);

create table if not exists public.ratings (
  session_id uuid not null references public.booking_sessions(id) on delete cascade,
  rater_id uuid not null references public.users(id) on delete cascade,
  ratee_id uuid not null references public.users(id) on delete cascade,
  stars smallint,
  review text,
  is_flagged boolean not null default false,
  primary key (session_id, rater_id)
);

create index if not exists idx_user_skills_skill_id on public.user_skills(skill_id);
create index if not exists idx_user_skills_endorsed_by on public.user_skills(endorsed_by);
create index if not exists idx_exchange_listings_user_id on public.exchange_listings(user_id);
create index if not exists idx_exchange_listings_skill_id on public.exchange_listings(skill_id);
create index if not exists idx_exchange_listings_status on public.exchange_listings(status);
create index if not exists idx_booking_sessions_listing_id on public.booking_sessions(listing_id);
create index if not exists idx_booking_sessions_teacher_id on public.booking_sessions(teacher_id);
create index if not exists idx_booking_sessions_learner_id on public.booking_sessions(learner_id);
create index if not exists idx_booking_sessions_scheduled_at on public.booking_sessions(scheduled_at);
create index if not exists idx_ratings_ratee_id on public.ratings(ratee_id);

-- Timestamps used by the API (add if table was created earlier without them)
alter table public.booking_sessions
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- Live video meetings (WebRTC rooms) — separate from booking_sessions
-- ---------------------------------------------------------------------------

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete set null,
  room_id text not null,
  status text not null default 'active',
  started_by uuid references public.users(id) on delete set null,
  agenda text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Team meetings may have been created with NOT NULL team_id; bookings need nullable team_id
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sessions' and column_name = 'team_id'
  ) then
    alter table public.sessions alter column team_id drop not null;
  end if;
exception
  when others then null;
end $$;

-- ---------------------------------------------------------------------------
-- Link bookings to video rooms (no team required)
-- ---------------------------------------------------------------------------

alter table public.booking_sessions
  add column if not exists meeting_id uuid;

alter table public.sessions
  add column if not exists booking_session_id uuid references public.booking_sessions(id) on delete set null;

create index if not exists idx_sessions_booking_session_id on public.sessions(booking_session_id);
create index if not exists idx_booking_sessions_meeting_id on public.booking_sessions(meeting_id);

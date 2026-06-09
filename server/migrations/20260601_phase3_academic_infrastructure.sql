-- Resources table
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  tags TEXT[],
  ai_summary TEXT,
  view_count INT DEFAULT 0,
  download_count INT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  skill_id UUID REFERENCES skills(id) ON DELETE SET NULL NULL,
  awarded_by UUID REFERENCES users(id) ON DELETE SET NULL NULL,
  awarded_at TIMESTAMPTZ DEFAULT now()
);

-- Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  event_date TIMESTAMPTZ NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Announcement RSVPs
CREATE TABLE IF NOT EXISTS public.announcement_rsvps (
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (announcement_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resources_uploader ON public.resources(uploader_id);
CREATE INDEX IF NOT EXISTS idx_resources_team ON public.resources(team_id);
CREATE INDEX IF NOT EXISTS idx_badges_user ON public.badges(user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_author ON public.announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_team ON public.announcements(team_id);

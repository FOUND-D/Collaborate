ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'undergrad',
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS year_of_study integer,
  ADD COLUMN IF NOT EXISTS student_id text,
  ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS avg_rating numeric(3,2),
  ADD COLUMN IF NOT EXISTS portfolio_slug text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_student_id_key'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_student_id_key UNIQUE (student_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_portfolio_slug_key'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_portfolio_slug_key UNIQUE (portfolio_slug);
  END IF;
END $$;

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'study_group',
  ADD COLUMN IF NOT EXISTS subject_code text,
  ADD COLUMN IF NOT EXISTS created_by_role text;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES public.users(id);

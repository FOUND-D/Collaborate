ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS year_of_study integer,
  ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS portfolio_slug text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_portfolio_slug_key'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_portfolio_slug_key UNIQUE (portfolio_slug);
  END IF;
END $$;

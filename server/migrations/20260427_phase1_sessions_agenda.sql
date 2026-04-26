DO $$
BEGIN
  IF to_regclass('public.sessions') IS NULL AND to_regclass('public.meetings') IS NOT NULL THEN
    ALTER TABLE public.meetings RENAME TO sessions;
  END IF;
END $$;

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS agenda text;

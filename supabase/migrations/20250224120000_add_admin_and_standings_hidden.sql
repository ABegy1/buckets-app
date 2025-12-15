ALTER TABLE IF EXISTS public.players
  ADD COLUMN IF NOT EXISTS is_admin_hidden boolean DEFAULT FALSE;

ALTER TABLE IF EXISTS public.players
  ADD COLUMN IF NOT EXISTS is_standings_hidden boolean DEFAULT FALSE;

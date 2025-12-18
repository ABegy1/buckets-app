ALTER TABLE IF EXISTS public.teams
ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;

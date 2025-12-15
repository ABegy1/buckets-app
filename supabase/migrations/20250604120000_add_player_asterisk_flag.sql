-- Add a persistent asterisk flag for players
ALTER TABLE IF EXISTS public.players
ADD COLUMN IF NOT EXISTS has_asterisk boolean DEFAULT false;

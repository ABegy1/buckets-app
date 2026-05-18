-- Add new stat tracking columns
ALTER TABLE IF EXISTS public.stats
  ADD COLUMN IF NOT EXISTS ffa_wins integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS high_score_team integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS high_score_ffa integer DEFAULT 0;

-- Track competition format per season
ALTER TABLE IF EXISTS public.seasons
  ADD COLUMN IF NOT EXISTS is_team_tournament boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_ffa_tournament boolean DEFAULT false;

-- Seed existing seasons with sensible defaults so historical data remains official
UPDATE public.seasons
SET is_team_tournament = COALESCE(is_team_tournament, COALESCE(is_official, false)),
    is_ffa_tournament = COALESCE(is_ffa_tournament, false)
WHERE TRUE;

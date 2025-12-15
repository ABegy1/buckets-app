import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/supabaseClient';

export type SeasonStatus = 'planned' | 'active' | 'completed' | 'cancelled';

export interface Season {
  id: string;
  season_name: string;
  status: SeasonStatus;
  start_date?: string | null;
  end_date?: string | null;
  winner_team_id?: string | null;
  mvp_player_id?: string | null;
}

export interface TeamStanding {
  season_id: string;
  season_team_id: string;
  team_name: string;
  team_points: number;
}

export interface PlayerStat {
  season_id: string;
  player_id: string;
  player_name: string;
  points: number;
  shots: number;
  makes: number;
}

export interface RosterEntry {
  id: string;
  season_id: string;
  player_id: string;
  season_team_id: string | null;
  season_tier_rule_id: string;
  player_name: string;
  team_name: string | null;
  tier_name: string;
  tier_color: string | null;
  points_per_make: number;
}

export interface SeasonRulesRow {
  id: string;
  tier_definition_id: string;
  tier_name: string;
  color: string | null;
  points_per_make: number;
}

export interface ShotEventRow {
  id: string;
  season_id: string;
  result: 'make' | 'miss';
  points: number;
  taken_at: string;
  note: string | null;
  is_voided: boolean;
  void_reason: string | null;
  player_name: string;
}

async function getSingle<T>(promise: Promise<any>): Promise<T | null> {
  const { data, error } = await promise;
  if (error) {
    console.error(error);
    return null;
  }
  return data as T;
}

export async function getActiveSeason(): Promise<Season | null> {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching active season', error);
    return null;
  }

  return data?.[0] ?? null;
}

export async function listPlannedSeasons(): Promise<Season[]> {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('status', 'planned')
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching planned seasons', error);
    return [];
  }

  return data as Season[];
}

export async function getStandings(seasonId: string): Promise<{ teams: TeamStanding[]; players: PlayerStat[] }> {
  const [{ data: teamData, error: teamError }, { data: playerData, error: playerError }] = await Promise.all([
    supabase
      .from('v_season_team_standings')
      .select('*')
      .eq('season_id', seasonId)
      .order('team_points', { ascending: false }),
    supabase
      .from('v_season_player_stats')
      .select('*')
      .eq('season_id', seasonId)
      .order('points', { ascending: false }),
  ]);

  if (teamError) console.error('Team standings error', teamError);
  if (playerError) console.error('Player standings error', playerError);

  return {
    teams: (teamData as TeamStanding[]) || [],
    players: (playerData as PlayerStat[]) || [],
  };
}

export async function listPlayersForSeason(seasonId: string): Promise<RosterEntry[]> {
  const { data, error } = await supabase
    .from('season_roster')
    .select(`
      id, season_id, player_id, season_team_id, season_tier_rule_id,
      players:player_id ( display_name ),
      season_team:season_team_id ( team_name ),
      rule:season_tier_rule_id ( points_per_make, tier_definitions ( tier_name, color ) )
    `)
    .eq('season_id', seasonId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error loading roster', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    season_id: row.season_id,
    player_id: row.player_id,
    season_team_id: row.season_team_id,
    season_tier_rule_id: row.season_tier_rule_id,
    player_name: row.players?.display_name ?? 'Unknown',
    team_name: row.season_team?.team_name ?? null,
    tier_name: row.rule?.tier_definitions?.tier_name ?? 'Unknown',
    tier_color: row.rule?.tier_definitions?.color ?? null,
    points_per_make: row.rule?.points_per_make ?? 0,
  }));
}

export async function getSeasonRules(seasonId: string): Promise<SeasonRulesRow[]> {
  const { data, error } = await supabase
    .from('season_tier_rules')
    .select(`id, tier_definition_id, points_per_make, tier_definitions ( tier_name, color )`)
    .eq('season_id', seasonId)
    .order('points_per_make', { ascending: false });

  if (error) {
    console.error('Error fetching season rules', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    tier_definition_id: row.tier_definition_id,
    tier_name: row.tier_definitions?.tier_name ?? 'Tier',
    color: row.tier_definitions?.color ?? null,
    points_per_make: row.points_per_make,
  }));
}

export async function recordShot(params: { seasonRosterId: string; result: 'make' | 'miss'; note?: string }): Promise<ShotEventRow | null> {
  const roster = await getSingle<any>(
    supabase
      .from('season_roster')
      .select('id, season_id, season_tier_rule_id, players:player_id ( display_name )')
      .eq('id', params.seasonRosterId)
      .single()
  );

  if (!roster) return null;

  const { data, error } = await supabase
    .from('shot_events')
    .insert({
      season_id: roster.season_id,
      season_roster_id: roster.id,
      season_tier_rule_id: roster.season_tier_rule_id,
      result: params.result,
      note: params.note ?? null,
    })
    .select(`id, season_id, result, points, taken_at, note, is_voided, void_reason`)
    .single();

  if (error) {
    console.error('Error recording shot', error);
    return null;
  }

  return {
    ...(data as any),
    player_name: roster.players?.display_name ?? 'Player',
  } as ShotEventRow;
}

export async function voidShot(shotId: string, reason?: string): Promise<boolean> {
  const { error } = await supabase
    .from('shot_events')
    .update({ is_voided: true, void_reason: reason ?? null })
    .eq('id', shotId);

  if (error) {
    console.error('Error voiding shot', error);
    return false;
  }
  return true;
}

export async function listSeasonHistory(): Promise<
  { season: Season; standings: { teams: TeamStanding[]; players: PlayerStat[] }; winner_team_name?: string | null; mvp_player_name?: string | null }[]
> {
  const { data, error } = await supabase
    .from('seasons')
    .select(`
      *,
      winner_team:winner_team_id ( team_name ),
      mvp_player:mvp_player_id ( display_name )
    `)
    .eq('status', 'completed')
    .order('end_date', { ascending: false });

  if (error) {
    console.error('Error fetching history', error);
    return [];
  }

  const seasons = (data || []) as any[];
  const results = await Promise.all(
    seasons.map(async (seasonRow) => {
      const standings = await getStandings(seasonRow.id);
      return {
        season: seasonRow as Season,
        standings,
        winner_team_name: seasonRow.winner_team?.team_name ?? null,
        mvp_player_name: seasonRow.mvp_player?.display_name ?? null,
      };
    })
  );

  return results;
}

export async function createPlannedSeason(seasonName: string): Promise<Season | null> {
  const { data, error } = await supabase
    .from('seasons')
    .insert({ season_name: seasonName, status: 'planned' })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating planned season', error);
    return null;
  }
  return data as Season;
}

export async function activateSeason(seasonId: string): Promise<boolean> {
  const now = new Date().toISOString();
  await supabase.from('seasons').update({ status: 'cancelled', end_date: now }).eq('status', 'active').neq('id', seasonId);
  const { error } = await supabase
    .from('seasons')
    .update({ status: 'active', start_date: now, end_date: null })
    .eq('id', seasonId);

  if (error) {
    console.error('Error activating season', error);
    return false;
  }
  return true;
}

export async function completeSeason(seasonId: string, winnerTeamId?: string, mvpPlayerId?: string): Promise<boolean> {
  const { error } = await supabase
    .from('seasons')
    .update({
      status: 'completed',
      end_date: new Date().toISOString(),
      winner_team_id: winnerTeamId ?? null,
      mvp_player_id: mvpPlayerId ?? null,
    })
    .eq('id', seasonId);

  if (error) {
    console.error('Error completing season', error);
    return false;
  }
  return true;
}

export async function listRecentShotsForSeason(seasonId: string, limitCount = 15): Promise<ShotEventRow[]> {
  const { data, error } = await supabase
    .from('shot_events')
    .select(
      `id, season_id, result, points, taken_at, note, is_voided, void_reason, season_roster:season_roster_id ( players:player_id ( display_name ) )`
    )
    .eq('season_id', seasonId)
    .order('taken_at', { ascending: false })
    .limit(limitCount);

  if (error) {
    console.error('Error loading shot events', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    season_id: row.season_id,
    result: row.result,
    points: row.points,
    taken_at: row.taken_at,
    note: row.note,
    is_voided: row.is_voided,
    void_reason: row.void_reason,
    player_name: row.season_roster?.players?.display_name ?? 'Player',
  }));
}

export async function listAllTimePlayerStats(): Promise<PlayerStat[]> {
  const { data, error } = await supabase
    .from('v_player_all_time_stats')
    .select('*')
    .order('points', { ascending: false });

  if (error) {
    console.error('Error loading all-time stats', error);
    return [];
  }
  return (data || []) as PlayerStat[];
}

export async function listAllTimeTierStats(): Promise<any[]> {
  const { data, error } = await supabase
    .from('v_player_tier_stats_all_time')
    .select('*')
    .order('points', { ascending: false });

  if (error) {
    console.error('Error loading tier stats', error);
    return [];
  }
  return data as any[];
}

export function subscribeShotEvents(
  seasonId: string,
  handler: (payload: { eventType: string; new: any; old: any }) => void
): RealtimeChannel {
  return supabase
    .channel(`shot-events-${seasonId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'shot_events', filter: `season_id=eq.${seasonId}` },
      handler
    )
    .subscribe();
}

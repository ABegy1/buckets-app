'use client'; // Required in Next.js App Router
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './StandingsPage.module.css'; // Updated path for combined styles
import { supabase } from '@/supabaseClient';
import { FaSnowflake } from "react-icons/fa6"; 
import { FaDollarSign } from "react-icons/fa";
import { useRouter } from 'next/navigation';
import Image, { StaticImageData } from 'next/image';

import Header from '@/components/Header';
import direwolvesLogo from '@/assets/images/Direwolves - Clear BG (1).png';
import monstarsLogo from '@/assets/images/Monstars - Clear BG.png';
import nightmaresLogo from '@/assets/images/Nightmares - Clear BG Needs Fixed.png';
import spartansLogo from '@/assets/images/Spartans-hoodie-illustrated-transparent-small.png';

interface TeamWithPlayers {
  team_id?: number;
  team_name: string;
  players: {
    player_id: number;
    player_instance_id: number;
    shots_taken: number;
    shots_made_in_row: number;
    shots_missed_in_row: number;
    tier_color: string | undefined;
    name: string;
    shots_left: number;
    shots_left_dashes: number;
    player_score: number;
    pps: number;
    reached_score_at: string | null;
  }[];
  team_pps: number;
  total_shots: number;
  team_score: number;
}

interface Season {
  season_id: number;
  season_name: string;
  shot_total: number;
  rules: string;
}

interface ShotFeedItem {
  shot_id: number;
  shot_date: string;
  result: number;
  player_name: string;
  tier_name: string | null;
  tier_color: string | null;
}

interface ShotHistoryPanelProps {
  recentShots: ShotFeedItem[];
  isLoading: boolean;
  error: string | null;
  formatShotTime: (shotDate: string) => string;
  formatShotResult: (result: number) => string;
}

const areShotFeedItemsEqual = (current: ShotFeedItem[], next: ShotFeedItem[]) => {
  if (current.length !== next.length) return false;

  return current.every((shot, index) => {
    const nextShot = next[index];

    return (
      shot.shot_id === nextShot.shot_id
      && shot.shot_date === nextShot.shot_date
      && shot.result === nextShot.result
      && shot.player_name === nextShot.player_name
      && shot.tier_name === nextShot.tier_name
      && shot.tier_color === nextShot.tier_color
    );
  });
};

type TeamPlayer = TeamWithPlayers['players'][number];

interface StandingsPlayerRowProps {
  player: TeamPlayer;
  rank?: number;
  isFfa?: boolean;
}

const arePlayersEqual = (current: TeamPlayer, next: TeamPlayer) => (
  current.player_id === next.player_id
  && current.player_instance_id === next.player_instance_id
  && current.shots_taken === next.shots_taken
  && current.shots_made_in_row === next.shots_made_in_row
  && current.shots_missed_in_row === next.shots_missed_in_row
  && current.tier_color === next.tier_color
  && current.name === next.name
  && current.shots_left === next.shots_left
  && current.shots_left_dashes === next.shots_left_dashes
  && current.player_score === next.player_score
  && current.pps === next.pps
  && current.reached_score_at === next.reached_score_at
);

const areTeamsEqual = (current: TeamWithPlayers[], next: TeamWithPlayers[]) => {
  if (current.length !== next.length) return false;

  return current.every((team, teamIndex) => {
    const nextTeam = next[teamIndex];

    return (
      team.team_id === nextTeam.team_id
      && team.team_name === nextTeam.team_name
      && team.team_pps === nextTeam.team_pps
      && team.total_shots === nextTeam.total_shots
      && team.team_score === nextTeam.team_score
      && team.players.length === nextTeam.players.length
      && team.players.every((player, playerIndex) => arePlayersEqual(player, nextTeam.players[playerIndex]))
    );
  });
};

const areSeasonsEqual = (current: Season, next: Season) => (
  current.season_id === next.season_id
  && current.season_name === next.season_name
  && current.shot_total === next.shot_total
  && current.rules === next.rules
);


interface LeaderboardRow {
  team_id: number;
  team_name: string;
  player_id: number;
  player_instance_id: number;
  player_name: string;
  player_score: number;
  shots_left: number;
  shots_left_dashes: number;
  shots_taken: number;
  pps: number;
  tier_color: string | null;
  shots_made_in_row: number;
  shots_missed_in_row: number;
  reached_score_at: string | null;
}

const teamLogoMap: Record<string, StaticImageData> = {
  Direwolves: direwolvesLogo,
  Monstars: monstarsLogo,
  Nightmares: nightmaresLogo,
  Spartans: spartansLogo,
};

const teamLogoSizeMap: Record<string, number> = {
  Direwolves: 202,
  Monstars: 242,
  Nightmares: 202,
  Spartans: 202,
};

const teamBorderClassMap: Record<string, string> = {
  Direwolves: styles.teamDirewolves,
  Monstars: styles.teamMonstars,
  Nightmares: styles.teamNightmares,
  Spartans: styles.teamSpartans,
};

const FlameIcon = () => (
  <span className={styles.flameWrap} aria-hidden="true">
    <svg
      className={styles.flameSvg}
      viewBox="0 0 125 189.864"
      role="presentation"
      focusable="false"
    >
      <path
        className={styles.flameMain}
        d="M76.553,186.09c0,0-10.178-2.976-15.325-8.226s-9.278-16.82-9.278-16.82s-0.241-6.647-4.136-18.465
          c0,0,3.357,4.969,5.103,9.938c0,0-5.305-21.086,1.712-30.418c7.017-9.333,0.571-35.654-2.25-37.534c0,0,13.07,5.64,19.875,47.54
          c6.806,41.899,16.831,45.301,6.088,53.985"
      />
      <path
        className={`${styles.flameMain} ${styles.one}`}
        d="M61.693,122.257c4.117-15.4,12.097-14.487-11.589-60.872c0,0,32.016,10.223,52.601,63.123
          c20.585,52.899-19.848,61.045-19.643,61.582c0.206,0.537-19.401-0.269-14.835-18.532S57.576,137.656,61.693,122.257z"
      />
      <path
        className={`${styles.flameMain} ${styles.two}`}
        d="M81.657,79.192c0,0,11.549,24.845,3.626,40.02c-7.924,15.175-21.126,41.899-0.425,64.998
          C84.858,184.21,125.705,150.905,81.657,79.192z"
      />
      <path
        className={`${styles.flameMain} ${styles.three}`}
        d="M99.92,101.754c0,0-23.208,47.027-12.043,80.072c0,0,32.741-16.073,20.108-45.79
          C95.354,106.319,99.92,114.108,99.92,101.754z"
      />
      <path
        className={`${styles.flameMain} ${styles.four}`}
        d="M103.143,105.917c0,0,8.927,30.753-1.043,46.868c-9.969,16.115-14.799,29.041-14.799,29.041
          S134.387,164.603,103.143,105.917z"
      />
      <path
        className={`${styles.flameMain} ${styles.five}`}
        d="M62.049,104.171c0,0-15.645,67.588,10.529,77.655C98.753,191.894,69.033,130.761,62.049,104.171z"
      />

      {/* ember particles */}
      <path
        className={styles.flame}
        d="M101.011,112.926c0,0,8.973,10.519,4.556,16.543C99.37,129.735,106.752,117.406,101.011,112.926z"
      />
      <path
        className={`${styles.flame} ${styles.one}`}
        d="M55.592,126.854c0,0-3.819,13.29,2.699,16.945C64.038,141.48,55.907,132.263,55.592,126.854z"
      />
      <path
        className={`${styles.flame} ${styles.two}`}
        d="M54.918,104.595c0,0-3.959,6.109-1.24,8.949C56.93,113.256,52.228,107.329,54.918,104.595z"
      />
    </svg>
  </span>
);

const PlayerStatusIcons: React.FC<{ player: TeamPlayer }> = ({ player }) => (
  <>
    {player.name === 'A. Begy' && (
      <span className={styles.crownIcon}>👑</span>
    )}
    {player.shots_left % 10 === 1 && (
      <span className={styles.moneyballIcon} aria-label="Moneyball shot">
        <FaDollarSign />
      </span>
    )}
    {/* Fire Icon: 3+ Consecutive Makes */}
    {player.shots_made_in_row >= 3 && (
      <span className={styles.fireIcon}>
        <FlameIcon />
      </span>
    )}
    {/* Cold Icon: 4+ Consecutive Misses */}
    {player.shots_missed_in_row >= 4 && (
      <span className={styles.coldIcon}>
        <FaSnowflake />
      </span>
    )}
  </>
);

const StandingsPlayerRow = React.memo(function StandingsPlayerRow({
  player,
  rank,
  isFfa = false,
}: StandingsPlayerRowProps) {
  return (
    <div className={`${styles.row} ${isFfa ? styles.ffaRow : ''} ${rank === 0 ? styles.ffaLeaderRow : ''}`}>
      {isFfa && <span className={styles.ffaRankBadge}>{(rank ?? 0) + 1}</span>}
      <div className={styles.playerNameColumn}>
        <div
          className={styles.playerName}
          style={{
            backgroundImage: `linear-gradient(90deg, ${player.tier_color}33 0%, ${player.tier_color}1A 60%, transparent 100%)`,
          }}
        >
          <span className={styles.playerNameText}>{player.name}</span>
          <PlayerStatusIcons player={player} />
        </div>
      </div>
      <span className={styles.totalPoints}>{player.player_score}</span>
      <div className={styles.shotsLeft}>
        <span className={styles.shotsLeftValue}>{player.shots_left}</span>
        {player.shots_left_dashes > 0 && (
          <span
            className={styles.shotsLeftDashes}
            aria-label={`${player.shots_left_dashes} shots left dashes`}
          >
            {Array.from({ length: player.shots_left_dashes }).map((_, index) => (
              <span key={index} className={styles.shotsLeftDash} />
            ))}
          </span>
        )}
      </div>
      <span className={styles.pps}>{player.pps.toFixed(2)}</span>
    </div>
  );
}, (currentProps, nextProps) => (
  currentProps.rank === nextProps.rank
  && currentProps.isFfa === nextProps.isFfa
  && arePlayersEqual(currentProps.player, nextProps.player)
));

const ShotHistoryPanel = React.memo(function ShotHistoryPanel({
  recentShots,
  isLoading,
  error,
  formatShotTime,
  formatShotResult,
}: ShotHistoryPanelProps) {
  return (
    <aside className={styles.shotHistoryPanel} aria-label="Live shot history">
      <div className={styles.shotHistoryHeader}>
        <h2 className={styles.shotHistoryTitle}>Shot History</h2>
        <span className={styles.livePill}>Live</span>
      </div>
      <p className={styles.shotHistorySubtle}>Recent makes and misses for this season.</p>
      {isLoading && (
        <div className={styles.shotHistoryState}>Loading live feed…</div>
      )}
      {!isLoading && error && (
        <div className={styles.shotHistoryState}>{error}</div>
      )}
      {!isLoading && !error && recentShots.length === 0 && (
        <div className={styles.shotHistoryState}>
          <strong>No shots recorded yet.</strong>
          <span>Shot activity will appear here live.</span>
        </div>
      )}
      {!isLoading && !error && recentShots.length > 0 && (
        <ul className={styles.shotHistoryList}>
          {recentShots.map((shot) => (
            <li key={shot.shot_id} className={styles.shotHistoryItem}>
              <div className={styles.shotTopRow}>
                <div className={styles.shotPlayerWrap}>
                  <span className={styles.shotPlayer}>{shot.player_name}</span>
                  {shot.tier_color && (
                    <span className={styles.tierChip} style={{ backgroundColor: shot.tier_color }}>
                      {shot.tier_name || 'Tier'}
                    </span>
                  )}
                </div>
                <span className={`${styles.shotResult} ${shot.result > 0 ? styles.shotMade : styles.shotMiss}`}>
                  {shot.result > 1 ? '🔥 ' : ''}{formatShotResult(shot.result)}
                </span>
              </div>
              <div className={styles.shotMeta}>
                {formatShotTime(shot.shot_date)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
});

const StandingsPage: React.FC = () => {
 // State variables
 const [teams, setTeams] = useState<TeamWithPlayers[]>([]); // Stores the list of teams and their players
 const [userView, setUserView] = useState<string>('Standings'); // Tracks the current user view (e.g., Standings, FreeAgent, Rules)
 const [isLoading, setIsLoading] = useState<boolean>(true);
 const [season, setSeason] = useState<Season>({
  season_id: -1,
  season_name: '',
  shot_total: -1,
  rules: ''
 }); // Current season info
 const [recentShots, setRecentShots] = useState<ShotFeedItem[]>([]);
 const [isShotHistoryLoading, setIsShotHistoryLoading] = useState<boolean>(true);
 const [shotHistoryError, setShotHistoryError] = useState<string | null>(null);
 const router = useRouter(); // Router for navigation
 const hasInitializedRef = useRef(false);
 const isRealtimeSubscribingRef = useRef(false);
 const refreshDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const refreshInFlightRef = useRef(false);
 const refreshQueuedRef = useRef(false);
 const hasLoadedStandingsRef = useRef(false);
 const isFfaSeason = season.season_name.toLowerCase().includes('ffa')
  || season.season_name.toLowerCase().includes('free for all');
 const isFfaTeam = (teamName: string) => teamName === 'Free For All';
 const rankClassByIndex = (index: number) => {
  if (index === 0) return styles.medalGold;
  if (index === 1) return styles.medalSilver;
  if (index === 2) return styles.medalBronze;
  return '';
 };

 const totalPlayers = useMemo(() => teams.reduce((acc, team) => acc + team.players.length, 0), [teams]);
 const formatShotTime = useCallback((shotDate: string) => {
  const parsed = new Date(shotDate);
  if (Number.isNaN(parsed.getTime())) return 'Unknown time';
  return parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
 }, []);

 const formatShotResult = useCallback((result: number) => {
  if (result > 0) return `+${result}`;
  if (result === 0) return 'Miss';
  return `${result}`;
 }, []);

 const fetchShotHistory = useCallback(async (seasonId: number, showLoading = false) => {
  try {
    if (showLoading) {
      setIsShotHistoryLoading(true);
    }
    setShotHistoryError(null);
    const { data, error } = await supabase
      .from('shots')
      .select(`
        shot_id,
        shot_date,
        result,
        tier_id,
        player_instance!inner(
          season_id,
          players!inner(name)
        ),
        tiers(tier_name, color)
      `)
      .eq('player_instance.season_id', seasonId)
      .order('shot_date', { ascending: false })
      .limit(15);

    if (error) throw error;

    const mapped: ShotFeedItem[] = (data ?? []).map((shot: any) => ({
      shot_id: shot.shot_id,
      shot_date: shot.shot_date,
      result: Number(shot.result) || 0,
      player_name: shot.player_instance?.players?.name ?? 'Unknown player',
      tier_name: shot.tiers?.tier_name ?? null,
      tier_color: shot.tiers?.color ?? null,
    }));

    setRecentShots((currentShots) => (
      areShotFeedItemsEqual(currentShots, mapped) ? currentShots : mapped
    ));
  } catch (error) {
    console.error('Error fetching shot history:', error);
    setShotHistoryError('Unable to load live shot feed.');
    setRecentShots([]);
  } finally {
    setIsShotHistoryLoading(false);
  }
 }, []);

  /**
   * Signs out the current user and redirects to the home page.
   */
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/');
    } else {
      console.error('Sign out error:', error.message);
    }
  };

    /**
   * Fetches teams and their players for the Standings view.
   * Includes player stats like shots left, scores, and streaks.
   */
  const fetchTeamsAndPlayers = useCallback(async () => {
    const shouldShowLoading = !hasLoadedStandingsRef.current;

    try {
      if (shouldShowLoading) {
        setIsLoading(true);
      }

      const { data: activeSeason, error: seasonError } = await supabase
        .from('seasons')
        .select('season_id, season_name, shot_total, rules')
        .is('end_date', null)
        .maybeSingle();

      if (seasonError) throw seasonError;
      if (!activeSeason) {
        const emptySeason = { season_id: -1, season_name: 'No Active Season', shot_total: 0, rules: '' };
        setSeason((currentSeason) => (areSeasonsEqual(currentSeason, emptySeason) ? currentSeason : emptySeason));
        setTeams((currentTeams) => (currentTeams.length === 0 ? currentTeams : []));
        setRecentShots((currentShots) => (currentShots.length === 0 ? currentShots : []));
        return;
      }

      setSeason((currentSeason) => (areSeasonsEqual(currentSeason, activeSeason) ? currentSeason : activeSeason));
      await fetchShotHistory(activeSeason.season_id);

      const { data: leaderboardRows, error: leaderboardError } = await supabase
        .rpc('get_leaderboard', { p_season_id: activeSeason.season_id });

      if (leaderboardError) throw leaderboardError;

      const teamsById = new Map<number, TeamWithPlayers>();

      (leaderboardRows ?? []).forEach((row: LeaderboardRow) => {
        const team = teamsById.get(row.team_id) ?? {
          team_id: row.team_id,
          team_name: row.team_name,
          players: [],
          team_pps: 0,
          total_shots: 0,
          team_score: 0,
        };

        team.players.push({
          player_id: row.player_id,
          player_instance_id: row.player_instance_id,
          name: row.player_name,
          shots_left: Number(row.shots_left) || 0,
          shots_left_dashes: Math.max(0, Math.min(2, Number(row.shots_left_dashes) || 0)),
          player_score: Number(row.player_score) || 0,
          shots_taken: Number(row.shots_taken) || 0,
          pps: Number(row.pps) || 0,
          tier_color: row.tier_color || '#000',
          shots_made_in_row: Number(row.shots_made_in_row) || 0,
          shots_missed_in_row: Number(row.shots_missed_in_row) || 0,
          reached_score_at: row.reached_score_at,
        });

        teamsById.set(row.team_id, team);
      });

      const teamsWithPlayers = Array.from(teamsById.values()).map((team) => {
        team.players.sort((a, b) => {
          if (b.player_score !== a.player_score) {
            return b.player_score - a.player_score;
          }

          if (b.pps !== a.pps) {
            return b.pps - a.pps;
          }

          const aReachedScoreAt = a.reached_score_at ? new Date(a.reached_score_at).getTime() : Infinity;
          const bReachedScoreAt = b.reached_score_at ? new Date(b.reached_score_at).getTime() : Infinity;

          if (aReachedScoreAt !== bReachedScoreAt) {
            return aReachedScoreAt - bReachedScoreAt;
          }

          return a.name.localeCompare(b.name);
        });

        const totalShots = team.players.reduce((acc, player) => acc + player.shots_left, 0);
        const totalShotsTaken = team.players.reduce((acc, player) => acc + player.shots_taken, 0);
        const teamScore = team.players.reduce((acc, player) => acc + player.player_score, 0);

        return {
          ...team,
          team_pps: totalShotsTaken > 0 ? teamScore / totalShotsTaken : 0,
          total_shots: totalShots,
          team_score: teamScore,
        };
      });

      teamsWithPlayers.sort((a, b) => b.team_score - a.team_score);
      setTeams((currentTeams) => (areTeamsEqual(currentTeams, teamsWithPlayers) ? currentTeams : teamsWithPlayers));
    } catch (error) {
      console.error('Error fetching teams, players, and season info:', error);
    } finally {
      hasLoadedStandingsRef.current = true;
      setIsLoading(false);
    }
  }, [fetchShotHistory]);

  // useEffect(() => {
  //   // Function to unlock and keep AudioContext alive
  //   const initializeAudioContext = () => {
  //     if (!audioContext) {
  //       const ctx = new (window.AudioContext || window.webkitAudioContext)();
  //       // const ctx = new window.AudioContext()
  //       setAudioContext(ctx);

  //       // Create an inaudible oscillator to keep the context alive
  //       const oscillator = ctx.createOscillator();
  //       const gain = ctx.createGain();
  //       oscillator.connect(gain);
  //       gain.connect(ctx.destination);
  //       oscillator.frequency.value = 20; // Low frequency (inaudible)
  //       gain.gain.value = 0.001; // Nearly silent
  //       oscillator.start();

  //       console.log("AudioContext initialized and kept alive!");

  //       // Preload notification sound
  //       // const sound = new Howl({
  //       //   src: ["/sounds/notification.mp3"],
  //       //   volume: 1.0,
  //       // });
  //       setNotificationSound(sound);
  //     } else if (audioContext.state === "suspended") {
  //       audioContext.resume().then(() => console.log("AudioContext resumed!"));
  //     }
  //   };
  //   initializeAudioContext();
  // }, [audioContext, sound]);

 /**
   * Fetches the current user's view from the database.
   */
  const fetchUserView = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase
        .from('users')
        .select('View')
        .eq('email', session?.user?.email)
        .single();

      if (error || !data) {
        console.error('Error fetching user view:', error);
        return;
      }

      setUserView(data.View);
    } catch (err) {
      console.error('Error fetching user view:', err);
    }
  };

 /**
   * Subscribes to user view changes in real time and updates state accordingly.
   */
  const refreshStandings = useCallback(async () => {
    if (refreshInFlightRef.current) {
      refreshQueuedRef.current = true;
      return;
    }

    refreshInFlightRef.current = true;

    try {
      await fetchTeamsAndPlayers();
    } finally {
      refreshInFlightRef.current = false;

      if (refreshQueuedRef.current) {
        refreshQueuedRef.current = false;
        await refreshStandings();
      }
    }
  }, [fetchTeamsAndPlayers]);

  const queueStandingsRefresh = useCallback(() => {
    if (refreshDebounceRef.current) {
      clearTimeout(refreshDebounceRef.current);
    }

    refreshDebounceRef.current = setTimeout(() => {
      refreshDebounceRef.current = null;
      refreshStandings();
    }, 350);
  }, [refreshStandings]);

  useEffect(() => {
    let userViewChannel: ReturnType<typeof supabase.channel> | null = null;

    const loadSeasonAndUserView = async () => {
      if (hasInitializedRef.current) return;
      hasInitializedRef.current = true;

      await Promise.all([fetchUserView(), refreshStandings()]);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) return;

      userViewChannel = supabase
        .channel(`user-view-changes-${session.user.email}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'users', filter: `email=eq.${session.user.email}` },
          (payload) => {
            const updatedView = payload.new.View;
            setUserView(updatedView);
          }
        )
        .subscribe();
    };

    loadSeasonAndUserView();

    return () => {
      if (userViewChannel) {
        supabase.removeChannel(userViewChannel);
      }
      if (refreshDebounceRef.current) {
        clearTimeout(refreshDebounceRef.current);
        refreshDebounceRef.current = null;
      }
      hasInitializedRef.current = false;
      hasLoadedStandingsRef.current = false;
    };
  }, [refreshStandings]);

  useEffect(() => {
    if (isRealtimeSubscribingRef.current) return;
    isRealtimeSubscribingRef.current = true;

    const playerInstanceChannel = supabase
      .channel('player-instance-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'player_instance' }, queueStandingsRefresh)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'player_instance' }, queueStandingsRefresh)
      .subscribe();

    const teamChannel = supabase
      .channel('team-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, queueStandingsRefresh)
      .subscribe();

    const playerChannel = supabase
      .channel('player-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, queueStandingsRefresh)
      .subscribe();

    const shotChannel = supabase
      .channel('shots-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shots' }, queueStandingsRefresh)
      .subscribe();

    return () => {
      supabase.removeChannel(playerInstanceChannel);
      supabase.removeChannel(teamChannel);
      supabase.removeChannel(playerChannel);
      supabase.removeChannel(shotChannel);
      isRealtimeSubscribingRef.current = false;
    };
  }, [queueStandingsRefresh]);

 return (
  <div className={styles.userContainer}>
    <Header seasonTitle={`${season.season_name} Standings`} />

    {/* Main Content Section */}
    <main className={styles.userContent}>
        {/* Standings View*/}
        <div className={styles.container}>
          <section className={styles.pageSummary} aria-label="Standings summary">
            <div>
              <div className={styles.summaryTitle}>{isFfaSeason ? 'Free For All Leaderboard' : 'Team Standings'}</div>
              <div className={styles.summaryMeta}>
                <span>{teams.length} {isFfaSeason ? 'group' : 'teams'}</span>
                <span>{totalPlayers} players</span>
                <span>{season.shot_total} total shots</span>
              </div>
            </div>
            {isFfaSeason && <span className={styles.ffaChip}>INDIVIDUAL COMPETITION</span>}
          </section>
          {isLoading && <section className={styles.pageSummary}><div className={styles.summaryTitle}>Loading standings…</div></section>}
          {!isLoading && teams.length === 0 && <section className={styles.pageSummary}><div className={styles.summaryTitle}>No visible teams or players yet.</div></section>}
          <div className={styles.contentGrid}>
            <section className={styles.standingsPanel} aria-label="Standings list">
              <div className={styles.teams}>
                {teams.map((team, index) => {
              const isFreeForAll = isFfaSeason || isFfaTeam(team.team_name);
              const isFakeFfaTeam = isFfaTeam(team.team_name);
              const showTeamRankBadge = !isFakeFfaTeam;

              return (
              <div
                key={team.team_id ?? team.team_name}
                className={`${styles.team} ${teamBorderClassMap[team.team_name] ?? ''} ${index === 0 && !isFakeFfaTeam ? styles.teamLeader : ''}`}
              >
                {/* Team Title */}
                <div className={styles.teamHeader}>
                  {showTeamRankBadge && (
                    <span className={`${styles.teamRankBadge} ${rankClassByIndex(index)}`}>#{index + 1}</span>
                  )}
                  {teamLogoMap[team.team_name] && (
                    <div className={styles.teamLogoWrap}>
                    <Image
                      className={styles.teamLogo}
                      src={teamLogoMap[team.team_name]}
                      alt={`${team.team_name} logo`}
                      width={teamLogoSizeMap[team.team_name] ?? 202}
                      height={teamLogoSizeMap[team.team_name] ?? 202}
                      sizes={`${teamLogoSizeMap[team.team_name] ?? 202}px`}
                    />
                    </div>
                  )}
                </div>
                {!isFreeForAll && (
                  <div className={styles.teamStatsGrid}>
                    <div className={styles.statBox}>
                      <span className={styles.statLabel}>Total Score</span>
                      <span className={styles.statValue}>{team.team_score}</span>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.statLabel}>Shots Left</span>
                      <span className={styles.statValue}>{team.total_shots}</span>
                    </div>
                    <div className={styles.statBox}>
                      <span className={styles.statLabel}>PPS</span>
                      <span className={styles.statValue}>{team.team_pps.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                {/* Table Headers */}
                {isFreeForAll ? (
                  <>
                    <div className={`${styles.row} ${styles.ffaHeaderRow} ${styles.tableHeader}`}>
                      <span className={styles.columnHeader}>#</span>
                      <span className={styles.columnHeader}>Player</span>
                      <span className={styles.columnHeader}>Score</span>
                      <span className={styles.columnHeader}>SL</span>
                      <span className={styles.columnHeader}>PPS</span>
                    </div>
                    {[...team.players]
                      .sort((a, b) => {
                        if (b.player_score !== a.player_score) return b.player_score - a.player_score;
                        if (b.pps !== a.pps) return b.pps - a.pps;
                        if (a.shots_left !== b.shots_left) return a.shots_left - b.shots_left;
                        return a.name.localeCompare(b.name);
                      })
                      .map((player, playerIndex) => (
                        <StandingsPlayerRow
                          key={player.player_instance_id}
                          player={player}
                          rank={playerIndex}
                          isFfa
                        />
                      ))}
                  </>
                ) : (
                  <>
                    <div className={`${styles.row} ${styles.tableHeader}`}>
                      <span className={styles.columnHeader}>Name</span>
                      <span className={styles.columnHeader}>Score</span>
                      <span className={styles.columnHeader}>SL</span>
                      <span className={styles.columnHeader}>PPS</span>
                    </div>
                    {team.players.map((player) => (
                      <StandingsPlayerRow
                        key={player.player_instance_id}
                        player={player}
                      />
                    ))}
                  </>
                )}
                </div>
              );
              })}
              </div>
            </section>
            <ShotHistoryPanel
              recentShots={recentShots}
              isLoading={isShotHistoryLoading}
              error={shotHistoryError}
              formatShotTime={formatShotTime}
              formatShotResult={formatShotResult}
            />
          </div>
        </div>
    </main>

    {/* Footer Section */}
    <footer className={styles.userFooter}>
      <p>&copy; 2025 Buckets Game. All rights reserved.</p>
      <button className={styles.signOutButton} onClick={handleSignOut}>
        Sign Out
      </button>
    </footer>
  </div>
);
};

export default StandingsPage;

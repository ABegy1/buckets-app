'use client'; // Required in Next.js App Router
import React, { useEffect, useState } from 'react';
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

interface Team {
  team_id: number;
  team_name: string;
  team_score: number;
  is_hidden?: boolean;
}

interface TeamWithPlayers {
  team_name: string;
  players: {
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
        className={`${styles.flameMain} ${styles.one}`}
        d="M76.616 54.645c1.683-16.543-3.005-34.936-3.005-34.936s-6.277 8.37-10.267 16.132c-3.989-8.064-10.561-16.779-10.561-16.779s-4.834 19.042-2.896 35.902c1.954 16.995-10.172 24.512-16.643 41.743-6.472 17.231-4.797 48.182 29.548 57.164 34.347-8.983 35.982-40.032 29.51-57.264-6.47-17.231-17.621-24.937-15.686-41.962z"
      />
      <path
        className={`${styles.flame} ${styles.two}`}
        d="M63.861 108.818c4.032-8.249 1.951-19.165 1.951-19.165s-3.859 4.289-6.433 8.146c-2.575-3.857-6.452-8.146-6.452-8.146s-1.792 10.915 2.221 19.165c4.013 8.249-.399 16.379-.399 16.379s2.828 4.947 8.638 4.947 8.639-4.947 8.639-4.947-4.196-8.13-.165-16.379z"
      />
      <path
        className={`${styles.flame} ${styles.three}`}
        d="M33.321 103.663c2.576-5.143 2.189-11.436 2.189-11.436s-3.607 2.646-5.893 5.107c-2.285-2.461-5.737-5.107-5.737-5.107s-.913 6.293 1.643 11.436c2.557 5.143-.584 9.537-.584 9.537s2.36 2.254 5.162 2.254 5.12-2.254 5.12-2.254-2.476-4.394.1-9.537z"
      />
      <path
        className={`${styles.flame} ${styles.four}`}
        d="M90.071 103.663c2.575-5.143 2.188-11.436 2.188-11.436s-3.605 2.646-5.891 5.107c-2.286-2.461-5.737-5.107-5.737-5.107s-.914 6.293 1.643 11.436c2.557 5.143-.584 9.537-.584 9.537s2.36 2.254 5.162 2.254c2.802 0 5.12-2.254 5.12-2.254s-2.477-4.394.1-9.537z"
      />
      <path
        className={`${styles.flame} ${styles.five}`}
        d="M63.521 57.568c2.079-4.151 1.735-9.272 1.735-9.272s-2.965 2.123-4.849 4.087c-1.885-1.964-4.734-4.087-4.734-4.087s-.762 5.121 1.3 9.272c2.061 4.151-.46 7.727-.46 7.727s1.947 1.826 4.227 1.826c2.281 0 4.227-1.826 4.227-1.826s-2.524-3.576-.446-7.727z"
      />
    </svg>
  </span>
);



// Function to calculate the current streak of consecutive made shots
const calculateShotsMadeInRow = async (playerInstanceId: number) => {
  try {
    const { data: shots, error: shotsError } = await supabase
      .from('shots')
      .select('result')
      .eq('instance_id', playerInstanceId)
      .order('shot_date', { ascending: true });

    if (shotsError || !shots) throw shotsError;

    // Walk backwards from the most recent shot
    let makeStreak = 0;
    for (let i = shots.length - 1; i >= 0; i--) {
      if (shots[i].result !== 0) {
        makeStreak++;
      } else {
        break;
      }
    }

    return makeStreak;
  } catch (error) {
    console.error('Error calculating shots made in a row:', error);
    return 0;
  }
};


const calculateShotDetails = async (
  playerInstanceId: number,
  targetScore: number,
) => {
  try {
    const { data: shots, error: shotsError } = await supabase
      .from('shots')
      .select('result, shot_date')
      .eq('instance_id', playerInstanceId)
      .order('shot_date', { ascending: true });

    if (shotsError || !shots) throw shotsError;

    let makeStreak = 0;
    let missStreak = 0;
    let cumulativeScore = 0;
    let reachedScoreAt: string | null = null;

    for (let i = shots.length - 1; i >= 0; i--) {
      const shotResult = Number(shots[i].result) || 0;
      if (shotResult !== 0) {
        makeStreak++;
      } else {
        break;
      }
    }

    for (let i = shots.length - 1; i >= 0; i--) {
      const shotResult = Number(shots[i].result) || 0;
      if (shotResult === 0) {
        missStreak++;
      } else {
        break;
      }
    }

    shots.forEach((shot) => {
      const shotResult = Number(shot.result) || 0;
      cumulativeScore += shotResult;
      if (!reachedScoreAt && cumulativeScore >= targetScore) {
        reachedScoreAt = shot.shot_date;
      }
    });

    return {
      shotsMadeInRow: makeStreak,
      shotsMissedInRow: missStreak,
      reachedScoreAt,
    };
  } catch (error) {
    console.error('Error calculating shot details:', error);
    return { shotsMadeInRow: 0, shotsMissedInRow: 0, reachedScoreAt: null };
  }
};


// Update each team's total score based on its players' scores for the active season
const updateTeamScores = async () => {
  try {
    // Fetch the active season (where end_date is null)
    const { data: activeSeason, error: seasonError } = await supabase
      .from('seasons')
      .select('season_id')
      .is('end_date', null)
      .maybeSingle();

    if (seasonError) throw seasonError;
    if (!activeSeason) return;
    const activeSeasonId = activeSeason.season_id;

    // Fetch all teams
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('team_id, team_score, is_hidden');

    if (teamsError) throw teamsError;

    const visibleTeams = (teamsData || []).filter((team: any) => !team.is_hidden);

    await Promise.all(
      visibleTeams.map(async (team: any) => {
        // Fetch players for the current team
        const { data: players, error: playersError } = await supabase
          .from('players')
          .select('player_id')
          .eq('team_id', team.team_id);

        if (playersError) throw playersError;

        let teamScore = 0;
        // Sum up the score for each player's instance in the active season
        await Promise.all(
          players.map(async (player: any) => {
            const { data: playerInstances, error: piError } = await supabase
              .from('player_instance')
              .select('score')
              .eq('player_id', player.player_id)
              .eq('season_id', activeSeasonId);

            if (piError) throw piError;

            const playerTotalScore = playerInstances.reduce(
              (acc: number, instance: any) => acc + instance.score,
              0
            );
            teamScore += playerTotalScore;
          })
        );

        // Update the team's total score
        const { error: updateError } = await supabase
          .from('teams')
          .update({ team_score: teamScore })
          .eq('team_id', team.team_id);

        if (updateError) throw updateError;
        console.log(`Team ${team.team_id} score updated to ${teamScore}`);
      })
    );
  } catch (error) {
    console.error('Error updating team scores:', error);
  }
};

const StandingsPage: React.FC = () => {
 // State variables
 const [teams, setTeams] = useState<TeamWithPlayers[]>([]); // Stores the list of teams and their players
 const [userView, setUserView] = useState<string>('Standings'); // Tracks the current user view (e.g., Standings, FreeAgent, Rules)
 const [season, setSeason] = useState<Season>({
  season_id: -1,
  season_name: '',
  shot_total: -1,
  rules: ''
 }); // Current season info
 const router = useRouter(); // Router for navigation

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
  const fetchTeamsAndPlayers = async () => {
    try {
            // Fetch active season details

      const { data: activeSeason, error: seasonError } = await supabase
        .from('seasons')
        .select('season_id, season_name, shot_total, rules')
        .is('end_date', null)
        .maybeSingle();

      if (seasonError) throw seasonError;
      if (!activeSeason) {
        setSeason({ season_id: -1, season_name: 'No Active Season', shot_total: 0, rules: '' });
        setTeams([]);
        return;
      }

      const activeSeasonId = activeSeason.season_id;
      setSeason(activeSeason);
        // Fetch teams

      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('team_name, team_score, team_id, is_hidden');

      if (teamsError) throw teamsError;
      const visibleTeams = (teamsData || []).filter((team) => !team.is_hidden);
        // Enrich teams with their players and stats

      const teamsWithPlayers: TeamWithPlayers[] = await Promise.all(
        visibleTeams.map(async (team: any) => {
          const { data: players, error: playersError } = await supabase
            .from('players')
            .select('*, tiers(color)')
            .eq('team_id', team.team_id);
          if (playersError) throw playersError;

          const visiblePlayers = (players || []).filter((player: any) => !player.is_hidden);

          const playersWithStats = await Promise.all(
            visiblePlayers.map(async (player: any) => {
              const { data: playerInstance, error: piError } = await supabase
                .from('player_instance')
                .select('player_instance_id, shots_left, shots_left_dashes, score')
                .eq('player_id', player.player_id)
                .eq('season_id', activeSeasonId)
                .single();

              if (piError || !playerInstance) throw piError;
              // Calculate streaks

              const { shotsMadeInRow, shotsMissedInRow, reachedScoreAt } = await calculateShotDetails(
                playerInstance.player_instance_id,
                playerInstance.score,
              );
              console.log(shotsMadeInRow, shotsMissedInRow);
              const shotsTaken = Math.max(0, activeSeason.shot_total - playerInstance.shots_left);
              const shotsLeftDashes = Math.max(0, Math.min(2, playerInstance.shots_left_dashes ?? 0));
              return {
                name: player.name,
                shots_left: playerInstance.shots_left,
                shots_left_dashes: shotsLeftDashes,
                player_score: playerInstance.score,
                shots_taken: shotsTaken,
                pps: shotsTaken > 0 ? playerInstance.score / shotsTaken : 0,
                tier_color: player.tiers?.color || '#000',
                shots_made_in_row: shotsMadeInRow,
                shots_missed_in_row: shotsMissedInRow,
                reached_score_at: reachedScoreAt,
              };
            })
          );

          // Sort players by their score, descending. Break ties with PPS and then by who reached the score first.
          playersWithStats.sort((a, b) => {
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
          // Calculate total shots left for the team

          const totalShots = playersWithStats.reduce((acc, player) => acc + player.shots_left, 0);
          const totalShotsTaken = playersWithStats.reduce((acc, player) => acc + player.shots_taken, 0);
          const teamPointsPerShot = totalShotsTaken > 0 ? team.team_score / totalShotsTaken : 0;

          return {
            team_name: team.team_name,
            players: playersWithStats,
            team_pps: teamPointsPerShot,
            total_shots: totalShots,
            team_score: team.team_score,
          };
        })
      );
  
      // Sort the teams by team_score in descending order
      teamsWithPlayers.sort((a, b) => b.team_score - a.team_score);
      setTeams(teamsWithPlayers);
    } catch (error) {
      console.error('Error fetching teams, players, and season info:', error);
    }
  };

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
  useEffect(() => {
    const subscribeToUserViewChanges = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { user } = session;

     // Subscribe to updates on the user's View field
      const userViewChannel = supabase
        .channel('user-view-changes')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'users', filter: `email=eq.${user.email}` },
          (payload) => {
            const updatedView = payload.new.View;
            setUserView(updatedView);
          }
        )
        .subscribe();

      // Fetch initial view
      fetchUserView();

      return () => {
        supabase.removeChannel(userViewChannel);
      };
    };

    subscribeToUserViewChanges();
  }, []);

  useEffect(() => {

      // Initial fetch and update
      fetchTeamsAndPlayers();
      updateTeamScores();

      // Subscribe to changes in player_instance, team, player
      const playerInstanceChannel = supabase
        .channel('player-instance-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'player_instance' }, () => {
          fetchTeamsAndPlayers();
          updateTeamScores();
        })
        .subscribe();

      const teamChannel = supabase
        .channel('team-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, fetchTeamsAndPlayers)
        .subscribe();

      const playerChannel = supabase
        .channel('player-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, fetchTeamsAndPlayers)
        .subscribe();

      // **Shots** subscription: check new shot, if 3rd consecutive => play sound
      const shotChannel = supabase
        .channel('shots-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shots' }, 
          async (payload) => {
            try {
              // Cast payload.new to a ShotsRow-like object
              const newRow = payload.new as { result: number; instance_id: number };

              const { result, instance_id } = newRow;
              // If it's a made shot (non-zero)
              if (result !== 0) {
                const newStreak = await calculateShotsMadeInRow(instance_id);
                if (newStreak === 3) {
                  // sound.play();
                }
              }
              await fetchTeamsAndPlayers();
              await updateTeamScores();
            } catch (error) {
              console.error('Error processing shot change:', error);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(playerInstanceChannel);
        supabase.removeChannel(teamChannel);
        supabase.removeChannel(playerChannel);
        supabase.removeChannel(shotChannel);
      };
  }, [userView ]);

 return (
  <div className={styles.userContainer}>
    <Header seasonTitle={`${season.season_name} Standings`} />

    {/* Main Content Section */}
    <main className={styles.userContent}>
        {/* Standings View*/}
        <div className={styles.container}>
          <div className={styles.teams}>
            {teams.map((team, index) => (
              <div
                key={index}
                className={`${styles.team} ${teamBorderClassMap[team.team_name] ?? ''}`}
              >
                {/* Team Title */}
                <div className={styles.teamHeader}>
                  {teamLogoMap[team.team_name] && (
                    <Image
                      className={styles.teamLogo}
                      src={teamLogoMap[team.team_name]}
                      alt={`${team.team_name} logo`}
                      width={teamLogoSizeMap[team.team_name] ?? 202}
                      height={teamLogoSizeMap[team.team_name] ?? 202}
                      sizes={`${teamLogoSizeMap[team.team_name] ?? 202}px`}
                    />
                  )}
                </div>
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
                {/* Table Headers */}
                <div className={styles.row}>
                  <span className={styles.columnHeader}>Name</span>
                  <span className={styles.columnHeader}>Score</span>
                  <span className={styles.columnHeader}>SL</span>
                  <span className={styles.columnHeader}>PPS</span>
                </div>
                {team.players.map((player, playerIndex) => (
                  <div key={playerIndex} className={styles.row}>
                    {/* Player Name and Icons */}
                    <div className={styles.playerNameColumn}>
                      <div
                        className={styles.playerName}
                        style={{
                          backgroundImage: `linear-gradient(90deg, ${player.tier_color}33 0%, ${player.tier_color}1A 60%, transparent 100%)`,
                        }}
                      >
                        <span className={styles.playerNameText}>{player.name}</span>
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
                      </div>
                  </div>
                    {/* Player Stats */}
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
              ))}
              </div>
            ))}
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

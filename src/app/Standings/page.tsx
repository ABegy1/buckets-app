'use client'; // Required in Next.js App Router
import React, { use, useEffect, useMemo, useState } from 'react';
import styles from './StandingsPage.module.css'; // Updated path for combined styles
import { supabase } from '@/supabaseClient';
import { FaFireFlameCurved } from "react-icons/fa6";
import { FaSnowflake } from "react-icons/fa6"; 
import {eachDayOfInterval, startOfMonth, endOfMonth, isWeekend} from 'date-fns'
import { usePathname, useRouter } from 'next/navigation';
import { Howl } from 'howler';

import { stat } from 'fs';

import Header from '@/components/Header';
import { useSettings } from '@/components/useSettings';

interface Team {
  team_id: number;
  team_name: string;
  team_score: number;
}

interface TeamWithPlayers {
  team_name: string;
  players: {
    shots_made_in_row: number;
    shots_missed_in_row: number;
    tier_color: string | undefined;
    name: string;
    shots_left: number;
    player_score: number;
  }[];
  total_shots: number;
  team_score: number;
}

interface Season {
  season_id: number;
  season_name: string;
  shot_total: number;
  rules: string;
}



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


// Function to calculate the current streak of consecutive missed shots
const calculateShotsMissedInRow = async (playerInstanceId: number) => {
  try {
    const { data: shots, error: shotsError } = await supabase
      .from('shots')
      .select('result')
      .eq('instance_id', playerInstanceId)
      .order('shot_date', { ascending: true });

    if (shotsError || !shots) throw shotsError;

    // Walk backwards from most recent shot
    let missStreak = 0;
    for (let i = shots.length - 1; i >= 0; i--) {
      if (shots[i].result === 0) {
        missStreak++;
      } else {
        break;
      }
    }

    return missStreak;
  } catch (error) {
    console.error('Error calculating shots missed in a row:', error);
    return 0;
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
      .single();

    if (seasonError || !activeSeason) throw seasonError;
    const activeSeasonId = activeSeason.season_id;

    // Fetch all teams
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('team_id, team_score');

    if (teamsError) throw teamsError;

    await Promise.all(
      teamsData.map(async (team: any) => {
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

//function to calculate the waiver waterline based on the number of valid shooting days in the month
const calculateWaiverWaterline = (date: Date, shotTotal: number, shotsPerDay: number): number =>{
  //get an array of dates containing the days left in the month
  const daysInMonth = eachDayOfInterval({
    start: date,
    end: endOfMonth(date),
  });

  // get the number of business days remaining in the month. shotsPerDay is configurable via the Settings page
  const remainingBusinessDays =  daysInMonth.filter(day => !isWeekend(day)).length;
  return remainingBusinessDays*shotsPerDay > shotTotal? shotTotal: remainingBusinessDays*shotsPerDay;
}

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
 const [waiverWaterline, setWaiverWaterline] = useState<number>(0); // Remaining shooting days in season
 const router = useRouter(); // Router for navigation
 const { shotsPerDay } = useSettings();

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
        .single();
  
      if (seasonError || !activeSeason) throw seasonError;
  
      const activeSeasonId = activeSeason.season_id;
      setSeason(activeSeason);
        // Fetch teams

      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('team_name, team_score, team_id');
  
      if (teamsError) throw teamsError;
        // Enrich teams with their players and stats

      const teamsWithPlayers: TeamWithPlayers[] = await Promise.all(
        teamsData.map(async (team: any) => {
          const { data: players, error: playersError } = await supabase
            .from('players')
            .select('*, tiers(color)')
            .eq('team_id', team.team_id);
          if (playersError) throw playersError;
  
          const playersWithStats = await Promise.all(
            players.map(async (player: any) => {
              const { data: playerInstance, error: piError } = await supabase
                .from('player_instance')
                .select('player_instance_id, shots_left, score')
                .eq('player_id', player.player_id)
                .eq('season_id', activeSeasonId)
                .single();
  
              if (piError || !playerInstance) throw piError;
              // Calculate streaks

              const shotsMadeInRow = await calculateShotsMadeInRow(playerInstance.player_instance_id);
              const shotsMissedInRow = await calculateShotsMissedInRow(playerInstance.player_instance_id);
              console.log(shotsMadeInRow, shotsMissedInRow);
              return {
                name: player.name,
                shots_left: playerInstance.shots_left,
                player_score: playerInstance.score,
                tier_color: player.tiers?.color || '#000',
                shots_made_in_row: shotsMadeInRow,
                shots_missed_in_row: shotsMissedInRow,
              };
            })
          );
  
          // Sort players by their score, descending
          playersWithStats.sort((a, b) => b.player_score - a.player_score);
          // Calculate total shots left for the team

          const totalShots = playersWithStats.reduce((acc, player) => acc + player.shots_left, 0);
  
          return {
            team_name: team.team_name,
            players: playersWithStats,
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

/**
 * Set up timers for updating the waiver waterline every day
 */
  useEffect(() => {
    const now = new Date();
const midnight = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate() + 1,
  0, 0, 0, 0
);
const timeUntilMidnight = midnight.getTime() - now.getTime(); 


    const timeout = setTimeout(() => {
      //calculate waterline at the next midnight from mount
      setWaiverWaterline(calculateWaiverWaterline(new Date(), season.shot_total, shotsPerDay));
      console.log("Setting waterline on first midnight to : ", calculateWaiverWaterline(new Date(), season.shot_total, shotsPerDay));
      // calculate waterline every day at midnight after first midnight from mount
      const interval = setInterval(() => {
        setWaiverWaterline(calculateWaiverWaterline(new Date(), season.shot_total, shotsPerDay));
        console.log("Setting waterline every midnight to : ", calculateWaiverWaterline(new Date(), season.shot_total, shotsPerDay));
      }, 24 * 60 * 60 * 1000); //every 24 hours

      return () => clearInterval(interval);
    }, timeUntilMidnight);

    //calculate waterline on mount
    setWaiverWaterline(calculateWaiverWaterline(new Date(), season.shot_total, shotsPerDay));
    console.log("Setting waterline on mount to : ", calculateWaiverWaterline(new Date(), season.shot_total, shotsPerDay));

    return () => clearTimeout(timeout);
  }, [season.shot_total, shotsPerDay]);

 return (
  <div className={styles.userContainer}>
    <Header></Header>

    {/* Main Content Section */}
    <main className={styles.userContent}>
        {/* Standings View*/}
        <div className={styles.container}>
          <h2 className={styles.seasonTitle}>{season.season_name} Standings</h2>
          <div className={styles.teams}>
            {teams.map((team, index) => (
              <div key={index} className={styles.team}>
                {/* Team Title */}
                <h2 className={styles.teamTitle}>{team.team_name}</h2>
                {/* Table Headers */}
                <div className={styles.row}>
                  <span className={styles.columnHeader}>Name</span>
                  <span className={styles.columnHeader}>Shots Left</span>
                  <span className={styles.columnHeader}>Total Points</span>
                </div>
                {team.players.map((player, playerIndex) => (
                  <div key={playerIndex} className={styles.row}>
                    {/* Player Name and Icons */}
                    <div className={styles.playerNameColumn}>
                      <div className={styles.playerName}>
                        {/* Tier Color Indicator */}
                        <span
                          className={styles.colorCircle}
                          style={{ backgroundColor: player.tier_color }}
                        />
                        <span>{player.name}</span>
                        
                        {/* Fire Icon: 3+ Consecutive Makes */}
                        {player.shots_made_in_row >= 3 && (
                          <span className={styles.fireIcon}>
                            <FaFireFlameCurved />
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
                    <span className={styles.shotsLeft}>{player.shots_left}</span>
                    <span className={styles.totalPoints}>{player.player_score}</span>
                  </div>
                ))}
                {/* Team Stats */}
                <div className={styles.teamStats}>
                  <span>Team Shots Remaining: {team.total_shots}</span>
                  <span>Team Score: {team.team_score}</span>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.summary}>
            <div className={styles.summaryHeader}>
              <span>Total Shots Remaining</span>
              <span>Total Score</span>
              <span>Waiver Waterline</span>
            </div>
            <div className={styles.totalStats}>
              <span>{teams.reduce((a, index) => a + index.total_shots, 0)}</span>
              <span>{teams.reduce((a, index) => a + index.team_score, 0)}</span>
              <span>{waiverWaterline}</span>
            </div>
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

'use client'; // Required in Next.js App Router
import React, { use, useEffect, useMemo, useState } from 'react';
import styles from './StandingsPage.module.css'; // Updated path for combined styles
import { supabase } from '@/supabaseClient';
import { FaFireFlameCurved } from "react-icons/fa6";
import { FaSnowflake } from "react-icons/fa6"; 
import { Howl } from 'howler';

import { usePathname, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

import Image from 'next/image'
import bucketsLogo from "@/assets/images/buckets.png"
import scoreLogo from "@/assets/images/add.png" 
import standingsLogo from "@/assets/images/speedometer.png"
import freeAgencyLogo from "@/assets/images/bench.png"
import rulesLogo from "@/assets/images/document.png"
import statsLogo from "@/assets/images/analytics.png"
import userLogo from "@/assets/images/user.png" 
import adminLogo from "@/assets/images/administrator.png" 

import { stat } from 'fs';

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

// Function to calculate the current streak of consecutive made shots
const calculateShotsMadeInRow = async (playerInstanceId: number) => {
  try {
    const { data: shots, error: shotsError } = await supabase
      .from('shots')
      .select('result')
      .eq('instance_id', playerInstanceId)
      .order('shot_date', { ascending: true });

    if (shotsError || !shots) throw shotsError;

    let shotsMadeInRow = 0;
    let currentStreak = 0;

    shots.forEach((shot: { result: number }) => {
      if (shot.result !== 0) {
        currentStreak++;
      } else {
        currentStreak = 0; // Reset streak if missed
      }
      shotsMadeInRow = currentStreak;
    });

    return shotsMadeInRow;
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

    let shotsMissedInRow = 0;
    let currentMissStreak = 0;

    shots.forEach((shot: { result: number }) => {
      if (shot.result === 0) {
        currentMissStreak++;
      } else {
        currentMissStreak = 0; // Reset streak if made
      }
      shotsMissedInRow = currentMissStreak;
    });

    return shotsMissedInRow;
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

const StandingsPage: React.FC = () => {
 // State variables
 const [teams, setTeams] = useState<TeamWithPlayers[]>([]); // Stores the list of teams and their players
 const [userView, setUserView] = useState<string>('Standings'); // Tracks the current user view (e.g., Standings, FreeAgent, Rules)
 const [seasonName, setSeasonName] = useState<string>(''); // Name of the current season
 const [seasonRules, setSeasonRules] = useState<string>(''); // Rules of the current season
 const router = useRouter(); // Router for navigation
 const pathname = usePathname(); // Current pathname of the app

 // Initialize Howl for playing sound effects (memoized for performance)
 const sound = useMemo(() => new Howl({ src: ['/sounds/onfire.mp3'] }), []);
  /**
   * Navigates to the specified page.
   * @param page The target page to navigate to.
   */
  const handleNavigation = (page: string) => {
    router.push(`/${page}`);
  };

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
        .select('season_id, season_name, rules')
        .is('end_date', null)
        .single();
  
      if (seasonError || !activeSeason) throw seasonError;
  
      const activeSeasonId = activeSeason.season_id;
      setSeasonName(activeSeason.season_name);
      setSeasonRules(activeSeason.rules);
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
  
   /**
   * Fetches free agents and their stats for the FreeAgent view.
   */
  const fetchFreeAgents = async () => {
    try {
      const { data: activeSeason, error: seasonError } = await supabase
        .from('seasons')
        .select('season_id')
        .is('end_date', null)
        .single();
  
      if (seasonError || !activeSeason) throw seasonError;
      const activeSeasonId = activeSeason.season_id;
  
      const { data: freeAgents, error: freeAgentsError } = await supabase
        .from('players')
        .select('*, tiers(color)')
        .eq('is_free_agent', true);
  
      if (freeAgentsError) throw freeAgentsError;
  
      const freeAgentsWithStats = await Promise.all(
        freeAgents.map(async (player: any) => {
          const { data: playerInstance, error: piError } = await supabase
            .from('player_instance')
            .select('shots_left, score')
            .eq('player_id', player.player_id)
            .eq('season_id', activeSeasonId)
            .single();
  
          if (piError || !playerInstance) throw piError;
  
          return {
            name: player.name,
            shots_left: playerInstance.shots_left,
            player_score: playerInstance.score,
            tier_color: player.tiers?.color || '#000',
            shots_made_in_row: 0, // default
            shots_missed_in_row: 0, // default
          };
        })
      );
  
      return freeAgentsWithStats;
    } catch (error) {
      console.error('Error fetching free agents and stats:', error);
    }
  };
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

 // Additional `useEffect` for managing real-time subscriptions based on `userView`
  useEffect(() => {
    if (userView === 'FreeAgent') {
      const fetchAndSetFreeAgents = async () => {
        const freeAgents = await fetchFreeAgents();
        setTeams([{
          team_name: 'Free Agents', 
          players: freeAgents?.map(player => ({
            name: player.name,
            shots_left: player.shots_left,
            player_score: player.player_score, 
            tier_color: player.tier_color,
            shots_made_in_row: 0,
            shots_missed_in_row: 0
          })) ?? [],
          total_shots: 0,
          team_score: 0
        }]);
      };
  
      fetchAndSetFreeAgents();
  
      const playerInstanceChannel = supabase
        .channel('player-instance-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'player_instance' }, fetchAndSetFreeAgents)
        .subscribe();

      const playerChannel = supabase
        .channel('player-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, fetchAndSetFreeAgents)
        .subscribe();
  
      const shotChannel = supabase
        .channel('shots-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shots' }, fetchAndSetFreeAgents)
        .subscribe();
  
      return () => {
        supabase.removeChannel(playerInstanceChannel);
        supabase.removeChannel(playerChannel);
        supabase.removeChannel(shotChannel);
      };
    }

    if (userView === 'Standings') {
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
                  sound.play();
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
    }

    if (userView === 'Rules') {
      fetchTeamsAndPlayers();

      const seasonChannel = supabase
        .channel('season-rules-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'seasons' }, fetchTeamsAndPlayers)
        .subscribe();
      
      return () => {
        supabase.removeChannel(seasonChannel);
      };
    }
  }, [userView,sound ]);

 return (
  <div className={styles.userContainer}>
    {/* Header Section */}
    <header className={styles.navbar}>
      <div className={styles.navMenu}>
        <Image className={`${styles.navItem} dark:invert`} 
                  src={bucketsLogo}
                  alt='Buckets!'
                  width="75"
                  height="75"
        >
        </Image>
        <h1 className={`${styles.navbarTitle}`}>Buckets</h1>
      </div>
      <nav className={styles.navMenu}>
        {/* Navigation Buttons */}
        <Image className={`${styles.navItem} ${pathname === '/Admin' ? styles.active : ''} invert`} 
          src={scoreLogo}
          alt='Score'
          width="65"
          height="65"
          onClick={() => handleNavigation('Admin')}>
        </Image>
        <Image className={`${styles.navItem} ${pathname === '/Standings' ? styles.active : ''} invert`} 
          src={standingsLogo}
          alt='Standings'
          width="75"
          height="75"
          onClick={() => handleNavigation('Standings')}>
        </Image>
        <Image className={`${styles.navItem} ${pathname === '/FreeAgency' ? styles.active : ''} invert`} 
          src={freeAgencyLogo}
          alt='Free Agency'
          width="65"
          height="65"
          onClick={() => handleNavigation('FreeAgency')}>
        </Image>
        <Image className={`${styles.navItem} ${pathname === '/Rules' ? styles.active : ''} invert`} 
          src={rulesLogo}
          alt='Rules'
          width="65"
          height="65"
          onClick={() => handleNavigation('Rules')}>
        </Image>
        <Image className={`${styles.navItem} ${pathname === '/Stats' ? styles.active : ''} invert`} 
          src={statsLogo}
          alt='Stats'
          width="65"
          height="65"
          onClick={() => handleNavigation('Stats')}>
        </Image>
        <Image className={`${styles.navItem} ${pathname === '/User' ? styles.active : ''} invert`} 
          src={userLogo}
          alt='Stats'
          width="65"
          height="65">
        </Image>
        <Image className={`${styles.navItem} ${pathname === '/Admin' ? styles.active : ''} invert`} 
          src={adminLogo}
          alt='Stats'
          width="65"
          height="65"
          onClick={() => handleNavigation('Admin')}>
        </Image>
      </nav>
    </header>

    {/* Main Content Section */}
    <main className={styles.userContent}>
      {userView === 'Standings' ? (
        // Standings View
        <div className={styles.container}>
          <h2 className={styles.seasonTitle}>{seasonName} Standings</h2>
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
                  <span>Total Shots Remaining: {team.total_shots}</span>
                  <span>Total Score: {team.team_score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : userView === 'FreeAgent' ? (
        // Free Agent View
        <div className={styles.freeAgencyPage}>
          <h2>{seasonName} Free Agents</h2>
          <div className={styles.players}>
            {/* Table Headers */}
            <div className={styles.headerRow}>
              <span className={styles.columnHeader}>Name</span>
              <span className={styles.columnHeader}>Shots Left</span>
              <span className={styles.columnHeader}>Total Points</span>
            </div>
            {teams[0]?.players.map((player, playerIndex) => (
              <div
                key={playerIndex}
                className={styles.playerRow}
                style={{ display: 'flex', justifyContent: 'space-between' }}
              >
                {/* Player Info */}
                <span
                  className={styles.playerName}
                  style={{ color: player.tier_color, flex: 1, textAlign: 'center' }}
                >
                  {player.name}
                </span>
                <span
                  className={styles.shotsLeft}
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  {player.shots_left}
                </span>
                <span
                  className={styles.totalPoints}
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  {player.player_score}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : userView === 'Rules' ? (
        // Rules View
        <div className={styles.rulesPage}>
          <h2>{seasonName} Rules</h2>
          {/* Render Markdown Rules */}
          <ReactMarkdown>{seasonRules}</ReactMarkdown>
        </div>
      ) : null}
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

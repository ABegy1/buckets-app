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

interface Match {
  players: {
    name: string;
    rating: number;
    score: number;
  }[];
  season_id: number;
  date: Date;
}

interface Season {
  season_id: number;
  season_name: string;
  rules: string;
}

interface PlayerWithStats {
  id: number;
  name: string;
  rating: number;
  wins: number;
  losses: number;
  successive_wins: number;
  successive_losses: number;
  tier: number;
  is_hidden: boolean;
  is_inactive: boolean;
}


// Function to calculate the current streak of consecutive made shots
// const calculateShotsMadeInRow = async (playerInstanceId: number) => {
//   try {
//     const { data: shots, error: shotsError } = await supabase
//       .from('shots')
//       .select('result')
//       .eq('instance_id', playerInstanceId)
//       .order('shot_date', { ascending: true });

//     if (shotsError || !shots) throw shotsError;

//     // Walk backwards from the most recent shot
//     let makeStreak = 0;
//     for (let i = shots.length - 1; i >= 0; i--) {
//       if (shots[i].result !== 0) {
//         makeStreak++;
//       } else {
//         break;
//       }
//     }

//     return makeStreak;
//   } catch (error) {
//     console.error('Error calculating shots made in a row:', error);
//     return 0;
//   }
// };


// Function to calculate the current streak of consecutive missed shots
// const calculateShotsMissedInRow = async (playerInstanceId: number) => {
//   try {
//     const { data: shots, error: shotsError } = await supabase
//       .from('shots')
//       .select('result')
//       .eq('instance_id', playerInstanceId)
//       .order('shot_date', { ascending: true });

//     if (shotsError || !shots) throw shotsError;

//     // Walk backwards from most recent shot
//     let missStreak = 0;
//     for (let i = shots.length - 1; i >= 0; i--) {
//       if (shots[i].result === 0) {
//         missStreak++;
//       } else {
//         break;
//       }
//     }

//     return missStreak;
//   } catch (error) {
//     console.error('Error calculating shots missed in a row:', error);
//     return 0;
//   }
// };


const PucketsPage: React.FC = () => {
 // State variables
 const [matches, setMatches] = useState<Match[]>([]); // Stores the list of matches
 const [players, setPlayers] = useState<PlayerWithStats[]>([]); // Stores the list of players with their current stats
 const [userView, setUserView] = useState<string>('Standings'); // Tracks the current user view (e.g., Standings, FreeAgent, Rules)
 const [season, setSeason] = useState<Season>({
  season_id: -1,
  season_name: '',
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
   * Fetches matches and their players for the Standings view.
   * Includes player stats like wins, losses, rating
   */
  const fetchMatches = async () => {
    try {
            // Fetch active season details

      const { data: activeSeason, error: seasonError } = await supabase
        .schema('puckets')
        .from('seasons')
        .select('season_id, season_name, rules')
        .is('end_date', null)
        .single();
  
      if (seasonError || !activeSeason) throw seasonError;
  
      const activeSeasonId = activeSeason.season_id;
      setSeason(activeSeason);
        // Fetch teams

      const { data: matchData, error: matchError } = await supabase
        .schema('puckets')
        .from('match_details')
        .select('*')
        .eq('season_id', activeSeasonId);
  
      if (matchError) throw matchError;
        // Enrich teams with their players and stats

      const matches: Match[] = await Promise.all(
        matchData.map(async (match: any) => {
              return {
                players: [
                {
                  name: match.player1_name,
                  rating: match.rating,
                  score: match.player1_score
                },
                {
                  name: match.player2_name,
                  rating: match.player2_rating,
                  score: match.player2_score
                }],
                season_id: match.season_id,
                date: new Date(match.match_date),
              };
            })
          );
  
      // Sort the teams by team_score in descending order
      // teamsWithPlayers.sort((a, b) => b.team_score - a.team_score);
      setMatches(matches);
    } catch (error) {
      console.error('Error fetching match info:', error);
    }
  };

    /**
   * Fetches player info for the Standings view.
   * Includes player stats like wins, losses, rating
   */
    const fetchPlayers = async () => {
      try {
              // Fetch active season details
  
        const { data: activeSeason, error: seasonError } = await supabase
          .from('puckets.seasons')
          .select('season_id, season_name, rules')
          .is('end_date', null)
          .single();
    
        if (seasonError || !activeSeason) throw seasonError;
    
        const activeSeasonId = activeSeason.season_id;
        setSeason(activeSeason);
          // Fetch teams
  
        const { data: matchData, error: matchError } = await supabase
          .from('puckets.matches')
          .select('player1_instance_id, player1_rating, ' +
                  'player2_instance_id, player2_rating, match_date, ' +
                  'player1_score, player1_rating_result, player2_score, player2_rating_result')
          .eq('season_id', activeSeasonId);
    
        if (matchError) throw matchError;
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



 /**
   * Fetches the current user's view from the database.
   */
  const fetchUserView = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase
        .from('public.users')
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
      fetchMatches();

      // updateTeamScores();

      // Subscribe to changes in player_instance, team, player
      // const playerInstanceChannel = supabase
      //   .channel('player-instance-db-changes')
      //   .on('postgres_changes', { event: '*', schema: 'puckets', table: 'player_instance' }, () => {
      //     fetchMatchesAndPlayers();
      //     updateTeamScores();
      //   })
      //   .subscribe();

      // const teamChannel = supabase
      //   .channel('matches-db-changes')
      //   .on('postgres_changes', { event: '*', schema: 'puckets', table: 'teams' }, fetchMatchesAndPlayers)
      //   .subscribe();

      // const playerChannel = supabase
      //   .channel('player-db-changes')
      //   .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, fetchTeamsAndPlayers)
      //   .subscribe();

      // **Shots** subscription: check new shot, if 3rd consecutive => play sound
      // const shotChannel = supabase
      //   .channel('shots-db-changes')
      //   .on('postgres_changes', { event: '*', schema: 'public', table: 'shots' }, 
      //     async (payload) => {
      //       try {
      //         // Cast payload.new to a ShotsRow-like object
      //         const newRow = payload.new as { result: number; instance_id: number };

      //         const { result, instance_id } = newRow;
      //         // If it's a made shot (non-zero)
      //         if (result !== 0) {
      //           const newStreak = await calculateShotsMadeInRow(instance_id);
      //           if (newStreak === 3) {
      //             // sound.play();
      //           }
      //         }
      //         await fetchTeamsAndPlayers();
      //         await updateTeamScores();
      //       } catch (error) {
      //         console.error('Error processing shot change:', error);
      //       }
      //     }
      //   )
      //   .subscribe();

      // return () => {
      //   supabase.removeChannel(playerInstanceChannel);
      //   supabase.removeChannel(teamChannel);
      //   supabase.removeChannel(playerChannel);
      //   supabase.removeChannel(shotChannel);
      // };
  }, [userView ]);

 return (
  <div className={styles.userContainer}>
    <Header></Header>

    {/* Main Content Section */}
    <main className={styles.userContent}>
        {/* Standings View*/}
        <div className={styles.container}>
          <h2 className={styles.seasonTitle}>{season.season_name} Standings</h2>
          <div className={styles.teams}>
            {/* Table Headers */}
            <div className={styles.row}>
              <span className={styles.columnHeader}>Name</span>
              <span className={styles.columnHeader}>Shots Left</span>
              <span className={styles.columnHeader}>Total Points</span>
            </div>
            {matches.map((match, matchIndex) => (
              <div key={matchIndex} className={styles.row}>
                {/* Player Name and Icons */}
                <div className={styles.playerNameColumn}>
                  <div className={styles.playerName}>
                    <span>{match.players[0].name}</span>
                    <span>{match.players[0].score}</span>
                    <span>{match.players[1].name}</span>
                    <span>{match.players[1].score}</span>
                  </div>
                </div>
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

export default PucketsPage;

'use client'; // Required in Next.js App Router
import React, { useEffect, useState } from 'react';
import styles from './StandingsPage.module.css'; // Updated path for combined styles
import { supabase } from '@/supabaseClient';
// @ts-ignore
import { usePathname, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

interface Team {
  team_id: number;
  team_name: string;
}

interface PlayerInstance {
  player_instance_id: number;
  player_id: number;
  season_id: number;
  shots_left: number;
  score: number;  // Include score field from player_instance
}

interface Player {
  tiers: any;
  player_id: number;
  name: string;
  tier_id?: number; // Optional if not fetched
  team_id?: number; // Optional if not fetched
  is_free_agent: boolean; // Add this field
}

interface TeamWithPlayers {
  team_name: string;
  players: {
    tier_color: string | undefined;
    name: string;
    shots_left: number;
    total_points: number;
  }[];
  total_shots: number;
  total_points: number;
}

const StandingsPage: React.FC = () => {
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [userView, setUserView] = useState<string>('Standings'); // Default view
  const [seasonName, setSeasonName] = useState<string>(''); // New state for the season name
  const [seasonRules, setSeasonRules] = useState<string>(''); // New state for the season rules
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (page: string) => {
    router.push(`/${page}`);
  };
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/');
    } else {
      console.error('Sign out error:', error.message);
    }
  };
  // Fetch teams and players (for Standings view)
  const fetchTeamsAndPlayers = async () => {
    try {
      const { data: activeSeason, error: seasonError } = await supabase
        .from('seasons')
        .select('season_id, season_name, rules')
        .is('end_date', null)
        .single();
  
      if (seasonError || !activeSeason) throw seasonError;
  
      const activeSeasonId = activeSeason.season_id;
      setSeasonName(activeSeason.season_name);
      setSeasonRules(activeSeason.rules);
  
      const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*');
      if (teamsError) throw teamsError;
  
      const teamsWithPlayers: TeamWithPlayers[] = await Promise.all(
        teamsData.map(async (team: Team) => {
          const { data: players, error: playersError } = await supabase
            .from('players')
            .select('*, tiers(color)')
            .eq('team_id', team.team_id);
          if (playersError) throw playersError;
  
          const playersWithStats = await Promise.all(
            players.map(async (player: Player) => {
              const { data: playerInstance, error: playerInstanceError } = await supabase
                .from('player_instance')
                .select('shots_left, score')
                .eq('player_id', player.player_id)
                .eq('season_id', activeSeasonId)
                .single();
  
              if (playerInstanceError || !playerInstance) throw playerInstanceError;
  
              return {
                name: player.name,
                shots_left: playerInstance.shots_left,
                total_points: playerInstance.score,
                tier_color: player.tiers?.color || '#000',
              };
            })
          );
  
          // Sort players by total_points in ascending order
          playersWithStats.sort((a, b) => b.total_points - a.total_points);

  
          const totalShots = playersWithStats.reduce((acc, player) => acc + player.shots_left, 0);
          const totalPoints = playersWithStats.reduce((acc, player) => acc + player.total_points, 0);
  
          return {
            team_name: team.team_name,
            players: playersWithStats,
            total_shots: totalShots,
            total_points: totalPoints,
          };
        })
      );
  
      setTeams(teamsWithPlayers);
    } catch (error) {
      console.error('Error fetching teams, players, and season info:', error);
    }
  };
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
        .select('*, tiers(color)')  // Fetch tier color as well
        .eq('is_free_agent', true);
  
      if (freeAgentsError) throw freeAgentsError;
  
      const freeAgentsWithStats = await Promise.all(
        freeAgents.map(async (player: { player_id: number; name: string; tiers: { color: string } }) => {
          const { data: playerInstance, error: playerInstanceError } = await supabase
            .from('player_instance')
            .select('shots_left, score')
            .eq('player_id', player.player_id)
            .eq('season_id', activeSeasonId)
            .single();
  
          if (playerInstanceError || !playerInstance) throw playerInstanceError;
  
          return {
            name: player.name,
            shots_left: playerInstance.shots_left,
            total_points: playerInstance.score,
            tier_color: player.tiers?.color || '#000',  // Use player tier color or fallback to black
          };
        })
      );
  
      return freeAgentsWithStats;
    } catch (error) {
      console.error('Error fetching free agents and stats:', error);
    }
  };

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

      setUserView(data.View); // Set the current user view
    } catch (err) {
      console.error('Error fetching user view:', err);
    }
  };

  // Real-time updates for the user's View field
  useEffect(() => {
    const subscribeToUserViewChanges = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { user } = session;

      // Set up a real-time subscription for changes to the 'users' table
      const userViewChannel = supabase
        .channel('user-view-changes')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'users', filter: `email=eq.${user.email}` },
          (payload) => {
            const updatedView = payload.new.View;
            setUserView(updatedView); // Update the UI with the new view
          }
        )
        .subscribe();

      // Fetch the initial view
      fetchUserView();

      return () => {
        supabase.removeChannel(userViewChannel);
      };
    };

    subscribeToUserViewChanges();
  }, []);

  useEffect(() => {
    if (userView === 'FreeAgent') {
      const fetchAndSetFreeAgents = async () => {
        const freeAgents = await fetchFreeAgents();
        
        // Ensure freeAgents is always an array before passing to setTeams
        setTeams([{ 
          team_name: 'Free Agents', 
          players: freeAgents ?? [],  // Fallback to an empty array if freeAgents is undefined
          total_shots: 0, 
          total_points: 0 
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
      fetchTeamsAndPlayers();

      const playerInstanceChannel = supabase
        .channel('player-instance-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'player_instance' }, fetchTeamsAndPlayers)
        .subscribe();

      const teamChannel = supabase
        .channel('team-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, fetchTeamsAndPlayers)
        .subscribe();

      const playerChannel = supabase
        .channel('player-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, fetchTeamsAndPlayers)
        .subscribe();

      const shotChannel = supabase
        .channel('shots-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shots' }, fetchTeamsAndPlayers)
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
  }, [userView]);

  return (
    <div className={styles.userContainer}>
      <header className={styles.navbar}>
        <h1 className={styles.navbarTitle}>Buckets</h1>
        <nav className={styles.navMenu}>
          <button
            onClick={() => handleNavigation('Standings')}
            className={`${styles.navItem} ${
              pathname === '/Standings' ? styles.active : ''
            }`}
          >
            Standings
          </button>
          <button
            onClick={() => handleNavigation('FreeAgency')}
            className={`${styles.navItem} ${
              pathname === '/FreeAgency' ? styles.active : ''
            }`}
          >
            Free Agency
          </button>
          <button
            onClick={() => handleNavigation('Rules')}
            className={`${styles.navItem} ${
              pathname === '/Rules' ? styles.active : ''
            }`}
          >
            Rules
          </button>
          <button
            onClick={() => handleNavigation('Stats')}
            className={`${styles.navItem} ${
              pathname === '/Stats' ? styles.active : ''
            }`}
          >
            Stats
          </button>
        </nav>
      </header>
      <main className={styles.userContent}>
        {userView === 'Standings' ? (
          <div className={styles.container}>
            <h2 className={styles.seasonTitle}>{seasonName} Standings</h2> {/* Updated with seasonTitle class */}
            <div className={styles.teams}>
              {teams.map((team, index) => (
               <div key={index} className={styles.team}>
               <h2 className={styles.teamTitle}>{team.team_name}</h2>
               <div className={styles.row}>
                 <span className={styles.columnHeader}>Name</span>
                 <span className={styles.columnHeader}>Shots Left</span>
                 <span className={styles.columnHeader}>Total Points</span>
               </div>
               {team.players.map((player, playerIndex) => (
                 <div key={playerIndex} className={styles.row}>
                 <div className={styles.playerNameColumn}>
                   {/* Name column with colored circle */}
                   <div className={styles.playerName}>
                     <span 
                       className={styles.colorCircle} 
                       style={{ backgroundColor: player.tier_color }}>
                     </span>
                     <span>{player.name}</span>
                   </div>
                 </div>
                 <span className={styles.shotsLeft}>{player.shots_left}</span>
                 <span className={styles.totalPoints}>{player.total_points}</span>
               </div>
               ))}
               <div className={styles.teamStats}>
                 <span>Total Shots Remaining: {team.total_shots}</span>
                 <span>Total Score: {team.total_points}</span>
               </div>
             </div>
              ))}
            </div>
          </div>
        ) :userView === 'FreeAgent' ? (
          <div className={styles.freeAgencyPage}>
            <h2>{seasonName} Free Agents</h2>
            <div className={styles.players}>
              <div className={styles.headerRow}>
                <span className={styles.columnHeader}>Name</span>
                <span className={styles.columnHeader}>Shots Left</span>
                <span className={styles.columnHeader}>Total Points</span>
              </div>
              {teams[0]?.players.map((player, playerIndex) => (
                <div key={playerIndex} className={styles.playerRow} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className={styles.playerName} style={{ color: player.tier_color, flex: 1, textAlign: 'center' }}>{player.name}</span>
                <span className={styles.shotsLeft} style={{ flex: 1, textAlign: 'center' }}>{player.shots_left}</span>
                <span className={styles.totalPoints} style={{ flex: 1, textAlign: 'center' }}>{player.total_points}</span>
              </div>
              ))}
            </div>
          </div>
        ) : userView === 'Rules' ? (
          <div className={styles.rulesPage}>
            <h2>{seasonName} Rules</h2>
            <ReactMarkdown>{seasonRules}</ReactMarkdown>
          </div>
        ) : null}
      </main>
      <footer className={styles.userFooter}>
        <p>&copy; 2024 Buckets Game. All rights reserved.</p>
        <button className={styles.signOutButton} onClick={handleSignOut}>
          Sign Out
        </button>
      </footer>
    </div>
  );
};

export default StandingsPage;
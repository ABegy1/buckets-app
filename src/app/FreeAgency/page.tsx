'use client'; // Required in Next.js App Router
import React, { useEffect, useState } from 'react';
import styles from './FreeAgency.module.css'; // Updated path for combined styles
import { supabase } from '@/supabaseClient';
// @ts-ignore
import { usePathname, useRouter } from 'next/navigation';

interface PlayerInstance {
  player_instance_id: number;
  player_id: number;
  season_id: number;
  shots_left: number;
  score: number;
}

interface Player {
  player_id: number;
  name: string;
  tier_id?: number;
  team_id?: number;
  is_free_agent: boolean;
  tiers: any;
}

const FreeAgencyPage: React.FC = () => {
  const [seasonName, setSeasonName] = useState<string>(''); // State for the season name
  const [teams, setTeams] = useState<any[]>([]); // State for the free agents
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (page: string) => {
    router.push(`/${page}`);
  };

  // Fetch free agents
  const fetchFreeAgents = async () => {
    try {
      const { data: activeSeason, error: seasonError } = await supabase
        .from('seasons')
        .select('season_id, season_name')
        .is('end_date', null)
        .single();
  
      if (seasonError || !activeSeason) throw seasonError;
      const activeSeasonId = activeSeason.season_id;
      setSeasonName(activeSeason.season_name); // Set the season name
  
      const { data: freeAgents, error: freeAgentsError } = await supabase
        .from('players')
        .select('*, tiers(color)')
        .eq('is_free_agent', true);
  
      if (freeAgentsError) throw freeAgentsError;
  
      const freeAgentsWithStats = await Promise.all(
        freeAgents.map(async (player: Player) => {
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
  
      setTeams([{ 
        team_name: 'Free Agents', 
        players: freeAgentsWithStats,
        total_shots: 0, 
        total_points: 0 
      }]);
    } catch (error) {
      console.error('Error fetching free agents and stats:', error);
    }
  };

  useEffect(() => {
    fetchFreeAgents();
  }, []);

  return (
    <div className={styles.userContainer}>
      <header className={styles.navbar}>
        <h1 className={styles.navbarTitle}>Buckets</h1>
        <nav className={styles.navMenu}>
          <button
            onClick={() => handleNavigation('Standings')}
            className={`${styles.navItem} ${pathname === '/Standings' ? styles.active : ''}`}
          >
            Standings
          </button>
          <button
            onClick={() => handleNavigation('FreeAgency')}
            className={`${styles.navItem} ${pathname === '/FreeAgency' ? styles.active : ''}`}
          >
            Free Agency
          </button>
          <button
            onClick={() => handleNavigation('Rules')}
            className={`${styles.navItem} ${pathname === '/Rules' ? styles.active : ''}`}
          >
            Rules
          </button>
          <button
            onClick={() => handleNavigation('Stats')}
            className={`${styles.navItem} ${pathname === '/Stats' ? styles.active : ''}`}
          >
            Stats
          </button>
        </nav>
      </header>

      <main className={styles.userContent}>
        <div className={styles.freeAgencyPage}>
          <h2>{seasonName} Free Agents</h2>
          <div className={styles.players}>
            <div className={styles.headerRow}>
              <span className={styles.columnHeader}>Name</span>
              <span className={styles.columnHeader}>Shots Left</span>
              <span className={styles.columnHeader}>Total Points</span>
            </div>
            {teams[0]?.players.map((player : any, playerIndex : any) => (
              <div key={playerIndex} className={styles.playerRow} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className={styles.playerName} style={{ color: player.tier_color, flex: 1, textAlign: 'center' }}>{player.name}</span>
                <span className={styles.shotsLeft} style={{ flex: 1, textAlign: 'center' }}>{player.shots_left}</span>
                <span className={styles.totalPoints} style={{ flex: 1, textAlign: 'center' }}>{player.total_points}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className={styles.userFooter}>
        <p>&copy; 2024 Buckets Game. All rights reserved.</p>
        <button className={styles.signOutButton} onClick={() => { /* Add sign out logic here */ }}>
          Sign Out
        </button>
      </footer>
    </div>
  );
};

export default FreeAgencyPage;

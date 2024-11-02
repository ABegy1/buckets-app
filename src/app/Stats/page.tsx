'use client'; // Required in Next.js App Router
import React, { useEffect, useState, useCallback } from 'react';
import styles from './Stats.module.css';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';

const StatsPage: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [players, setPlayers] = useState<
        { player_id: number; name: string; seasons_played: number; mvp_awards: number; team_wins: number; total_shots: number; total_score: number }[]
    >([]);

    const handleNavigation = (page: string) => {
        router.push(`/${page}`);
    };

    // Fetch players and their stats, combining scores from `stats` and `player_instance`
    const fetchPlayerStats = useCallback(async () => {
        try {
            // Step 1: Fetch player names from the `players` table
            const { data: playersData, error: playersError } = await supabase
                .from('players')
                .select('player_id, name');
            
            if (playersError) throw playersError;

            // Step 2: Fetch `total_score` and `total_shots` from `stats`
            const { data: statsData, error: statsError } = await supabase
                .from('stats')
                .select('player_id, seasons_played, mvp_awards, team_wins, total_shots, total_score');
            
            if (statsError) throw statsError;

            // Step 3: Get the current season ID (where `end_date` is NULL)
            const { data: currentSeason, error: seasonError } = await supabase
                .from('seasons')
                .select('season_id')
                .is('end_date', null)
                .single();

            if (seasonError || !currentSeason) throw seasonError;

            const currentSeasonId = currentSeason.season_id;

            // Step 4: Fetch current season scores from `player_instance`
            const { data: currentSeasonData, error: instanceError } = await supabase
                .from('player_instance')
                .select('player_id, score')
                .eq('season_id', currentSeasonId);

            if (instanceError) throw instanceError;

            // Step 5: Combine data by adding `total_score` from `stats` with `score` from the current season
            const combinedData = playersData.map(player => {
                const playerStats = statsData.find(stat => stat.player_id === player.player_id);
                const currentSeasonScore = currentSeasonData.find(instance => instance.player_id === player.player_id)?.score || 0;

                return {
                    player_id: player.player_id,
                    name: player.name,
                    seasons_played: playerStats ? playerStats.seasons_played : 0,
                    mvp_awards: playerStats ? playerStats.mvp_awards : 0,
                    team_wins: playerStats ? playerStats.team_wins : 0,
                    total_shots: playerStats ? playerStats.total_shots : 0,
                    total_score: (playerStats ? playerStats.total_score : 0) + currentSeasonScore,
                };
            });

            setPlayers(combinedData);
        } catch (error) {
            console.error('Error fetching player stats:', error);
        }
    }, []);
    
    useEffect(() => {
        fetchPlayerStats();
    }, [fetchPlayerStats]);

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
                <div className={styles.container}>
                    <h2 className={styles.pageTitle}>Player Stats</h2>
                    <div className={styles.statsContainer}>
                        <div className={styles.statsList}>
                            {players.map(player => (
                                <div key={player.player_id} className={styles.playerStat}>
                                    <h2>{player.name}</h2>
                                    <p>Seasons Played: {player.seasons_played}</p>
                                    <p>MVP Awards: {player.mvp_awards}</p>
                                    <p>Team Wins: {player.team_wins}</p>
                                    <p>Total Shots: {player.total_shots}</p>
                                    <p>Total Score: {player.total_score}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <footer className={styles.userFooter}>
                <p>&copy; 2024 Buckets Game. All rights reserved.</p>
                <button className={styles.signOutButton}>Sign Out</button>
            </footer>
        </div>
    );
};

export default StatsPage;

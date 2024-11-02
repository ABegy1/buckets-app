'use client'; // Required in Next.js App Router
import React, { useEffect, useState, useCallback } from 'react';
import styles from './Stats.module.css';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';

const StatsPage: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [players, setPlayers] = useState<
        { player_id: number; name: string; seasons_played: number; mvp_awards: number; team_wins: number; total_shots: number; total_score: number; high: number; low: number; average_score: number; points_per_shot: number }[]
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

            // Step 2: Fetch `total_score`, `total_shots`, `high`, and `low` from `stats`
            const { data: statsData, error: statsError } = await supabase
                .from('stats')
                .select('player_id, seasons_played, mvp_awards, team_wins, total_shots, total_score, high, low');
            
            if (statsError) throw statsError;

            // Step 3: Get the current season data where `end_date` is NULL
            const { data: currentSeason, error: seasonError } = await supabase
                .from('seasons')
                .select('season_id, shot_total')
                .is('end_date', null)
                .single();

            if (seasonError || !currentSeason) throw seasonError;

            const currentSeasonId = currentSeason.season_id;
            const seasonShotTotal = currentSeason.shot_total;

            // Step 4: Fetch current season scores and shots left from `player_instance`
            const { data: currentSeasonData, error: instanceError } = await supabase
                .from('player_instance')
                .select('player_id, score, shots_left')
                .eq('season_id', currentSeasonId);

            if (instanceError) throw instanceError;

            // Step 5: Combine data for each player, adding up `total_score`, `high`, and `low`, and calculating shots taken
            const combinedData = playersData.map(player => {
                const playerStats = statsData.find(stat => stat.player_id === player.player_id);
                const currentInstance = currentSeasonData.find(instance => instance.player_id === player.player_id);
                const currentSeasonScore = currentInstance?.score || 0;
                const shotsLeft = currentInstance?.shots_left || 0;
                
                // Calculate shots taken this season
                const currentSeasonShots = seasonShotTotal - shotsLeft;

                // Calculate total values
                const totalShots = (playerStats ? playerStats.total_shots : 0) + currentSeasonShots;
                const totalScore = (playerStats ? playerStats.total_score : 0) + currentSeasonScore;
                const high = playerStats ? playerStats.high : 0;
                const low = playerStats ? playerStats.low : 1; // Use 1 to avoid division by zero

                // Calculate average score and points per shot
                const averageScore = high + low / 2;
                const pointsPerShot = totalShots > 0 ? totalScore / totalShots : 0;

                return {
                    player_id: player.player_id,
                    name: player.name,
                    seasons_played: playerStats ? playerStats.seasons_played : 0,
                    mvp_awards: playerStats ? playerStats.mvp_awards : 0,
                    team_wins: playerStats ? playerStats.team_wins : 0,
                    total_shots: totalShots,
                    total_score: totalScore,
                    high: high,
                    low: low,
                    average_score: averageScore,
                    points_per_shot: pointsPerShot,
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
                                    <p>High Score: {player.high}</p>
                                    <p>Low Score: {player.low}</p>
                                    <p>Average Score: {player.average_score.toFixed(2)}</p>
                                    <p>Points Per Shot: {player.points_per_shot.toFixed(2)}</p>
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

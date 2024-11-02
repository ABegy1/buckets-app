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

    // Fetch players and their stats, then combine the data
    const fetchPlayerStats = useCallback(async () => {
        console.log('Fetching players and their stats');

        // Step 1: Fetch player names from the players table
        const { data: playersData, error: playersError } = await supabase
            .from('players')
            .select('player_id, name');
        
        if (playersError) {
            console.error('Error fetching players:', playersError);
            return;
        }
        
        console.log('Fetched players:', playersData);

        // Step 2: Fetch stats data from the stats table
        const { data: statsData, error: statsError } = await supabase
            .from('stats')
            .select('player_id, seasons_played, mvp_awards, team_wins, total_shots, total_score');
        
        if (statsError) {
            console.error('Error fetching stats:', statsError);
            return;
        }

        console.log('Fetched stats:', statsData);

        // Step 3: Combine data by matching player_id
        const combinedData = playersData.map(player => {
            const playerStats = statsData.find(stat => stat.player_id === player.player_id);
            return {
                player_id: player.player_id,
                name: player.name,
                seasons_played: playerStats ? playerStats.seasons_played : 0,
                mvp_awards: playerStats ? playerStats.mvp_awards : 0,
                team_wins: playerStats ? playerStats.team_wins : 0,
                total_shots: playerStats ? playerStats.total_shots : 0,
                total_score: playerStats ? playerStats.total_score : 0,
            };
        });

        console.log('Combined player stats data:', combinedData);
        setPlayers(combinedData);
    }, []);
    
    // Real-time subscription to update total_score and total_shots
    const subscribeToRealTimeUpdates = useCallback(() => {
        const playerInstanceChannel = supabase
            .channel('player-instance-updates')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'player_instance' },
                async (payload) => {
                    const updatedScore = payload.new.score;
                    const previousScore = payload.old.score;
                    const scoreDifference = updatedScore - previousScore;

                    const { error } = await supabase
                        .from('stats')
                        .update({ total_score: supabase.rpc('increment', { column: 'total_score', value: scoreDifference }) })
                        .eq('player_id', payload.new.player_id);
                    
                    if (error) {
                        console.error('Error updating total_score:', error);
                    } else {
                        console.log('Updated total_score for player_id:', payload.new.player_id);
                    }

                    // Refresh data to reflect the real-time change
                    fetchPlayerStats();
                }
            )
            .subscribe();

        const shotChannel = supabase
            .channel('shots-inserts')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'shots' },
                async (payload) => {
                    const { error } = await supabase
                        .from('stats')
                        .update({ total_shots: supabase.rpc('increment', { column: 'total_shots', value: 1 }) })
                        .eq('player_id', payload.new.player_id);
                    
                    if (error) {
                        console.error('Error updating total_shots:', error);
                    } else {
                        console.log('Updated total_shots for player_id:', payload.new.player_id);
                    }

                    // Refresh data to reflect the real-time change
                    fetchPlayerStats();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(playerInstanceChannel);
            supabase.removeChannel(shotChannel);
        };
    }, [fetchPlayerStats]);

    useEffect(() => {
        fetchPlayerStats();
        subscribeToRealTimeUpdates();
    }, [fetchPlayerStats, subscribeToRealTimeUpdates]);

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

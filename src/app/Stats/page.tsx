'use client'; // Required in Next.js App Router
import React, { useCallback, useEffect, useState } from 'react';
import styles from './Stats.module.css'; // Updated path for combined styles
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';

const StatsPage: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [players, setPlayers] = useState<{ player_id: number; name: string }[]>([]);
    const [playerStats, setPlayerStats] = useState<{ [key: number]: { seasonsPlayed: number } }>({});

    const handleNavigation = (page: string) => {
        router.push(`/${page}`);
    };

    // Fetch player stats focusing only on seasons_played
    const fetchPlayerStats = useCallback(async () => {
        console.log('fetchPlayerStats: Start fetching players');
        const { data: players, error: playerError } = await supabase
            .from('players')
            .select('player_id, name');

        if (playerError) {
            console.error('Error fetching players:', playerError);
            return;
        }
        
        if (!players) {
            console.warn('No players fetched');
            return;
        }

        console.log('fetchPlayerStats: Players fetched successfully:', players);
        setPlayers(players);

        console.log('fetchPlayerStats: Start fetching stats');
        const { data: statsData, error: statsError } = await supabase
            .from('stats')
            .select('player_id, seasons_played');

        if (statsError) {
            console.error('Error fetching player stats:', statsError);
            return;
        }
        
        if (!statsData) {
            console.warn('No stats data fetched');
            return;
        }

        console.log('fetchPlayerStats: Stats data fetched successfully:', statsData);
        
        const newPlayerStats = statsData.reduce(
            (acc: { [key: number]: { seasonsPlayed: number } }, stat) => {
                console.log(`Mapping stat for player_id ${stat.player_id} with seasonsPlayed ${stat.seasons_played}`);
                acc[stat.player_id] = { seasonsPlayed: stat.seasons_played };
                return acc;
            }, {}
        );

        console.log('fetchPlayerStats: Setting player stats:', newPlayerStats);
        setPlayerStats(newPlayerStats);
    }, []);

    useEffect(() => {
        console.log('useEffect: Initial fetch of player stats');
        fetchPlayerStats();

        console.log('useEffect: Subscribing to stats table changes');
        // Subscribe to changes in the stats table for real-time updates
        const statsChannel = supabase
            .channel('stats-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stats' }, (payload) => {
                console.log('Real-time update received from stats table:', payload);
                fetchPlayerStats();
            })
            .subscribe();

        // Clean up subscription on component unmount
        return () => {
            console.log('useEffect: Cleaning up subscription');
            supabase.removeChannel(statsChannel);
        };
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
                                    <p>Seasons Played: {playerStats[player.player_id]?.seasonsPlayed || 0}</p>
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

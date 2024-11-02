'use client';
import React, { useCallback, useEffect, useState } from 'react';
import styles from './Stats.module.css';
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

    // Enhanced fetch with debug logs
    const fetchPlayerStats = useCallback(async () => {
        console.log('fetchPlayerStats: Start fetching players with seasons_played');
        
        // Fetch players and their seasons_played in one query
        const { data, error } = await supabase
            .from('players')
            .select(`
                player_id,
                name,
                stats (
                    seasons_played
                )
            `);
    
        if (error) {
            console.error('Error fetching players with seasons_played:', error);
            return;
        }
        
        if (!data || data.length === 0) {
            console.warn('No players or stats found');
            return;
        }
    
        console.log('fetchPlayerStats: Fetched players with seasons_played:', data);
    
        // Transform data to map player stats as needed
        const newPlayerStats = data.reduce((acc: { [key: number]: { seasonsPlayed: number } }, player: { player_id: number; stats: { seasons_played: number }[] }) => {
            acc[player.player_id] = { seasonsPlayed: player.stats[0]?.seasons_played || 0 };
            return acc;
        }, {});
    
        setPlayers(data);
        setPlayerStats(newPlayerStats);
    }, []);

    useEffect(() => {
        fetchPlayerStats();

        const statsChannel = supabase
            .channel('stats-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stats' }, (payload) => {
                console.log('Real-time update received from stats table:', payload);
                fetchPlayerStats();
            })
            .subscribe();

        return () => {
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

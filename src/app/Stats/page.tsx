'use client'; // Required in Next.js App Router
import React, { useEffect, useState, useCallback } from 'react';
import styles from './Stats.module.css';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';

const StatsPage: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [players, setPlayers] = useState<{ player_id: number; name: string; seasons_played: number | null }[]>([]);

    const handleNavigation = (page: string) => {
        router.push(`/${page}`);
    };

    // Fetch players with seasons_played using LEFT JOIN query
    const fetchPlayerStats = useCallback(async () => {
        console.log('Fetching players with seasons_played');

        const { data, error } = await supabase
            .rpc('custom_query', { // Replace with your own function if needed
                sql: `
                SELECT
                    p.player_id,
                    p.name,
                    s.seasons_played
                FROM
                    public.players p
                LEFT JOIN
                    public.stats s 
                ON
                    p.player_id = s.player_id;
                `
            });

        if (error) {
            console.error('Error fetching player stats:', error);
            return;
        }

        if (!data || data.length === 0) {
            console.warn('No players or stats data found');
            return;
        }

        console.log('Players with seasons_played:', data);
        setPlayers(data);
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
                                    <p>Seasons Played: {player.seasons_played ?? 0}</p>
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

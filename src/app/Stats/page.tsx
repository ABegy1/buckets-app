'use client'; // Required in Next.js App Router
import React, { useEffect, useState, useCallback } from 'react';
import styles from './Stats.module.css';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';

const StatsPage: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [players, setPlayers] = useState<{ player_id: number; name: string; seasons_played: number }[]>([]);

    const handleNavigation = (page: string) => {
        router.push(`/${page}`);
    };

    // Fetch players and their seasons_played separately, then combine the data
    const fetchPlayerStats = useCallback(async () => {
        console.log('Fetching players and their seasons_played');

        // Step 1: Fetch player names from the players table
        const { data: playersData, error: playersError } = await supabase
            .from('players')
            .select('player_id, name');
        
        if (playersError) {
            console.error('Error fetching players:', playersError);
            return;
        }

        // Step 2: Fetch seasons_played from the stats table
        const { data: statsData, error: statsError } = await supabase
            .from('stats')
            .select('player_id, seasons_played');
        
        if (statsError) {
            console.error('Error fetching stats:', statsError);
            return;
        }

        // Step 3: Combine data by matching player_id
        const combinedData = playersData.map(player => {
            const playerStats = statsData.find(stat => stat.player_id === player.player_id);
            return {
                player_id: player.player_id,
                name: player.name,
                seasons_played: playerStats ? playerStats.seasons_played : 0
            };
        });

        console.log('Combined player stats data:', combinedData);
        setPlayers(combinedData);
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

'use client'; // Required in Next.js App Router
import React, { useCallback, useEffect, useState } from 'react';
import styles from './Stats.module.css'; // Updated path for combined styles
// @ts-ignore
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';

const StatsPage: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [players, setPlayers] = useState<{ player_id: number; name: string }[]>([]);
    const [playerStats, setPlayerStats] = useState<{ [key: number]: { wins: number; mvpAwards: number; seasonsPlayed: number } }>({});

    const handleNavigation = (page: string) => {
        router.push(`/${page}`);
    };

    // Fetch and subscribe to real-time updates for player stats
    const fetchPlayerStats = useCallback(async () => {
        // Query active season
        const { data: activeSeason, error: seasonError } = await supabase
            .from('seasons')
            .select('season_id')
            .is('end_date', null)
            .single();

        const activeSeasonId = activeSeason?.season_id;

        if (!activeSeasonId || seasonError) {
            console.error('No active season found or error occurred:', seasonError);
            return;
        }

        // Fetch unique players
        const { data: players, error: playerError } = await supabase
            .from('players')
            .select('player_id, name');

        if (playerError) {
            console.error('Error fetching players:', playerError);
            return;
        }

        setPlayers(players);

        // Now, we fetch additional stats for each player (team wins, MVPs, seasons played)
        const newPlayerStats: { [key: number]: { wins: number; mvpAwards: number; seasonsPlayed: number } } = {};

        for (const player of players) {
            // Fetch total team wins by querying all seasons and counting wins for teams the player was part of
            const { data: teamWins } = await supabase
                .from('seasons')
                .select('team_id')
                .order('team_score', { ascending: false });

            let wins = 0;
            if (teamWins && teamWins.length > 0) {
                for (const win of teamWins) {
                    const { data: teamPlayers } = await supabase
                        .from('player_instance')
                        .select('player_id')
                        .eq('team_id', win.team_id);

                    if (teamPlayers?.some(tp => tp.player_id === player.player_id)) {
                        wins++;
                    }
                }
            }

            // Fetch MVP awards by looking for the player with the highest score each season
            const { data: mvp } = await supabase
                .from('player_instance')
                .select('player_id, score')
                .order('score', { ascending: false })
                .limit(1);

            const mvpAwards = mvp?.filter(m => m.player_id === player.player_id).length || 0;

            // Fetch the number of seasons played by querying player_instance
            const { data: seasonsPlayed } = await supabase
                .from('player_instance')
                .select('season_id')
                .eq('player_id', player.player_id);

            const uniqueSeasonsPlayed = Array.from(new Set(seasonsPlayed?.map(s => s.season_id)));

            newPlayerStats[player.player_id] = {
                wins,
                mvpAwards,
                seasonsPlayed: uniqueSeasonsPlayed.length ?? 0,
            };
        }

        setPlayerStats(newPlayerStats);
    }, []);

    useEffect(() => {
        fetchPlayerStats();

        return () => {
            supabase.removeAllChannels();
        };
    }, [fetchPlayerStats]);

    // Subscribe to real-time updates
    const subscribeToRealTimeUpdates = useCallback(async () => {
        const playerInstanceChannel = supabase
            .channel('player-instance-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'player_instance' },
                fetchPlayerStats
            )
            .subscribe();

        return () => {
            supabase.removeChannel(playerInstanceChannel);
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
                                    <p>Total Wins: {playerStats[player.player_id]?.wins || 0}</p>
                                    <p>MVP Awards: {playerStats[player.player_id]?.mvpAwards || 0}</p>
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

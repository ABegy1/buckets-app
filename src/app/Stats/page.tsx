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
    const [playerStats, setPlayerStats] = useState<{ [key: number]: { wins: number; mvpAwards: number; seasonsPlayed: number; totalPoints: number; totalShots: number } }>({});

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

        if (seasonError || !activeSeason) {
            console.error('No active season found or error occurred:', seasonError);
            return;
        }

        const activeSeasonId = activeSeason?.season_id;

        // Fetch unique players
        const { data: players, error: playerError } = await supabase
            .from('players')
            .select('player_id, name');

        if (playerError || !players) {
            console.error('Error fetching players:', playerError);
            return;
        }

        setPlayers(players);

        // Fetch stats concurrently for all players
        const playerStatsPromises = players.map(async (player) => {
            const [teamWinsResponse, mvpResponse, seasonsPlayedResponse, totalPointsResponse, totalShotsResponse] = await Promise.all([
                // Fetch total team wins
                supabase.from('seasons').select('team_id').order('team_score', { ascending: false }),
                // Fetch MVP awards
                supabase.from('player_instance').select('player_id, score').order('score', { ascending: false }).limit(1),
                // Fetch seasons played
                supabase.from('player_instance').select('season_id').eq('player_id', player.player_id),
                // Fetch total points
                supabase.from('player_instance').select('score').eq('player_id', player.player_id),
                // Fetch total shots
                supabase.from('shots').select('shot_id').in(
                    'instance_id',
                    (await supabase.from('player_instance').select('player_instance_id').eq('player_id', player.player_id)).data?.map(pi => pi.player_instance_id) || []
                ),
            ]);

            const teamWinsData = teamWinsResponse.data || [];
            const mvpData = mvpResponse.data || [];
            const seasonsPlayedData = seasonsPlayedResponse.data || [];
            const totalPointsData = totalPointsResponse.data || [];
            const totalShotsData = totalShotsResponse.data || [];

            let wins = 0;
            if (teamWinsData.length > 0) {
                for (const win of teamWinsData) {
                    const { data: teamPlayers } = await supabase.from('player_instance').select('player_id').eq('team_id', win.team_id);
                    if (teamPlayers?.some(tp => tp.player_id === player.player_id)) {
                        wins++;
                    }
                }
            }

            const mvpAwards = mvpData.filter(m => m.player_id === player.player_id).length || 0;
            const uniqueSeasonsPlayed = Array.from(new Set(seasonsPlayedData?.map(s => s.season_id))) || [];
            const totalPoints = totalPointsData.reduce((sum, instance) => sum + instance.score, 0) || 0;
            const totalShots = totalShotsData.length || 0;

            return {
                player_id: player.player_id,
                wins,
                mvpAwards,
                seasonsPlayed: uniqueSeasonsPlayed.length,
                totalPoints,
                totalShots,
            };
        });

        // Wait for all player stats to be fetched
        const newPlayerStatsArray = await Promise.all(playerStatsPromises);

        // Convert array to an object with player_id as the key
        const newPlayerStats = newPlayerStatsArray.reduce(
          (acc: { [key: number]: { wins: number; mvpAwards: number; seasonsPlayed: number; totalPoints: number; totalShots: number } }, stats) => {
            acc[stats.player_id] = stats;
            return acc;
          }, {}
        );

        setPlayerStats(newPlayerStats);
    }, []);

    // Subscribe to real-time updates
    const subscribeToRealTimeUpdates = useCallback(async () => {
        const playerInstanceChannel = supabase
            .channel('player-instance-db-changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'player_instance' },
                fetchPlayerStats
            )
            .subscribe();

        return () => {
            supabase.removeChannel(playerInstanceChannel);
        };
    }, [fetchPlayerStats]);

    useEffect(() => {
        fetchPlayerStats();
        subscribeToRealTimeUpdates();
        return () => {
            supabase.removeAllChannels();
        };
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
                                    <p>Total Team Wins: {playerStats[player.player_id]?.wins || 0}</p>
                                    <p>MVP Awards: {playerStats[player.player_id]?.mvpAwards || 0}</p>
                                    <p>Seasons Played: {playerStats[player.player_id]?.seasonsPlayed || 0}</p>
                                    <p>Total Points: {playerStats[player.player_id]?.totalPoints || 0}</p>
                                    <p>Total Shots: {playerStats[player.player_id]?.totalShots || 0}</p>
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

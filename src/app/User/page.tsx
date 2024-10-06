'use client'; // Required in Next.js App Router
import React, { useEffect, useState } from 'react';
import styles from './UserPage.module.css'; // Updated path for combined styles
import { supabase } from '@/supabaseClient';
import { useRouter } from 'next/navigation';

interface Team {
  team_id: number;
  team_name: string;
}

interface PlayerInstance {
  player_instance_id: number;
  player_id: number;
  season_id: number;
  team_id: number;
  shots_left: number;
}

interface Player {
  player_id: number;
  name: string;
  tier_id: number;
}

interface Shot {
  shot_id: number;
  instance_id: number;
  shot_date: string;
  result: string;
  tier_id: number;
}

interface TeamWithPlayers {
  team_name: string;
  players: {
    name: string;
    shots_left: number;
    total_points: number;
  }[];
  total_shots: number;
  total_points: number;
}

const UserPage: React.FC = () => {
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [userView, setUserView] = useState<string>('Standings'); // Default view
  const router = useRouter();

  // Function to fetch the user's view from the database
  const fetchUserView = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase
        .from('users')
        .select('View')
        .eq('email', session?.user?.email)
        .single();
      
      if (error || !data) {
        console.error('Error fetching user view:', error);
        return;
      }
      
      setUserView(data.View); // Set the current user view
    } catch (err) {
      console.error('Error fetching user view:', err);
    }
  };

  // Fetch teams and players (for Standings view)
  const fetchTeamsAndPlayers = async () => {
    try {
      const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*');
      if (teamsError) throw teamsError;

      const teamsWithPlayers: TeamWithPlayers[] = await Promise.all(
        teamsData.map(async (team: Team) => {
          const { data: playerInstances, error: playerInstancesError } = await supabase
            .from('player_instance')
            .select('*')
            .eq('team_id', team.team_id);
          if (playerInstancesError) throw playerInstancesError;

          const playersWithStats = await Promise.all(
            playerInstances.map(async (instance: PlayerInstance) => {
              const { data: player, error: playerError } = await supabase
                .from('players')
                .select('*')
                .eq('player_id', instance.player_id)
                .single();
              if (playerError) throw playerError;

              const { data: shots, error: shotsError } = await supabase
                .from('shots')
                .select('*')
                .eq('instance_id', instance.player_instance_id);
              if (shotsError) throw shotsError;

              const totalPoints = shots.reduce((acc: number, shot: Shot) => acc + parseInt(shot.result, 10), 0);

              return {
                name: player.name,
                shots_left: instance.shots_left,
                total_points: totalPoints,
              };
            })
          );

          const totalShots = playersWithStats.reduce((acc: number, player) => acc + player.shots_left, 0);
          const totalPoints = playersWithStats.reduce((acc: number, player) => acc + player.total_points, 0);

          return {
            team_name: team.team_name,
            players: playersWithStats,
            total_shots: totalShots,
            total_points: totalPoints,
          };
        })
      );

      setTeams(teamsWithPlayers);
    } catch (error) {
      console.error('Error fetching teams and players:', error);
    }
  };

  // Real-time updates for the user's View field
  useEffect(() => {
    const subscribeToUserViewChanges = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { user } = session;

      // Set up a real-time subscription for changes to the 'users' table
      const userViewChannel = supabase
        .channel('user-view-changes')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'users', filter: `email=eq.${user.email}` },
          (payload) => {
            const updatedView = payload.new.View;
            setUserView(updatedView); // Update the UI with the new view
          }
        )
        .subscribe();

      // Fetch the initial view
      fetchUserView();

      return () => {
        supabase.removeChannel(userViewChannel);
      };
    };

    subscribeToUserViewChanges();
  }, []);

  // Fetch teams and players data if the user view is Standings
  useEffect(() => {
    if (userView === 'Standings') {
      fetchTeamsAndPlayers();

      const teamChannel = supabase
        .channel('team-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, fetchTeamsAndPlayers)
        .subscribe();

      const playerInstanceChannel = supabase
        .channel('player-instance-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'player_instance' }, fetchTeamsAndPlayers)
        .subscribe();

      const shotChannel = supabase
        .channel('shots-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shots' }, fetchTeamsAndPlayers)
        .subscribe();

      return () => {
        supabase.removeChannel(teamChannel);
        supabase.removeChannel(playerInstanceChannel);
        supabase.removeChannel(shotChannel);
      };
    }
  }, [userView]);

  // Conditional rendering based on the user's view
  return (
    <div className={styles.userContainer}>
      <header className={styles.userHeader}>
        <h1>User Dashboard</h1>
      </header>
      <main className={styles.userContent}>
        {userView === 'Standings' ? (
          <div className={styles.container}>
            <h2>Season Standings</h2>
            <div className={styles.teams}>
              {teams.map((team, index) => (
                <div key={index} className={styles.team}>
                  <h2 className={styles.teamTitle}>{team.team_name}</h2>
                  <div className={styles.headerRow}>
                    <span>Name</span>
                    <span>Shots Left</span>
                    <span>Total Points</span>
                  </div>
                  {team.players.map((player, playerIndex) => (
                    <div key={playerIndex} className={styles.player}>
                      <span>{player.name}</span>
                      <span>{player.shots_left}</span>
                      <span>{player.total_points}</span>
                    </div>
                  ))}
                  <div className={styles.teamStats}>
                    <span>Total Shots Remaining: {team.total_shots}</span>
                    <span>Total Score: {team.total_points}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.freeAgencyPage}>
            <h2>This is the Free Agency page</h2>
            {/* You can add more functionality to the Free Agency UI here in the future */}
          </div>
        )}
        <button
          className={styles.btn}
          onClick={async () => {
            const { error } = await supabase.auth.signOut();
            if (!error) {
              router.push('/'); // Redirect to sign-in page
            } else {
              console.error('Sign out error:', error.message);
            }
          }}
        >
          Sign Out
        </button>
      </main>
      <footer className={styles.userFooter}>
        <p>&copy; 2024 Buckets Game. User Panel. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default UserPage;

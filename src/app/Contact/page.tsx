'use client';
import React, { useCallback, useEffect, useState } from 'react';
import styles from './SeasonStandings.module.css';
import { supabase } from '@/supabaseClient';
import { User } from '@supabase/supabase-js';

interface Player {
  name: string;
  shots: number;
  points: number;
}

interface TeamProps {
  teamName: string;
  players: Player[];
  stats: {
    shots: string;
    score: string;
  };
}

const useUserView = (fullName: string) => {
  const [view, setView] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = useCallback(async () => {
    try {
      const response = await fetch(`/api/addUser?full_name=${encodeURIComponent(fullName)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user view');
      }
      const data = await response.json();
      setView(data.view);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [fullName]);

  useEffect(() => {
    if (fullName) {
      fetchUserRole();
    }
  }, [fullName, fetchUserRole]);

  useEffect(() => {
    if (!fullName) return;

    const channel = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload: any) => {
          console.log('Realtime update received:', payload);
          fetchUserRole();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fullName, fetchUserRole]);

  return { view, loading };
};

const Team: React.FC<TeamProps> = ({ teamName, players, stats }) => (
  <div className={styles.team}>
    <h2>{teamName}</h2>
    <div className={styles.headerRow}>
      <span>Name</span>
      <span>Shots</span>
      <span>Points</span>
    </div>
    {players.map((player, index) => (
      <div key={index} className={styles.player}>
        <span>{player.name}</span>
        <span>{player.shots}</span>
        <span>{player.points}</span>
      </div>
    ))}
    <div className={styles.teamStats}>
      <span>{stats.shots}</span>
      <span>{stats.score}</span>
    </div>
  </div>
);

const SeasonStandings: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState<string>('');

  useEffect(() => {
    const getUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user?.user_metadata?.full_name) {
        setFullName(session.user.user_metadata.full_name);
      }
    };

    getUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.user_metadata?.full_name) {
        setFullName(session.user.user_metadata.full_name);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const { view, loading } = useUserView(fullName);

  useEffect(() => {
    if (view) {
      console.log('View updated:', view);
    }
  }, [view]);

  const teams = [
    {
      name: 'Team 1',
      players: [
        { name: 'Ryan', shots: 40, points: 40 },
        { name: 'Brad', shots: 40, points: 0 },
        { name: 'McNay', shots: 30, points: 11 },
        { name: 'David', shots: 20, points: 10 },
      ],
      stats: { shots: 'Shots Remaining: 130', score: 'Total Score: 21' }
    },
    {
      name: 'Team 2',
      players: [
        { name: 'Mason', shots: 40, points: 0 },
        { name: 'Jarrod', shots: 40, points: 0 },
        { name: 'Jay', shots: 40, points: 0 },
        { name: 'Zeiker', shots: 40, points: 0 },
      ],
      stats: { shots: 'Team Shots: 160', score: 'Team Score: 0' }
    },
    {
      name: 'Team 3',
      players: [
        { name: 'Alex', shots: 50, points: 20 },
        { name: 'Jordan', shots: 35, points: 15 },
        { name: 'Chris', shots: 25, points: 10 },
        { name: 'Taylor', shots: 45, points: 30 },
      ],
      stats: { shots: 'Shots Remaining: 100', score: 'Total Score: 75' }
    },
  ];

  return (
    <div className={styles.container}>
      <h1>{view === 'Free Agency' ? 'Free Agency' : 'Season Standings'}</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className={styles.teams}>
          {teams.map((team, index) => (
            <Team
              key={index}
              teamName={team.name}
              players={team.players}
              stats={team.stats}
            />
          ))}
        </div>
      )}
    </div>
  );
};

SeasonStandings.displayName = 'SeasonStandings';

export default SeasonStandings;

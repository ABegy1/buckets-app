'use client';
import React, { useEffect, useState } from 'react';
import styles from './SeasonStandings.module.css';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/supabaseClient';

const useUserView = (fullName: string) => {
  const [view, setView] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
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
    };

    if (fullName) {
      fetchUserRole();
    }
  }, [fullName]);

  return { view, setView, loading };
};

type TeamProps = {
  teamName: string;
  players: Array<{ name: string; shots: number; points: number }>;
  stats: { shots: string; score: string };
};

const Team = ({ teamName, players, stats }: TeamProps) => (
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

const SeasonStandings = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const { view } = useUserView(user?.user_metadata.full_name ?? '');

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
      <h1>{view === 'Agent' ? 'Free Agency' : 'Season Standings'}</h1>
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
    </div>
  );
};

SeasonStandings.displayName = 'SeasonStandings';

export default SeasonStandings;

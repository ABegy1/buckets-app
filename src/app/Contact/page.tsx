'use client'
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
        console.log(data)
        setView(data.view);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [fullName]);

  return { view, loading };
};

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

  if (view === 'Standings'){
    return (
      <div className={styles.container}>
        <h1>Season Standings</h1>
        <div className={styles.teams}>
          <div className={styles.team}>
            <h2>Team 1</h2>
            <div className={styles.headerRow}>
              <span>Name</span>
              <span>Shots</span>
              <span>Points</span>
            </div>
            <div className={styles.player}>
              <span>Ryan</span>
              <span>40</span>
              <span>40</span>
            </div>
            <div className={styles.player}>
              <span>Brad</span>
              <span>40</span>
              <span>0</span>
            </div>
            <div className={styles.player}>
              <span>McNay</span>
              <span>30</span>
              <span>11</span>
            </div>
            <div className={styles.player}>
              <span>David</span>
              <span>20</span>
              <span>10</span>
            </div>
            <div className={styles.teamStats}>
              <span>Shots Remaining: 130</span>
              <span>Total Score: 21</span>
            </div>
          </div>
          <div className={styles.team}>
            <h2>Team 2</h2>
            <div className={styles.headerRow}>
              <span>Name</span>
              <span>Shots</span>
              <span>Points</span>
            </div>
            <div className={styles.player}>
              <span>Mason</span>
              <span>40</span>
              <span>0</span>
            </div>
            <div className={styles.player}>
              <span>Jarrod</span>
              <span>40</span>
              <span>0</span>
            </div>
            <div className={styles.player}>
              <span>Jay</span>
              <span>40</span>
              <span>0</span>
            </div>
            <div className={styles.player}>
              <span>Zeiker</span>
              <span>40</span>
              <span>0</span>
            </div>
            <div className={styles.teamStats}>
              <span>Team Shots: 160</span>
              <span>Team Score: 0</span>
            </div>
          </div>
          <div className={styles.team}>
            <h2>Team 3</h2>
            <div className={styles.headerRow}>
              <span>Name</span>
              <span>Shots</span>
              <span>Points</span>
            </div>
            <div className={styles.player}>
              <span>Alex</span>
              <span>50</span>
              <span>20</span>
            </div>
            <div className={styles.player}>
              <span>Jordan</span>
              <span>35</span>
              <span>15</span>
            </div>
            <div className={styles.player}>
              <span>Chris</span>
              <span>25</span>
              <span>10</span>
            </div>
            <div className={styles.player}>
              <span>Taylor</span>
              <span>45</span>
              <span>30</span>
            </div>
            <div className={styles.teamStats}>
              <span>Shots Remaining: 100</span>
              <span>Total Score: 75</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  else {
  return (
    <div className={styles.container}>
      <h1>Free Agency</h1>
      <div className={styles.teams}>
        <div className={styles.team}>
          <h2>Team 1</h2>
          <div className={styles.headerRow}>
            <span>Name</span>
            <span>Shots</span>
            <span>Points</span>
          </div>
          <div className={styles.player}>
            <span>Ryan</span>
            <span>40</span>
            <span>40</span>
          </div>
          <div className={styles.player}>
            <span>Brad</span>
            <span>40</span>
            <span>0</span>
          </div>
          <div className={styles.player}>
            <span>McNay</span>
            <span>30</span>
            <span>11</span>
          </div>
          <div className={styles.player}>
            <span>David</span>
            <span>20</span>
            <span>10</span>
          </div>
          <div className={styles.teamStats}>
            <span>Shots Remaining: 130</span>
            <span>Total Score: 21</span>
          </div>
        </div>
        <div className={styles.team}>
          <h2>Team 2</h2>
          <div className={styles.headerRow}>
            <span>Name</span>
            <span>Shots</span>
            <span>Points</span>
          </div>
          <div className={styles.player}>
            <span>Mason</span>
            <span>40</span>
            <span>0</span>
          </div>
          <div className={styles.player}>
            <span>Jarrod</span>
            <span>40</span>
            <span>0</span>
          </div>
          <div className={styles.player}>
            <span>Jay</span>
            <span>40</span>
            <span>0</span>
          </div>
          <div className={styles.player}>
            <span>Zeiker</span>
            <span>40</span>
            <span>0</span>
          </div>
          <div className={styles.teamStats}>
            <span>Team Shots: 160</span>
            <span>Team Score: 0</span>
          </div>
        </div>
        <div className={styles.team}>
          <h2>Team 3</h2>
          <div className={styles.headerRow}>
            <span>Name</span>
            <span>Shots</span>
            <span>Points</span>
          </div>
          <div className={styles.player}>
            <span>Alex</span>
            <span>50</span>
            <span>20</span>
          </div>
          <div className={styles.player}>
            <span>Jordan</span>
            <span>35</span>
            <span>15</span>
          </div>
          <div className={styles.player}>
            <span>Chris</span>
            <span>25</span>
            <span>10</span>
          </div>
          <div className={styles.player}>
            <span>Taylor</span>
            <span>45</span>
            <span>30</span>
          </div>
          <div className={styles.teamStats}>
            <span>Shots Remaining: 100</span>
            <span>Total Score: 75</span>
          </div>
        </div>
      </div>
    </div>
  );
}
};

SeasonStandings.displayName = 'SeasonStandings';

export default SeasonStandings;

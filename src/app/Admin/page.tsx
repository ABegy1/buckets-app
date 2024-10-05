'use client';
import React, { useEffect, useState } from 'react';
import styles from './adminPage.module.css';
import Modal from '@/components/Modal/Modal';
import Sidebar from '@/components/Sidebar/Sidebar';
import CurrentSeasonModal from '@/components/CurrentSeason/CurrentSeasonModal';
import NextSeasonModal from '@/components/NextSeason/NextSeason';
import { supabase } from '@/supabaseClient';
import { User } from '@supabase/supabase-js';

interface TierWithPlayers {
  tier_name: string;
  color: string;
  players: {
    name: string;
    player_id: number;
  }[];
}




const useUserView = (fullName: string) => {
  const [view, setView] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch(`/api/addUser?full_name=${encodeURIComponent(fullName)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user role');
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



const About = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tiers, setTiers] = useState<TierWithPlayers[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCurrentSeasonModalOpen, setIsCurrentSeasonModalOpen] = useState(false);
  const [isNextSeasonModalOpen, setIsNextSeasonModalOpen] = useState<boolean>(false);

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

  useEffect(() => {
    const fetchTiersAndPlayers = async () => {
      const { data: tiersData, error: tiersError } = await supabase
        .from('tiers')
        .select('tier_name, color, players(name, player_id)');

      if (tiersError) {
        console.error('Error fetching tiers:', tiersError);
      } else {
        setTiers(tiersData || []);
      }
    };

    fetchTiersAndPlayers();
  }, []);


  const { view, setView } = useUserView(user?.user_metadata.full_name ?? '');

  const handleOpenModal = (playerId: number, name: string) => {
    setSelectedName(name);
    setSelectedPlayerId(playerId);  // Save the player ID
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  const handleStandings = async () => {
    let newView: string | undefined = undefined;
    if (view === 'Agent') {
      newView = 'Standings';
    } else if (view === 'Standings') {
      newView = 'Agent';
    }
    console.log(newView);
    try {
      if (user) {
        const response = await fetch('/api/addUser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: user.user_metadata.full_name, view: newView }),
        });

        if (!response.ok) {
          throw new Error('Failed to update user view');
        } else {
          const data = await response.json();
          setView(newView || null);  // Update the view state here
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleOpenCurrentSeasonModal = () => {
    setIsCurrentSeasonModalOpen(true);
    setIsSidebarOpen(false);
  };

  const handleCloseCurrentSeasonModal = () => {
    setIsCurrentSeasonModalOpen(false);
  };

  const handleOpenNextSeasonModal = () => {
    setIsNextSeasonModalOpen(true);
    setIsCurrentSeasonModalOpen(false);
  };

  const handleCloseNextSeasonModal = () => {
    setIsNextSeasonModalOpen(false);
  };

  const handleStartSeason = () => {
    console.log("Start Season clicked");
    setIsNextSeasonModalOpen(false);
  };

  return (
    <div className={styles.aboutPage}>
      <div className={styles.container}>
        <div className={styles.secondaryScreenOptions}>
          <button className={styles.button} onClick={handleOpenSidebar}>Settings</button>
          <button className={styles.button} onClick={handleStandings}>Standings</button>
        </div>

        <div className={styles.players}>
  {tiers.map((tier) => (
    <div key={tier.tier_name} className={styles.column}>
      <div className={styles.header}>{tier.tier_name}</div>
      {tier.players.map((player) => (
        <div key={player.player_id} className={styles.box} onClick={() => handleOpenModal(player.player_id, player.name)}>
          {player.name}
        </div>
      ))}
    </div>
  ))}
        </div>
      </div>

      <Modal name={selectedName} isOpen={isModalOpen} onClose={handleCloseModal}  playerId={selectedPlayerId ?? 0} />      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={handleCloseSidebar} 
        onCurrentSeasonClick={handleOpenCurrentSeasonModal} 
        onStartSeasonClick={handleOpenNextSeasonModal}
      />
      <CurrentSeasonModal isOpen={isCurrentSeasonModalOpen} onClose={handleCloseCurrentSeasonModal} />
      <NextSeasonModal 
        isOpen={isNextSeasonModalOpen} 
        onClose={handleCloseNextSeasonModal} 
        onStartSeason={handleStartSeason} 
      />
    </div>
  );
};

About.displayName = 'About';

export default About;